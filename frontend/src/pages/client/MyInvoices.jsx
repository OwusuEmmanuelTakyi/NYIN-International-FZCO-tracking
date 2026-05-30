import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FileText, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import ClientLayout from '../../components/layout/ClientLayout.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { format } from 'date-fns'
import { PDFDownloadLink } from '@react-pdf/renderer'
import InvoicePDF from '../../components/invoices/InvoicePDF.jsx'

function InvoiceCard({ inv }) {
  const isPaid    = inv.status === 'Paid'
  const isOverdue = inv.status === 'Overdue'
  const isDraft   = inv.status === 'Draft'

  const accentColor = isPaid    ? '#4ade80'
                    : isOverdue ? '#f87171'
                    : isDraft   ? 'var(--text-dim)'
                    : 'var(--gold)'

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Top accent line */}
      <div className="h-0.5 w-full" style={{ background: accentColor }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: accentColor }}>
                {inv.invoice_number}
              </span>
              <StatusBadge status={inv.status} />
            </div>
            {inv.orders?.order_number && (
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Order: {inv.orders.order_number}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <p className="font-display text-2xl" style={{ color: accentColor }}>
              ${inv.total_amount?.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) ?? '—'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {inv.currency ?? 'USD'}
            </p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>
              Issued
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {inv.created_at ? format(new Date(inv.created_at), 'MMM d, yyyy') : '—'}
            </p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>
              Due Date
            </p>
            <p className="text-sm font-medium" style={{ color: isOverdue ? '#f87171' : 'var(--text)' }}>
              {inv.due_date ? format(new Date(inv.due_date), 'MMM d, yyyy') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Status messages */}
        {isOverdue && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4"
            style={{ background: 'color-mix(in srgb, #f87171 8%, transparent)', border: '1px solid color-mix(in srgb, #f87171 20%, transparent)' }}>
            <AlertCircle size={13} style={{ color: '#f87171' }} />
            <p className="text-xs" style={{ color: '#fca5a5' }}>
              This invoice is overdue. Please contact NYIN to arrange payment.
            </p>
          </div>
        )}

        {isPaid && inv.paid_at && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4"
            style={{ background: 'color-mix(in srgb, #4ade80 8%, transparent)', border: '1px solid color-mix(in srgb, #4ade80 20%, transparent)' }}>
            <CheckCircle size={13} style={{ color: '#4ade80' }} />
            <p className="text-xs" style={{ color: '#86efac' }}>
              Paid on {format(new Date(inv.paid_at), 'MMMM d, yyyy')}
            </p>
          </div>
        )}

        {!isPaid && !isOverdue && !isDraft && inv.due_date && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4"
            style={{ background: 'color-mix(in srgb, var(--gold) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--gold) 20%, transparent)' }}>
            <Clock size={13} style={{ color: 'var(--gold)' }} />
            <p className="text-xs" style={{ color: 'var(--gold-light)' }}>
              Payment due by {format(new Date(inv.due_date), 'MMMM d, yyyy')}
            </p>
          </div>
        )}

        {/* Line items preview */}
        {inv.line_items && inv.line_items.length > 0 && (
          <div className="mb-4 rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border)' }}>
            <div className="px-3 py-2 flex justify-between text-xs font-medium uppercase tracking-wider"
              style={{ background: 'var(--surface)', color: 'var(--text-dim)' }}>
              <span>Description</span>
              <span>Amount</span>
            </div>
            {inv.line_items.slice(0, 3).map((item, i) => (
              <div key={i} className="px-3 py-2 flex justify-between border-t"
                style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs truncate pr-4" style={{ color: 'var(--text-muted)', maxWidth: '70%' }}>
                  {item.description}
                </span>
                <span className="text-xs font-medium shrink-0" style={{ color: 'var(--gold)' }}>
                  ${parseFloat(item.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            {inv.line_items.length > 3 && (
              <div className="px-3 py-1.5 text-xs border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                +{inv.line_items.length - 3} more items
              </div>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="rounded-lg overflow-hidden mb-4"
          style={{ border: '1px solid var(--border)' }}>
          {inv.tax_rate > 0 && (
            <>
              <div className="px-3 py-2 flex justify-between border-b"
                style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Subtotal</span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>
                  ${inv.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                </span>
              </div>
              <div className="px-3 py-2 flex justify-between border-b"
                style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Tax ({inv.tax_rate}%)</span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>
                  ${inv.tax_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                </span>
              </div>
            </>
          )}
          <div className="px-3 py-2.5 flex justify-between"
            style={{ background: 'var(--surface)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Total</span>
            <span className="text-sm font-bold" style={{ color: accentColor }}>
              ${inv.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'} {inv.currency ?? 'USD'}
            </span>
          </div>
        </div>

        {/* Download button */}
        {!isDraft && (
          <PDFDownloadLink
            document={<InvoicePDF invoice={inv} />}
            fileName={`${inv.invoice_number}.pdf`}
            style={{ textDecoration: 'none', display: 'block' }}
            onClick={e => e.stopPropagation()}
          >
            {({ loading }) => (
              <div
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer"
                style={{
                  borderColor: loading ? 'var(--border)' : 'color-mix(in srgb, var(--gold) 40%, transparent)',
                  color: loading ? 'var(--text-dim)' : 'var(--gold)',
                  background: loading ? 'transparent' : 'color-mix(in srgb, var(--gold) 8%, transparent)',
                }}
              >
                <Download size={14} />
                {loading ? 'Preparing PDF...' : 'Download Invoice PDF'}
              </div>
            )}
          </PDFDownloadLink>
        )}
      </div>
    </div>
  )
}

export default function MyInvoices() {
  const { user } = useAuth()

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['client-invoices', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, orders:order_id(order_number)')
        .eq('client_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      return data ?? []
    },
    enabled: !!user
  })

  const unpaid  = invoices.filter(i => ['Sent','Viewed','Overdue'].includes(i.status))
  const paid    = invoices.filter(i => i.status === 'Paid')
  const other   = invoices.filter(i => !['Sent','Viewed','Overdue','Paid'].includes(i.status))

  const totalUnpaid = unpaid.reduce((s, i) => s + (i.total_amount ?? 0), 0)

  return (
    <ClientLayout>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl" style={{ color: 'var(--text)' }}>My Invoices</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Summary banner */}
      {unpaid.length > 0 && (
        <div className="rounded-xl border p-4 mb-8 flex items-center justify-between gap-4"
          style={{
            background: 'color-mix(in srgb, #f87171 5%, transparent)',
            borderColor: 'color-mix(in srgb, #f87171 20%, transparent)',
          }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'color-mix(in srgb, #f87171 15%, transparent)' }}>
              <AlertCircle size={16} style={{ color: '#f87171' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#fca5a5' }}>
                {unpaid.length} unpaid invoice{unpaid.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Total outstanding: ${totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Contact NYIN to arrange payment
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <p className="font-display text-2xl animate-pulse" style={{ color: 'var(--gold)' }}>
            Loading...
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && invoices.length === 0 && (
        <div className="rounded-xl border p-16 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--gold) 10%, transparent)' }}>
            <FileText size={24} style={{ color: 'var(--gold)' }} />
          </div>
          <p className="font-display text-xl mb-2" style={{ color: 'var(--text)' }}>
            No invoices yet
          </p>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Invoices from NYIN International will appear here
          </p>
        </div>
      )}

      {/* Unpaid invoices */}
      {unpaid.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={14} style={{ color: '#f87171' }} />
            <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>
              Action Required
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full border"
              style={{ color: '#f87171', borderColor: 'color-mix(in srgb, #f87171 30%, transparent)', background: 'color-mix(in srgb, #f87171 10%, transparent)' }}>
              {unpaid.length}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {unpaid.map(inv => <InvoiceCard key={inv.id} inv={inv} />)}
          </div>
        </div>
      )}

      {/* Paid invoices */}
      {paid.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={14} style={{ color: '#4ade80' }} />
            <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>
              Paid
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full border"
              style={{ color: '#4ade80', borderColor: 'color-mix(in srgb, #4ade80 30%, transparent)', background: 'color-mix(in srgb, #4ade80 10%, transparent)' }}>
              {paid.length}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {paid.map(inv => <InvoiceCard key={inv.id} inv={inv} />)}
          </div>
        </div>
      )}

      {/* Other (draft etc) */}
      {other.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={14} style={{ color: 'var(--text-dim)' }} />
            <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>Other</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {other.map(inv => <InvoiceCard key={inv.id} inv={inv} />)}
          </div>
        </div>
      )}
    </ClientLayout>
  )
}