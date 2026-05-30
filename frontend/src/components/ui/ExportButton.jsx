import { Download } from 'lucide-react'

function toCSV(data, columns) {
  const header = columns.map(c => c.label).join(',')
  const rows   = data.map(row =>
    columns.map(c => {
      const val = c.value(row)
      // Escape commas and quotes
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val ?? ''
    }).join(',')
  )
  return [header, ...rows].join('\n')
}

function download(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportOrdersButton({ orders }) {
  const handleExport = () => {
    const csv = toCSV(orders, [
      { label: 'Order Number',  value: r => r.order_number },
      { label: 'Client',        value: r => r.profiles?.company_name ?? r.profiles?.full_name ?? '' },
      { label: 'Type',          value: r => r.order_type },
      { label: 'Commodity',     value: r => r.commodity ?? '' },
      { label: 'Quantity',      value: r => r.quantity ?? '' },
      { label: 'Unit',          value: r => r.unit ?? '' },
      { label: 'Unit Price',    value: r => r.unit_price ?? '' },
      { label: 'Total Value',   value: r => r.total_value ?? '' },
      { label: 'Currency',      value: r => r.currency ?? 'USD' },
      { label: 'Status',        value: r => r.status },
      { label: 'Origin',        value: r => r.origin_location ?? '' },
      { label: 'Destination',   value: r => r.destination_location ?? '' },
      { label: 'Created',       value: r => new Date(r.created_at).toLocaleDateString() },
    ])
    download(csv, `nyin-orders-${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all"
      style={{
        borderColor: 'var(--border)',
        color: 'var(--text-muted)',
        background: 'var(--card)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--gold)'
        e.currentTarget.style.color = 'var(--gold)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--text-muted)'
      }}
    >
      <Download size={12} />
      Export CSV
    </button>
  )
}

export function ExportInvoicesButton({ invoices }) {
  const handleExport = () => {
    const csv = toCSV(invoices, [
      { label: 'Invoice Number', value: r => r.invoice_number },
      { label: 'Client',         value: r => r.profiles?.company_name ?? r.profiles?.full_name ?? '' },
      { label: 'Order Ref',      value: r => r.orders?.order_number ?? '' },
      { label: 'Subtotal',       value: r => r.subtotal ?? '' },
      { label: 'Tax Rate',       value: r => r.tax_rate ?? 0 },
      { label: 'Tax Amount',     value: r => r.tax_amount ?? 0 },
      { label: 'Total Amount',   value: r => r.total_amount ?? '' },
      { label: 'Currency',       value: r => r.currency ?? 'USD' },
      { label: 'Status',         value: r => r.status },
      { label: 'Due Date',       value: r => r.due_date ?? '' },
      { label: 'Paid At',        value: r => r.paid_at ? new Date(r.paid_at).toLocaleDateString() : '' },
      { label: 'Created',        value: r => new Date(r.created_at).toLocaleDateString() },
    ])
    download(csv, `nyin-invoices-${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all"
      style={{
        borderColor: 'var(--border)',
        color: 'var(--text-muted)',
        background: 'var(--card)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--gold)'
        e.currentTarget.style.color = 'var(--gold)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--text-muted)'
      }}
    >
      <Download size={12} />
      Export CSV
    </button>
  )
}