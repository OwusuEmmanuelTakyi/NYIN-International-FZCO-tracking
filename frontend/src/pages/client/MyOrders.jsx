import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Package, ArrowRight, FileText,
  TrendingUp, Clock, CheckCircle, DollarSign
} from 'lucide-react'
import ClientLayout from '../../components/layout/ClientLayout.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { format } from 'date-fns'

const STAGES = ['Initiated', 'Due Diligence', 'Contracted', 'In Transit', 'Settled']

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="rounded-xl border p-4"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
          {label}
        </p>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="font-display text-3xl" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{sub}</p>}
    </div>
  )
}

export default function MyOrders() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['client-orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      return data ?? []
    },
    enabled: !!user
  })

  const { data: invoices = [] } = useQuery({
    queryKey: ['client-invoices', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', user.id)
      return data ?? []
    },
    enabled: !!user
  })

  const activeOrders  = orders.filter(o => !['Settled','Cancelled'].includes(o.status))
  const settledOrders = orders.filter(o => o.status === 'Settled')
  const unpaidInvoices = invoices.filter(i => ['Sent','Viewed','Overdue'].includes(i.status))
  const totalValue    = orders.reduce((s, o) => s + (o.total_value ?? 0), 0)

  return (
    <ClientLayout>

      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full border flex items-center justify-center"
            style={{
              background: 'color-mix(in srgb, var(--gold) 15%, transparent)',
              borderColor: 'color-mix(in srgb, var(--gold) 25%, transparent)',
            }}>
            <span className="font-display text-xl" style={{ color: 'var(--gold)' }}>
              {profile?.full_name?.[0] ?? 'C'}
            </span>
          </div>
          <div>
            <h1 className="font-display text-3xl" style={{ color: 'var(--text)' }}>
              Welcome back, {profile?.full_name?.split(' ')[0]}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              {profile?.company_name ?? 'NYIN Client Portal'} ·{' '}
              {format(new Date(), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Active Orders"
          value={activeOrders.length}
          icon={Package}
          color="var(--gold)"
          sub={`${orders.length} total`}
        />
        <StatCard
          label="Completed"
          value={settledOrders.length}
          icon={CheckCircle}
          color="#4ade80"
          sub="Settled orders"
        />
        <StatCard
          label="Unpaid Invoices"
          value={unpaidInvoices.length}
          icon={FileText}
          color="#f87171"
          sub="Action required"
        />
        <StatCard
          label="Total Value"
          value={`$${(totalValue/1000).toFixed(0)}k`}
          icon={DollarSign}
          color="#60a5fa"
          sub="All orders"
        />
      </div>

      {/* Action Required Banner */}
      {unpaidInvoices.length > 0 && (
        <div
          className="rounded-xl border p-4 mb-6 flex items-center justify-between gap-4"
          style={{
            background: 'color-mix(in srgb, #f87171 5%, transparent)',
            borderColor: 'color-mix(in srgb, #f87171 20%, transparent)',
          }}
        >
          <div className="flex items-center gap-3">
            <FileText size={16} style={{ color: '#f87171' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#fca5a5' }}>
                {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Total outstanding: ${unpaidInvoices.reduce((s,i) => s + (i.total_amount ?? 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/client/invoices')}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0"
            style={{ background: '#f87171', color: '#fff' }}
          >
            View Invoices
          </button>
        </div>
      )}

      {/* Orders */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>
          My Orders
        </h2>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {orders.length} total
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <p className="font-display text-2xl animate-pulse" style={{ color: 'var(--gold)' }}>
            Loading...
          </p>
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="rounded-xl border p-16 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--gold) 10%, transparent)' }}>
            <Package size={24} style={{ color: 'var(--gold)' }} />
          </div>
          <p className="font-display text-xl mb-2" style={{ color: 'var(--text)' }}>
            No orders yet
          </p>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Your orders will appear here once initiated by NYIN
          </p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map(order => {
          const stageIndex = STAGES.indexOf(order.status)
          const progress = order.status === 'Cancelled' ? 0
            : order.status === 'Settled' ? 100
            : Math.round((stageIndex / (STAGES.length - 1)) * 100)

          return (
            <div key={order.id}
              onClick={() => navigate(`/client/orders/${order.id}`)}
              className="rounded-xl border p-5 cursor-pointer transition-all group"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--gold) 30%, transparent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--gold)' }}>
                      {order.order_number}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="font-display text-lg" style={{ color: 'var(--text)' }}>
                    {order.order_type}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {order.commodity ?? '—'} · {order.quantity} {order.unit}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-xl" style={{ color: 'var(--gold)' }}>
                    ${order.total_value?.toLocaleString() ?? '—'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {order.currency}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {order.status !== 'Cancelled' && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>
                    <span>{order.status === 'Settled' ? 'Completed' : 'In Progress'}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progress}%`,
                        background: order.status === 'Settled'
                          ? '#4ade80'
                          : 'var(--gold)',
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {format(new Date(order.created_at), 'MMM d, yyyy')}
                  {order.origin_location && order.destination_location &&
                    ` · ${order.origin_location} → ${order.destination_location}`}
                </p>
                <ArrowRight size={14} style={{ color: 'var(--text-dim)' }}
                  className="group-hover:text-gold transition-colors" />
              </div>
            </div>
          )
        })}
      </div>
    </ClientLayout>
  )
}