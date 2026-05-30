import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Mail, Phone, Building, Calendar } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { supabase } from '../../lib/supabase.js'
import { format } from 'date-fns'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      return data
    }
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['client-orders', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <p className="text-gold font-display text-2xl animate-pulse">Loading...</p>
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <button
        onClick={() => navigate('/admin/clients')}
        className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Clients
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client Profile */}
        <div className="lg:col-span-1">
          <div className="bg-nyin-card border border-nyin-border rounded-lg p-6">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
              <span className="text-gold font-display text-3xl">
                {client?.full_name?.[0] ?? '?'}
              </span>
            </div>

            <h1 className="font-display text-2xl text-white mb-1">{client?.full_name}</h1>
            <p className="text-gray-500 text-sm mb-6">{client?.company_name ?? 'No company'}</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={14} className="text-gold shrink-0" />
                <span className="text-gray-400 truncate">{client?.email}</span>
              </div>
              {client?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={14} className="text-gold shrink-0" />
                  <span className="text-gray-400">{client?.phone}</span>
                </div>
              )}
              {client?.company_name && (
                <div className="flex items-center gap-3 text-sm">
                  <Building size={14} className="text-gold shrink-0" />
                  <span className="text-gray-400">{client?.company_name}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={14} className="text-gold shrink-0" />
                <span className="text-gray-400">
                  Joined {client?.created_at ? format(new Date(client.created_at), 'MMM yyyy') : '—'}
                </span>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-nyin-border">
              <div className="text-center">
                <p className="text-gold font-display text-3xl">{orders.length}</p>
                <p className="text-gray-600 text-xs mt-1">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-green-400 font-display text-3xl">
                  ${orders.reduce((sum, o) => sum + (o.total_value ?? 0), 0).toLocaleString()}
                </p>
                <p className="text-gray-600 text-xs mt-1">Total Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <div className="bg-nyin-card border border-nyin-border rounded-lg">
            <div className="p-5 border-b border-nyin-border">
              <h2 className="font-display text-xl text-white">Order History</h2>
            </div>
            <div className="divide-y divide-nyin-border">
              {orders.length === 0 && (
                <p className="text-gray-600 text-sm p-6 text-center">No orders for this client</p>
              )}
              {orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  className="p-4 hover:bg-nyin-surface cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-gold text-sm font-medium">{order.order_number}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{order.order_type} · {order.commodity ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-white text-sm">${order.total_value?.toLocaleString() ?? '—'}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}