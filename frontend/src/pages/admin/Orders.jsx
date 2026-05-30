import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Download } from 'lucide-react'
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

const STATUS_COLORS = {
  Initiated:      '#6B7280',
  'Due Diligence':'#60a5fa',
  Contracted:     '#fbbf24',
  'In Transit':   '#fb923c',
  Settled:        '#4ade80',
  Cancelled:      '#f87171',
}

export default function Orders() {
  const navigate = useNavigate()
  const { data: orders = [], isLoading } = useOrders()

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [typeFilter,   setTypeFilter]   = useState('All Types')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')

  const filtered = orders.filter(o => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.profiles?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      (o.commodity ?? '').toLowerCase().includes(search.toLowerCase())

    const matchStatus = statusFilter === 'All Statuses' || o.status === statusFilter
    const matchType   = typeFilter   === 'All Types'    || o.order_type === typeFilter

    const orderDate = new Date(o.created_at)
    const matchFrom = !dateFrom || orderDate >= new Date(dateFrom)
    const matchTo   = !dateTo   || orderDate <= new Date(dateTo + 'T23:59:59')

    return matchSearch && matchStatus && matchType && matchFrom && matchTo
  })

  // Stats
  const activeCount  = orders.filter(o => !['Settled','Cancelled'].includes(o.status)).length
  const settledCount = orders.filter(o => o.status === 'Settled').length
  const totalValue   = orders.reduce((s, o) => s + (o.total_value ?? 0), 0)

  return (
    <AdminLayout>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--text)' }}>
            Orders
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            {orders.length} total · {activeCount} active · {settledCount} settled
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ExportOrdersButton orders={filtered} />
          <button
            onClick={() => navigate('/admin/orders/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--gold)', color: 'var(--bg)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Plus size={16} />
            New Order
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Orders',   value: orders.length,  color: 'var(--gold)' },
          { label: 'Active',         value: activeCount,    color: '#fb923c'     },
          { label: 'Total Value',    value: `$${(totalValue/1000).toFixed(0)}k`, color: '#4ade80' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border p-3 text-center"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="font-display text-2xl" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border p-4 mb-6 space-y-3"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: 'var(--text-dim)' }} />
          <span className="text-xs font-medium uppercase tracking-wider"
            style={{ color: 'var(--text-dim)' }}>
            Filters
          </span>
          {(search || statusFilter !== 'All Statuses' || typeFilter !== 'All Types' || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('All Statuses')
                setTypeFilter('All Types')
                setDateFrom('')
                setDateTo('')
              }}
              className="text-xs ml-auto transition-colors"
              style={{ color: 'var(--gold)' }}
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-dim)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order #, client, or commodity..."
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

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm border focus:outline-none transition-colors"
            style={{
              background:  'var(--surface)',
              borderColor: 'var(--border)',
              color:       'var(--text)',
            }}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm border focus:outline-none transition-colors"
            style={{
              background:  'var(--surface)',
              borderColor: 'var(--border)',
              color:       'var(--text)',
            }}
          >
            {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Date range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none"
              style={{
                background:  'var(--surface)',
                borderColor: 'var(--border)',
                color:       'var(--text)',
              }}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-dim)' }}>
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none"
              style={{
                background:  'var(--surface)',
                borderColor: 'var(--border)',
                color:       'var(--text)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      {(search || statusFilter !== 'All Statuses' || typeFilter !== 'All Types') && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
          Showing {filtered.length} of {orders.length} orders
        </p>
      )}

      {/* Table */}
      <div className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {[
                  { label: 'Order #',   w: '' },
                  { label: 'Client',    w: '' },
                  { label: 'Type',      w: 'hidden lg:table-cell' },
                  { label: 'Commodity', w: 'hidden md:table-cell' },
                  { label: 'Value',     w: '' },
                  { label: 'Status',    w: '' },
                  { label: 'Date',      w: 'hidden sm:table-cell' },
                  { label: '',          w: '' },
                ].map(({ label, w }) => (
                  <th key={label}
                    className={`text-left text-xs uppercase tracking-wider px-4 py-3 font-medium ${w}`}
                    style={{ color: 'var(--text-dim)' }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm"
                    style={{ color: 'var(--text-dim)' }}>
                    Loading orders...
                  </td>
                </tr>
              )}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                        style={{ background: 'color-mix(in srgb, var(--gold) 10%, transparent)' }}>
                        <Search size={20} style={{ color: 'var(--gold)' }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        No orders found
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                        Try adjusting your filters or search term
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {filtered.map((order, i) => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  className="border-b cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Order # */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: STATUS_COLORS[order.status] ?? '#6B7280' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                        {order.order_number}
                      </span>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {order.profiles?.company_name ?? order.profiles?.full_name ?? '—'}
                    </p>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {order.order_type}
                    </span>
                  </td>

                  {/* Commodity */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {order.commodity ?? '—'}
                    </span>
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {order.total_value
                        ? `$${order.total_value.toLocaleString()}`
                        : '—'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </span>
                  </td>

                  {/* Arrow */}
                  <td className="px-4 py-3">
                    <span style={{ color: 'var(--text-dim)' }}>→</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {filtered.length} order{filtered.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Total: <span className="font-semibold" style={{ color: 'var(--gold)' }}>
                ${filtered.reduce((s, o) => s + (o.total_value ?? 0), 0).toLocaleString()}
              </span>
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}