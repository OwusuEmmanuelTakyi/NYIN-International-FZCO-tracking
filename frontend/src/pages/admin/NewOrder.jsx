import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import { useCreateOrder } from '../../hooks/useOrders.js'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.js'

export default function NewOrder() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const createOrder = useCreateOrder()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm()

  const quantity = watch('quantity')
  const unitPrice = watch('unit_price')

  // Auto-calculate total
  const total = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)

  // Load clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, email')
        .eq('role', 'client')
      return data ?? []
    }
  })

  // Generate order number
  const { data: orderCount = 0 } = useQuery({
    queryKey: ['order-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
      return count ?? 0
    }
  })

  const orderNumber = `NYIN-${new Date().getFullYear()}-${String(orderCount + 1).padStart(3, '0')}`

  const onSubmit = async (data) => {
    await createOrder.mutateAsync({
      ...data,
      order_number: orderNumber,
      total_value: total,
      quantity: parseFloat(data.quantity),
      unit_price: parseFloat(data.unit_price),
      status: 'Initiated',
      created_by: user.id,
    })
    navigate('/admin/orders')
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <button
          onClick={() => navigate('/admin/orders')}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Orders
        </button>

        <h1 className="font-display text-4xl text-white mb-2">New Order</h1>
        <p className="text-gray-500 text-sm mb-8">Order number: <span className="text-gold">{orderNumber}</span></p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-nyin-card border border-nyin-border rounded-lg p-6 space-y-5">
            <h2 className="font-display text-xl text-white">Order Details</h2>

            {/* Client */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Client *</label>
              <select
                {...register('client_id', { required: 'Client is required' })}
                className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold"
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.company_name ?? c.full_name} — {c.email}
                  </option>
                ))}
              </select>
              {errors.client_id && <p className="text-red-400 text-xs mt-1">{errors.client_id.message}</p>}
              {clients.length === 0 && (
                <p className="text-yellow-500 text-xs mt-1">No clients yet — create a client account first in Supabase Auth</p>
              )}
            </div>

            {/* Order Type */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Order Type *</label>
              <select
                {...register('order_type', { required: 'Order type is required' })}
                className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold"
              >
                <option value="">Select type...</option>
                <option>Bullion Trade</option>
                <option>Streaming Agreement</option>
                <option>Advisory Engagement</option>
              </select>
              {errors.order_type && <p className="text-red-400 text-xs mt-1">{errors.order_type.message}</p>}
            </div>

            {/* Commodity + Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Commodity</label>
                <input
                  {...register('commodity')}
                  placeholder="e.g. Gold, Silver"
                  className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Unit</label>
                <select
                  {...register('unit')}
                  className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">Select unit...</option>
                  <option>troy oz</option>
                  <option>oz</option>
                  <option>kg</option>
                  <option>g</option>
                </select>
              </div>
            </div>

            {/* Quantity + Unit Price + Total */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Quantity</label>
                <input
                  {...register('quantity')}
                  type="number"
                  step="0.001"
                  placeholder="0"
                  className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Unit Price (USD)</label>
                <input
                  {...register('unit_price')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Total Value</label>
                <div className="w-full bg-nyin-bg border border-nyin-border rounded px-4 py-3 text-gold text-sm font-medium">
                  ${total.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Origin + Destination */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Origin</label>
                <input
                  {...register('origin_location')}
                  placeholder="e.g. Accra, Ghana"
                  className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Destination</label>
                <input
                  {...register('destination_location')}
                  placeholder="e.g. Dubai, UAE"
                  className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Any additional notes..."
                className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createOrder.isPending}
            className="w-full bg-gold hover:bg-gold-dark text-nyin-bg font-semibold py-3 rounded transition-colors disabled:opacity-50"
          >
            {createOrder.isPending ? 'Creating Order...' : 'Create Order'}
          </button>
        </form>
      </div>
    </AdminLayout>
  )
}