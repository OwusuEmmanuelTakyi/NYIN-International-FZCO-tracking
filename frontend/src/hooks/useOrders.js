import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { sendOrderNotification } from '../lib/emailService.js'
import toast from 'react-hot-toast'

const ORDER_SELECT = `
  *,
  profiles:client_id (
    id,
    full_name,
    company_name,
    email,
    phone
  )
`

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderData) => {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select(ORDER_SELECT)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order created successfully')

      // Log to activity timeline
      try {
        await supabase.from('activity_log').insert([{
          entity_type: 'order',
          entity_id:   data.id,
          action:      'order_created',
          metadata: {
            description:  'Order created',
            order_number: data.order_number,
          },
        }])
      } catch (e) {
        console.warn('Activity log failed:', e)
      }

      // Send email (non-blocking)
      if (data.profiles?.email) {
        sendOrderNotification({
          type:           'order_created',
          order:          data,
          recipientEmail: data.profiles.email,
          recipientName:  data.profiles.full_name ?? data.profiles.company_name,
        }).catch(console.warn)
      }
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(ORDER_SELECT)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', data.id] })
      queryClient.invalidateQueries({ queryKey: ['timeline', data.id] })
      toast.success('Order updated')

      // Log status changes
      if (data.status) {
        const action =
          data.status === 'Cancelled' ? 'order_cancelled' :
          data.status === 'Initiated' ? 'order_reopened'  :
          'status_updated'
        try {
          await supabase.from('activity_log').insert([{
            entity_type: 'order',
            entity_id:   data.id,
            action,
            metadata: {
              status:      data.status,
              description:
                action === 'order_cancelled' ? 'Order cancelled'   :
                action === 'order_reopened'  ? 'Order reopened'    :
                `Status changed to "${data.status}"`,
            },
          }])
        } catch (e) {
          console.warn('Activity log failed:', e)
        }
      }

      // Send email (non-blocking)
      if (data.profiles?.email && data.status) {
        let type = 'status_updated'
        if (data.status === 'Cancelled') type = 'order_cancelled'
        if (data.status === 'Initiated') type = 'order_reopened'
        sendOrderNotification({
          type,
          order:          data,
          recipientEmail: data.profiles.email,
          recipientName:  data.profiles.full_name ?? data.profiles.company_name,
        }).catch(console.warn)
      }
    },
    onError: (err) => toast.error(err.message),
  })
}