import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, TrendingUp } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { ExportOrdersButton } from '../../components/ui/ExportButton.jsx'
import { useOrders } from '../../hooks/useOrders.js'
import { format } from 'date-fns'

const ORDER_TYPES = [
  'All Types',
  'Bullion Trade',
  'Streaming Agreement',
  'Advisory Engagement',
]

const STATUSES = [
  'All Statuses',
  'Initiated',
  'Due Diligence',
  'Contracted',
  'In Transit',
  'Settled',
  'Cancelled',
]

const STATUS_DOT = {
  'Initiated':     '#6B7280',
  'Due Diligence': '#60a5fa',
  'Contracted':    '#fbbf24',
  'In Transit':    '#fb923c',
  'Settled':       '#4ade80',
  'Cancelled':     '#f87171',
}

// ── SKELETON ROW ──────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
      {[120, 150, 110, 80, 90, 80, 90, 20].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div
            className="h-3 rounded"
            style={{
              background: 'var(--border)',
              width: `${w}px`,
              opacity: 0.5,
              animation: `pulse-gold ${1 + i * 0.1}s ease-in-out infinite`,
            }}
          />
        </td>
      ))}
    </tr>
  )
}

export default function Orders() {
  const navigate = useNavigate()
  const { data: orders = [], isLoading } = useOrders()

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [typeFilter,   setTypeFilter]   = useState('All Types')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [showFilters,  setShowFilters]  = useState(false)

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchSearch =
      o.order_number.toLowerCase().includes(q) ||
      (o.profiles?.full_name    ?? '').toLowerCase().includes(q) ||
      (o.profiles?.company_name ?? '').toLowerCase().includes(q) ||
      (o.commodity              ?? '').toLowerCase().includes(q)

    const matchStatus = statusFilter === 'All Statuses' || o.status === statusFilter
    const matchType   = typeFilter   === 'All Types'    || o.order_type === typeFilter

    const d     = new Date(o.created_at)
    const matchFrom = !dateFrom || d >= new Date(dateFrom)
    const matchTo   = !dateTo   || d <= new Date(dateTo + 'T23:59:59')

    return matchSearch && matchStatus && matchType && matchFrom && matchTo
  })

  const activeCount = orders.filter(o =>
    !['Settled', 'Cancelled'].includes(o.status)).length
  const totalValue  = orders.reduce((s, o) => s + (o.total_value ?? 0), 0)
  const hasFilters  = search || statusFilter !== 'All Statuses' ||
    typeFilter !== 'All Types' || dateFrom || dateTo

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('All Statuses')
    setTypeFilter('All Types')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <AdminLayout>

      {/* ── HEADER ──────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--text)' }}>
            Orders
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            {isLoading
              ? 'Loading...'
              : `${orders.length} total · ${activeCount} active`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportOrdersButton orders={filtered} />
          <button
            onClick={() => navigate('/admin/orders/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'var(--gold)', color: 'var(--bg)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Plus size={16} />
            New Order
          </button>
        </div>
      </div>

      {/* ── QUICK STATS ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Orders',  value: isLoading ? '—' : orders.length,                           color: 'var(--gold)'  },
          { label: 'Active',        value: isLoading ? '—' : activeCount,                             color: '#fb923c'      },
          { label: 'Total Value',   value: isLoading ? '—' : `$${(totalValue/1000).toFixed(0)}k`,     color: '#4ade80'      },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border p-4 text-center"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="font-display text-2xl" style={{ color }}>
              {isLoading ? (
                <span className="inline-block w-8 h-5 rounded animate-pulse"
                  style={{ background: 'var(--border)', verticalAlign: 'middle' }} />
              ) : value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── SEARCH + FILTER BAR ──────────────────────────── */}
      <div className="rounded-xl border mb-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>

        {/* Top row — search + toggle */}
        <div className="flex gap-3 p-4">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-dim)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search order #, client, or commodity..."
              className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm border focus:outline-none transition-colors"
              style={{
                background:  'var(--surface)',
                borderColor: 'var(--border)',
                color:       'var(--text)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all shrink-0"
            style={{
              borderColor: hasFilters
                ? 'color-mix(in srgb, var(--gold) 40%, transparent)'
                : 'var(--border)',
              color:       hasFilters ? 'var(--gold)' : 'var(--text-muted)',
              background:  hasFilters
                ? 'color-mix(in srgb, var(--gold) 8%, transparent)'
                : 'var(--surface)',
            }}
          >
            <Filter size={14} />
            Filters
            {hasFilters && (
              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--gold)' }} />
            )}
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 rounded-lg border text-xs transition-colors shrink-0"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="px-4 pb-4 border-t pt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
            style={{ borderColor: 'var(--border)' }}>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>
                Status
              </label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>
                Order Type
              </label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>
                From
              </label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>
                To
              </label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      {hasFilters && !isLoading && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
          Showing {filtered.length} of {orders.length} orders
        </p>
      )}

      {/* ── TABLE ───────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {[
                  { label: 'Order #',   cls: '' },
                  { label: 'Client',    cls: '' },
                  { label: 'Type',      cls: 'hidden lg:table-cell' },
                  { label: 'Commodity', cls: 'hidden md:table-cell' },
                  { label: 'Value',     cls: '' },
                  { label: 'Status',    cls: '' },
                  { label: 'Date',      cls: 'hidden sm:table-cell' },
                  { label: '',          cls: '' },
                ].map(({ label, cls }) => (
                  <th key={label}
                    className={`text-left text-xs uppercase tracking-wider px-4 py-3 font-medium ${cls}`}
                    style={{ color: 'var(--text-dim)' }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Skeleton rows while loading */}
              {isLoading && [...Array(6)].map((_, i) => <SkeletonRow key={i} />)}

              {/* Empty state */}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="py-16 text-center">
                      <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                        style={{ background: 'color-mix(in srgb, var(--gold) 10%, transparent)' }}>
                        <TrendingUp size={22} style={{ color: 'var(--gold)' }} />
                      </div>
                      <p className="font-display text-xl mb-1" style={{ color: 'var(--text)' }}>
                        {hasFilters ? 'No orders match your filters' : 'No orders yet'}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                        {hasFilters
                          ? 'Try adjusting your search or filters'
                          : 'Create your first order to get started'}
                      </p>
                      {hasFilters && (
                        <button onClick={clearFilters}
                          className="mt-3 text-sm underline"
                          style={{ color: 'var(--gold)' }}>
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!isLoading && filtered.map(order => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  className="border-b cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Order # */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: STATUS_DOT[order.status] ?? '#6B7280' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                        {order.order_number}
                      </span>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {order.profiles?.company_name ?? order.profiles?.full_name ?? '—'}
                    </p>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {order.order_type ?? '—'}
                    </span>
                  </td>

                  {/* Commodity */}
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {order.commodity ?? '—'}
                    </span>
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {order.total_value
                        ? `$${order.total_value.toLocaleString()}`
                        : '—'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </span>
                  </td>

                  {/* Arrow */}
                  <td className="px-4 py-3.5">
                    <span style={{ color: 'var(--text-dim)' }}>→</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer with totals */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {filtered.length} order{filtered.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Filtered total:{' '}
              <span className="font-semibold" style={{ color: 'var(--gold)' }}>
                ${filtered
                  .reduce((s, o) => s + (o.total_value ?? 0), 0)
                  .toLocaleString()}
              </span>
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}