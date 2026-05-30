import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import { sendOrderNotification } from '../lib/emailService.js'
import toast from 'react-hot-toast'

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles:client_id(full_name, company_name, email)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    }
  })
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles:client_id(full_name, company_name, email, phone)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderData) => {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select('*, profiles:client_id(full_name, company_name, email)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order created successfully')
      // Send email to client
      if (data.profiles?.email) {
        await sendOrderNotification({
          type: 'order_created',
          order: data,
          recipientEmail: data.profiles.email,
          recipientName: data.profiles.full_name ?? data.profiles.company_name,
        })
      }
    },
    onError: (err) => toast.error(err.message)
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
        .select('*, profiles:client_id(full_name, company_name, email)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', data.id] })
      toast.success('Order updated')

      // Send appropriate email
      if (data.profiles?.email) {
        let type = 'status_updated'
        if (data.status === 'Cancelled') type = 'order_cancelled'
        if (data.status === 'Initiated' ) type = 'order_reopened'

        await sendOrderNotification({
          type,
          order: data,
          recipientEmail: data.profiles.email,
          recipientName: data.profiles.full_name ?? data.profiles.company_name,
        })
      }
    },
    onError: (err) => toast.error(err.message)
  })
}