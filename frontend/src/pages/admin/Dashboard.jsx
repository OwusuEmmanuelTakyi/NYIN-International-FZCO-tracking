import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Package, Clock, FileText, TrendingUp,
  AlertCircle, Plus, DollarSign,
  BarChart2, Users
} from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { supabase } from '../../lib/supabase.js'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

// ── SIMPLE BAR CHART ───────────────────────────────────────────
function BarChart({ data, color = 'var(--gold)' }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-sm transition-all duration-500 relative group"
            style={{
              height: `${Math.max((d.value / max) * 80, d.value > 0 ? 4 : 0)}px`,
              background: i === data.length - 1
                ? color
                : `color-mix(in srgb, ${color} 40%, transparent)`,
              minHeight: d.value > 0 ? '4px' : '0',
            }}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
              <div className="text-xs px-2 py-1 rounded whitespace-nowrap"
                style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                {d.label}: {d.value}
              </div>
            </div>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-dim)', fontSize: '9px' }}>
            {d.shortLabel}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── DONUT CHART ────────────────────────────────────────────────
function DonutChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return (
    <div className="flex items-center justify-center h-32">
      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>No data</p>
    </div>
  )

  let cumulative = 0
  const r = 40, cx = 50, cy = 50
  const circumference = 2 * Math.PI * r

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--border)" strokeWidth="12" />
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const pct    = seg.value / total
          const offset = circumference * (1 - cumulative)
          const dash   = circumference * pct
          cumulative  += pct
          return (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
            />
          )
        })}
        {/* Center text */}
        <text x="50" y="46" textAnchor="middle"
          style={{ fontSize: '14px', fontWeight: 'bold', fill: 'var(--text)' }}>
          {total}
        </text>
        <text x="50" y="58" textAnchor="middle"
          style={{ fontSize: '7px', fill: 'var(--text-dim)' }}>
          ORDERS
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {segments.filter(s => s.value > 0).map((seg, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {seg.label}
              </span>
            </div>
            <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--text)' }}>
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── STAT CARD ──────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="rounded-xl border p-5"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
          {label}
        </p>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="font-display text-4xl" style={{ color }}>{value}</p>
      {sub && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>{sub}</p>
      )}
    </div>
  )
}

