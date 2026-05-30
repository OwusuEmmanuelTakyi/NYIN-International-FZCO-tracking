import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, Mail, Phone, Building } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import { supabase } from '../../lib/supabase.js'

export default function Clients() {
  const navigate = useNavigate()

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('client_id, status')
      return data ?? []
    }
  })

  const getClientStats = (clientId) => {
    const clientOrders = orders.filter(o => o.client_id === clientId)
    return {
      total: clientOrders.length,
      active: clientOrders.filter(o => !['Settled', 'Cancelled'].includes(o.status)).length,
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-white">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} registered clients</p>
        </div>
      </div>

      {isLoading && (
        <p className="text-gray-500 text-center py-12">Loading clients...</p>
      )}

      {!isLoading && clients.length === 0 && (
        <div className="bg-nyin-card border border-nyin-border rounded-lg p-12 text-center">
          <Users size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No clients yet</p>
          <p className="text-gray-600 text-xs mt-1">Create client accounts in Supabase Authentication</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(client => {
          const stats = getClientStats(client.id)
          return (
            <div
              key={client.id}
              className="bg-nyin-card border border-nyin-border rounded-lg p-5 hover:border-gold/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/admin/clients/${client.id}`)}
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <span className="text-gold font-display text-lg">
                    {client.full_name?.[0] ?? '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{client.full_name}</p>
                  <p className="text-gray-500 text-xs truncate">{client.company_name ?? 'No company'}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Mail size={11} />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Phone size={11} />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.company_name && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Building size={11} />
                    <span>{client.company_name}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-3 pt-4 border-t border-nyin-border">
                <div className="text-center">
                  <p className="text-gold font-display text-xl">{stats.total}</p>
                  <p className="text-gray-600 text-xs">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-green-400 font-display text-xl">{stats.active}</p>
                  <p className="text-gray-600 text-xs">Active</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}