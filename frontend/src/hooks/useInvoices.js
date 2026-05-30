import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          profiles:client_id (
            id,
            full_name,
            company_name,
            email,
            phone
          ),
          orders:order_id (
            id,
            order_number,
            order_type,
            commodity,
            total_value,
            currency
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 0,           // always refetch when tab focused
    refetchOnMount: true,   // refetch every time component mounts
  })
}

export function useInvoice(id) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          profiles:client_id (
            id,
            full_name,
            company_name,
            email,
            phone
          ),
          orders:order_id (
            id,
            order_number,
            order_type,
            commodity,
            total_value,
            currency,
            quantity,
            unit
          )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (invoiceData) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select(`
          *,
          profiles:client_id (
            id,
            full_name,
            company_name,
            email
          ),
          orders:order_id (
            id,
            order_number
          )
        `)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice created')
    },
    onError: (err) => toast.error(err.message)
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          profiles:client_id (
            id,
            full_name,
            company_name,
            email
          ),
          orders:order_id (
            id,
            order_number
          )
        `)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] })
      toast.success('Invoice updated')
    },
    onError: (err) => toast.error(err.message)
  })
}