// ── DASHBOARD ──────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, profiles:client_id(full_name, company_name)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('is_deleted', false)
      return data ?? []
    }
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'client')
        .eq('is_deleted', false)
      return data ?? []
    }
  })

  // ── STATS ──────────────────────────────────────────
  const activeOrders       = orders.filter(o => !['Settled','Cancelled'].includes(o.status))
  const pendingConfirm     = orders.filter(o => o.status === 'In Transit' && !o.client_confirmed_receipt)
  const unpaidInvoices     = invoices.filter(i => ['Sent','Overdue','Viewed'].includes(i.status))
  const totalRevenue       = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total_amount ?? 0), 0)
  const pendingRevenue     = unpaidInvoices.reduce((s, i) => s + (i.total_amount ?? 0), 0)

  const thisMonth = orders.filter(o => {
    const d = new Date(o.created_at)
    const n = new Date()
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  })

  // ── MONTHLY ORDERS CHART (last 6 months) ───────────
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date  = subMonths(new Date(), 5 - i)
    const start = startOfMonth(date)
    const end   = endOfMonth(date)
    const count = orders.filter(o => {
      const d = new Date(o.created_at)
      return d >= start && d <= end
    }).length
    return {
      label:      format(date, 'MMMM yyyy'),
      shortLabel: format(date, 'MMM'),
      value:      count,
    }
  })

  // ── MONTHLY REVENUE CHART ──────────────────────────
  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const date  = subMonths(new Date(), 5 - i)
    const start = startOfMonth(date)
    const end   = endOfMonth(date)
    const total = invoices
      .filter(inv => {
        if (inv.status !== 'Paid' || !inv.paid_at) return false
        const d = new Date(inv.paid_at)
        return d >= start && d <= end
      })
      .reduce((s, inv) => s + (inv.total_amount ?? 0), 0)
    return {
      label:      format(date, 'MMMM yyyy'),
      shortLabel: format(date, 'MMM'),
      value:      Math.round(total / 1000), // in $k
    }
  })

  // ── ORDER STATUS DONUT ─────────────────────────────
  const statusSegments = [
    { label: 'Initiated',     value: orders.filter(o => o.status === 'Initiated').length,     color: '#6B7280' },
    { label: 'Due Diligence', value: orders.filter(o => o.status === 'Due Diligence').length, color: '#60a5fa' },
    { label: 'Contracted',    value: orders.filter(o => o.status === 'Contracted').length,    color: '#fbbf24' },
    { label: 'In Transit',    value: orders.filter(o => o.status === 'In Transit').length,    color: '#fb923c' },
    { label: 'Settled',       value: orders.filter(o => o.status === 'Settled').length,       color: '#4ade80' },
  ]

  // ── COMMODITY BREAKDOWN ────────────────────────────
  const commodities = orders.reduce((acc, o) => {
    if (!o.commodity) return acc
    acc[o.commodity] = (acc[o.commodity] ?? 0) + 1
    return acc
  }, {})
  const commodityColors = ['var(--gold)', '#60a5fa', '#a78bfa', '#4ade80', '#fb923c']
  const commoditySegments = Object.entries(commodities).map(([name, val], i) => ({
    label: name, value: val, color: commodityColors[i % commodityColors.length]
  }))

  const recentOrders = orders.slice(0, 5)
  const alerts       = orders.filter(o => o.status === 'In Transit' && !o.client_confirmed_receipt)

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--text)' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            Overview of NYIN trading operations
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/orders/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: 'var(--gold)', color: 'var(--bg)' }}
        >
          <Plus size={16} />
          New Order
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Orders"          value={activeOrders.length}    icon={Package}    color="var(--gold)"  sub={`${thisMonth.length} this month`} />
        <StatCard label="Pending Confirmations"  value={pendingConfirm.length}  icon={Clock}      color="#fb923c"      sub="Awaiting client" />
        <StatCard label="Unpaid Invoices"        value={unpaidInvoices.length}  icon={FileText}   color="#f87171"      sub={`$${pendingRevenue.toLocaleString()} pending`} />
        <StatCard label="Total Revenue"          value={`$${(totalRevenue/1000).toFixed(0)}k`} icon={DollarSign} color="#4ade80" sub="Paid invoices" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* Monthly Orders */}
        <div className="rounded-xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg" style={{ color: 'var(--text)' }}>
              Monthly Orders
            </h2>
            <BarChart2 size={14} style={{ color: 'var(--text-dim)' }} />
          </div>
          <BarChart data={monthlyData} color="var(--gold)" />
        </div>

        {/* Monthly Revenue */}
        <div className="rounded-xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg" style={{ color: 'var(--text)' }}>
              Revenue ($k)
            </h2>
            <TrendingUp size={14} style={{ color: '#4ade80' }} />
          </div>
          <BarChart data={revenueData} color="#4ade80" />
        </div>

        {/* Order Status */}
        <div className="rounded-xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg" style={{ color: 'var(--text)' }}>
              Order Status
            </h2>
            <Package size={14} style={{ color: 'var(--text-dim)' }} />
          </div>
          <DonutChart segments={statusSegments} />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* Commodity Breakdown */}
        <div className="rounded-xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg" style={{ color: 'var(--text)' }}>
              By Commodity
            </h2>
          </div>
          {commoditySegments.length > 0
            ? <DonutChart segments={commoditySegments} />
            : <p className="text-xs text-center py-8" style={{ color: 'var(--text-dim)' }}>
                No commodity data
              </p>
          }
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="p-5 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>
              Recent Orders
            </h2>
            <button onClick={() => navigate('/admin/orders')}
              className="text-xs transition-colors"
              style={{ color: 'var(--gold)' }}>
              View all →
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentOrders.length === 0 && (
              <div className="p-10 text-center">
                <Package size={28} className="mx-auto mb-2" style={{ color: 'var(--text-dim)' }} />
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>No orders yet</p>
              </div>
            )}
            {recentOrders.map(order => (
              <div key={order.id}
                onClick={() => navigate(`/admin/orders/${order.id}`)}
                className="px-5 py-3.5 cursor-pointer transition-colors flex items-center justify-between gap-4"
                style={{ borderColor: 'var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--gold)' }}>
                    {order.order_number}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-dim)' }}>
                    {order.profiles?.company_name ?? order.profiles?.full_name ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    ${order.total_value?.toLocaleString() ?? '—'}
                  </p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts + Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Alerts */}
        <div className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>
              Alerts
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {alerts.length === 0 && (
              <div className="text-center py-6">
                <div className="w-8 h-8 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center mx-auto mb-2">
                  <CheckIcon />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>All clear</p>
              </div>
            )}
            {alerts.map(order => (
              <div key={order.id}
                onClick={() => navigate(`/admin/orders/${order.id}`)}
                className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                style={{
                  background: 'color-mix(in srgb, #fb923c 5%, transparent)',
                  borderColor: 'color-mix(in srgb, #fb923c 20%, transparent)',
                }}
              >
                <AlertCircle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {order.order_number}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#fb923c' }}>
                    Awaiting client confirmation
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 rounded-xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="font-display text-xl mb-4" style={{ color: 'var(--text)' }}>
            Quick Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Orders',    value: orders.length,     color: 'var(--gold)'  },
              { label: 'Total Clients',   value: clients.length,    color: '#60a5fa'       },
              { label: 'Settled Orders',  value: orders.filter(o => o.status === 'Settled').length,   color: '#4ade80' },
              { label: 'Cancelled Orders',value: orders.filter(o => o.status === 'Cancelled').length, color: '#f87171' },
              { label: 'Total Invoiced',  value: `$${(invoices.reduce((s,i) => s + (i.total_amount ?? 0), 0) / 1000).toFixed(0)}k`, color: 'var(--gold)' },
              { label: 'Paid Invoices',   value: invoices.filter(i => i.status === 'Paid').length,    color: '#4ade80' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-lg border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>{label}</p>
                <p className="font-display text-2xl font-semibold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}