import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, CheckCircle, Trash2,
  RotateCcw, Edit2, Save, X, Clock,
  FileText, Plus
} from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useInvoice, useUpdateInvoice } from '../../hooks/useInvoices.js'
import { PDFDownloadLink } from '@react-pdf/renderer'
import InvoicePDF from '../../components/invoices/InvoicePDF.jsx'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function TimestampRow({ icon: Icon, label, value, color }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0"
      style={{ borderColor: 'var(--border)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div>
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {format(new Date(value), 'MMMM d, yyyy — h:mm a')}
        </p>
      </div>
    </div>
  )
}

export default function InvoiceDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { data: invoice, isLoading } = useInvoice(id)
  const updateInvoice = useUpdateInvoice()

  const [editing,   setEditing]   = useState(false)
  const [lineItems, setLineItems] = useState(null)
  const [taxLines,  setTaxLines]  = useState(null)
  const [dueDate,   setDueDate]   = useState(null)
  const [notes,     setNotes]     = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const editSubtotal  = lineItems?.reduce((s,i) => s + (parseFloat(i.total)||0), 0) ?? 0
  const editTaxTotal  = taxLines?.reduce((s,t)  => s + (parseFloat(t.amount)||0), 0) ?? 0
  const editGrandTotal = editSubtotal + editTaxTotal

  const recomputeTaxes = (items, taxes) => {
    const sub = items.reduce((s,i) => s + (parseFloat(i.total)||0), 0)
    return taxes.map(t => ({
      ...t,
      amount: parseFloat(((sub * (parseFloat(t.rate)||0)) / 100).toFixed(2))
    }))
  }

  const startEdit = () => {
    setLineItems(JSON.parse(JSON.stringify(invoice.line_items ?? [])))
    setTaxLines(JSON.parse(JSON.stringify(invoice.tax_lines ?? [])))
    setDueDate(invoice.due_date ?? '')
    setNotes(invoice.notes ?? '')
    setEditing(true)
  }

  const cancelEdit = () => {
    setLineItems(null); setTaxLines(null)
    setDueDate(null);   setNotes(null)
    setEditing(false)
  }

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems]
    updated[index][field] = value
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = (parseFloat(updated[index].quantity)||0) * (parseFloat(updated[index].unit_price)||0)
    }
    setLineItems(updated)
    setTaxLines(recomputeTaxes(updated, taxLines))
  }

  const addLineItem = () => {
    const updated = [...lineItems, { description:'', quantity:1, unit_price:0, total:0 }]
    setLineItems(updated)
    setTaxLines(recomputeTaxes(updated, taxLines))
  }

  const removeLineItem = (index) => {
    const updated = lineItems.filter((_,i) => i !== index)
    setLineItems(updated)
    setTaxLines(recomputeTaxes(updated, taxLines))
  }

  const addTaxLine    = () => setTaxLines([...taxLines, { name:'', rate:0, amount:0 }])
  const removeTaxLine = (index) => setTaxLines(taxLines.filter((_,i) => i !== index))

  const updateTaxLine = (index, field, value) => {
    const updated = [...taxLines]
    updated[index][field] = value
    if (field === 'rate') {
      updated[index].amount = parseFloat(((editSubtotal * (parseFloat(value)||0)) / 100).toFixed(2))
    }
    setTaxLines(updated)
  }

  const saveEdits = async () => {
    setSaving(true)
    try {
      const taxTotal   = taxLines.reduce((s,t) => s + (parseFloat(t.amount)||0), 0)
      const grandTotal = editSubtotal + taxTotal
      await updateInvoice.mutateAsync({
        id, line_items: lineItems, tax_lines: taxLines,
        subtotal: editSubtotal, tax_rate: 0,
        tax_amount: taxTotal, total_amount: grandTotal,
        due_date: dueDate || null, notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      toast.success('Invoice updated')
      setEditing(false)
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleConfirm = async () => {
    try {
      if (confirmAction === 'send') {
        await updateInvoice.mutateAsync({ id, status:'Sent', sent_at: new Date().toISOString() })
        toast.success('Invoice marked as sent')
      }
      if (confirmAction === 'paid') {
        await updateInvoice.mutateAsync({ id, status:'Paid', paid_at: new Date().toISOString() })
        toast.success('Payment confirmed and recorded')
      }
      if (confirmAction === 'delete') {
        await updateInvoice.mutateAsync({ id, is_deleted:true, deleted_at: new Date().toISOString() })
        toast.success('Invoice deleted')
        navigate('/admin/invoices')
        return
      }
      if (confirmAction === 'restore') {
        await updateInvoice.mutateAsync({ id, is_deleted:false, deleted_at:null })
        toast.success('Invoice restored')
      }
    } catch (err) { toast.error(err.message) }
    finally { setConfirmAction(null) }
  }

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <p className="font-display text-2xl animate-pulse" style={{ color: 'var(--gold)' }}>Loading...</p>
      </div>
    </AdminLayout>
  )
  if (!invoice) return <AdminLayout><p style={{ color:'var(--text-dim)' }}>Invoice not found</p></AdminLayout>

  const status     = invoice.status
  const isDeleted  = !!invoice.is_deleted
  const isDraft    = status === 'Draft'
  const isSent     = status === 'Sent' || status === 'Viewed'
  const isPaid     = status === 'Paid'
  const isOverdue  = status === 'Overdue'
  const alreadySent = !!invoice.sent_at
  const canEdit    = !isDeleted && !isPaid
  const canSend    = !isDeleted && isDraft && !alreadySent
  const canMarkPaid = !isDeleted && (isSent || isOverdue)
  const canDelete  = !isDeleted && !isPaid

  const displayLineItems = editing ? lineItems       : (invoice.line_items ?? [])
  const displayTaxLines  = editing ? taxLines        : (invoice.tax_lines  ?? [])
  const displaySubtotal  = editing ? editSubtotal    : (invoice.subtotal   ?? 0)
  const displayTaxTotal  = editing ? editTaxTotal    : (invoice.tax_amount ?? 0)
  const displayTotal     = editing ? editGrandTotal  : (invoice.total_amount ?? 0)

  return (
    <AdminLayout>
      <button onClick={() => navigate('/admin/invoices')}
        className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: 'var(--text-dim)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
        <ArrowLeft size={14} /> Back to Invoices
      </button>

      <div className="max-w-3xl">

        {/* Deleted banner */}
        {isDeleted && (
          <div className="rounded-xl border p-4 mb-6 flex items-center justify-between gap-4"
            style={{ background:'color-mix(in srgb, #f87171 5%, transparent)', borderColor:'color-mix(in srgb, #f87171 20%, transparent)' }}>
            <div className="flex items-center gap-3">
              <Trash2 size={16} style={{ color:'#f87171' }} />
              <div>
                <p className="text-sm font-medium" style={{ color:'#fca5a5' }}>This invoice has been deleted</p>
                <p className="text-xs mt-0.5" style={{ color:'var(--text-dim)' }}>
                  {invoice.deleted_at ? format(new Date(invoice.deleted_at), 'MMMM d, yyyy — h:mm a') : ''}
                </p>
              </div>
            </div>
            <button onClick={() => setConfirmAction('restore')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium shrink-0"
              style={{ background:'color-mix(in srgb, #4ade80 15%, transparent)', borderColor:'color-mix(in srgb, #4ade80 30%, transparent)', color:'#4ade80' }}>
              <RotateCcw size={12} /> Restore Invoice
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="font-display text-4xl" style={{ color:'var(--text)' }}>{invoice.invoice_number}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm" style={{ color:'var(--text-dim)' }}>
              Created {invoice.created_at ? format(new Date(invoice.created_at), 'MMMM d, yyyy — h:mm a') : '—'}
            </p>
          </div>

          {!editing && !isDeleted && (
            <div className="flex items-center gap-2 flex-wrap">
              {canEdit && (
                <button onClick={startEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                  style={{ borderColor:'var(--border)', color:'var(--text-muted)', background:'var(--card)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)' }}>
                  <Edit2 size={14} /> Edit Invoice
                </button>
              )}
              <PDFDownloadLink document={<InvoicePDF invoice={invoice} />} fileName={`${invoice.invoice_number}.pdf`} style={{ textDecoration:'none' }}>
                {({ loading }) => (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer"
                    style={{ borderColor:'var(--border)', color:'var(--text-muted)', background:'var(--card)' }}>
                    <FileText size={14} />
                    {loading ? 'Generating...' : 'Download PDF'}
                  </div>
                )}
              </PDFDownloadLink>
              {canDelete && (
                <button onClick={() => setConfirmAction('delete')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm"
                  style={{ borderColor:'color-mix(in srgb, #f87171 20%, transparent)', color:'#f87171' }}>
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          )}

          {editing && (
            <div className="flex items-center gap-2">
              <button onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor:'var(--border)', color:'var(--text-muted)' }}>
                <X size={14} /> Cancel
              </button>
              <button onClick={saveEdits} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background:'var(--gold)', color:'var(--bg)' }}>
                <Save size={14} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Status Flow — SEPARATED send and paid */}
        {!isDeleted && (
          <div className="rounded-xl border p-5 mb-6"
            style={{ background:'var(--card)', borderColor:'var(--border)' }}>
            <p className="text-xs uppercase tracking-wider mb-4" style={{ color:'var(--text-dim)' }}>Invoice Status Flow</p>

            {/* Steps indicator */}
            <div className="flex items-center gap-0 mb-5 overflow-x-auto pb-1">
              {[
                { label:'Draft', done:!isDraft, active:isDraft },
                { label:'Sent',  done:isPaid,   active:isSent||isOverdue },
                { label:'Paid',  done:false,    active:isPaid },
              ].map(({ label, done, active }, i, arr) => (
                <div key={label} className="flex items-center shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full"
                      style={{ background: done ? '#4ade80' : active ? 'var(--gold)' : 'var(--border)' }} />
                    <span className="text-sm font-medium"
                      style={{ color: done ? '#4ade80' : active ? 'var(--gold)' : 'var(--text-dim)' }}>
                      {label}
                    </span>
                  </div>
                  {i < arr.length - 1 && <div className="w-10 h-px mx-3" style={{ background:'var(--border)' }} />}
                </div>
              ))}
            </div>

            <div className="space-y-3">

              {/* STEP 1 — Mark as Sent (only if draft and NOT already sent) */}
              {canSend && (
                <div className="flex items-center justify-between p-4 rounded-xl border"
                  style={{ background:'color-mix(in srgb, var(--gold) 5%, transparent)', borderColor:'color-mix(in srgb, var(--gold) 25%, transparent)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:'var(--gold)' }}>Step 1 — Mark as Sent</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-dim)' }}>Once you have shared this invoice with the client, mark it as sent.</p>
                  </div>
                  <button onClick={() => setConfirmAction('send')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shrink-0 ml-4"
                    style={{ background:'var(--gold)', color:'var(--bg)' }}>
                    <Send size={14} /> Mark as Sent
                  </button>
                </div>
              )}

              {/* Already sent — locked, cannot resend */}
              {alreadySent && !isPaid && (
                <div className="flex items-center gap-3 p-4 rounded-xl border"
                  style={{ background:'color-mix(in srgb, #60a5fa 5%, transparent)', borderColor:'color-mix(in srgb, #60a5fa 20%, transparent)' }}>
                  <CheckCircle size={16} style={{ color:'#60a5fa' }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color:'#93c5fd' }}>Invoice Sent</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-dim)' }}>
                      {invoice.sent_at ? format(new Date(invoice.sent_at), 'MMMM d, yyyy — h:mm a') : ''}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full"
                    style={{ background:'color-mix(in srgb, #60a5fa 12%, transparent)', color:'#93c5fd' }}>
                    Sent — cannot resend
                  </span>
                </div>
              )}

              {/* STEP 2 — Mark as Paid (only shown AFTER sent — completely separate) */}
              {canMarkPaid && (
                <div className="flex items-center justify-between p-4 rounded-xl border"
                  style={{ background:'color-mix(in srgb, #4ade80 5%, transparent)', borderColor:'color-mix(in srgb, #4ade80 25%, transparent)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:'#4ade80' }}>Step 2 — Confirm Payment Received</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-dim)' }}>Only click after you have confirmed full payment was received. This cannot be undone.</p>
                  </div>
                  <button onClick={() => setConfirmAction('paid')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shrink-0 ml-4 border"
                    style={{ background:'color-mix(in srgb, #4ade80 12%, transparent)', borderColor:'color-mix(in srgb, #4ade80 30%, transparent)', color:'#4ade80' }}>
                    <CheckCircle size={14} /> Confirm Paid
                  </button>
                </div>
              )}

              {/* Paid confirmation */}
              {isPaid && (
                <div className="flex items-center gap-3 p-4 rounded-xl border"
                  style={{ background:'color-mix(in srgb, #4ade80 8%, transparent)', borderColor:'color-mix(in srgb, #4ade80 25%, transparent)' }}>
                  <CheckCircle size={18} style={{ color:'#4ade80' }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color:'#4ade80' }}>Payment Confirmed</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-dim)' }}>
                      {invoice.paid_at ? format(new Date(invoice.paid_at), 'MMMM d, yyyy — h:mm a') : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoice Card */}
        <div className="rounded-xl border overflow-hidden mb-6"
          style={{ background:'var(--card)', borderColor:'var(--border)' }}>

          {/* Top bar */}
          <div className="border-b p-7 flex justify-between items-start"
            style={{ background:'var(--surface)', borderColor:'var(--border)' }}>
            <div>
              <h2 className="font-display text-4xl tracking-widest mb-1" style={{ color:'var(--gold)' }}>NYIN</h2>
              <p className="text-xs tracking-widest uppercase" style={{ color:'var(--text-dim)' }}>International FZCO</p>
              <p className="text-xs mt-1" style={{ color:'var(--text-dim)' }}>Dubai, United Arab Emirates</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl" style={{ color:'var(--text)' }}>INVOICE</p>
              <p className="text-sm mt-1" style={{ color:'var(--gold)' }}>{invoice.invoice_number}</p>
              {editing ? (
                <div className="mt-2">
                  <label className="text-xs block mb-1 text-right" style={{ color:'var(--text-dim)' }}>Due Date</label>
                  <input type="date" value={dueDate ?? ''} onChange={e => setDueDate(e.target.value)}
                    className="rounded px-2 py-1 text-xs border focus:outline-none"
                    style={{ background:'var(--surface)', borderColor:'var(--gold)', color:'var(--text)' }} />
                </div>
              ) : invoice.due_date && (
                <p className="text-xs mt-2" style={{ color:'var(--text-dim)' }}>
                  Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>

          <div className="p-7">
            {/* Bill To */}
            <div className="mb-7">
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color:'var(--text-dim)' }}>Bill To</p>
              <p className="font-semibold" style={{ color:'var(--text)' }}>
                {invoice.profiles?.company_name ?? invoice.profiles?.full_name}
              </p>
              <p className="text-sm mt-0.5" style={{ color:'var(--text-muted)' }}>{invoice.profiles?.email}</p>
              {invoice.orders?.order_number && (
                <p className="text-xs mt-1" style={{ color:'var(--text-dim)' }}>Re: Order {invoice.orders.order_number}</p>
              )}
            </div>

            {/* Line Items */}
            <table className="w-full mb-2">
              <thead>
                <tr className="border-b" style={{ borderColor:'var(--border)' }}>
                  {['Description','Qty','Unit Price','Total'].map((h,i) => (
                    <th key={h} className={`text-xs uppercase tracking-wider py-2 font-medium ${i===0?'text-left pr-4':'text-right px-2'}`}
                      style={{ color:'var(--text-dim)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor:'var(--border)' }}>
                {displayLineItems.map((item, i) => editing ? (
                  <tr key={i}>
                    <td className="py-1.5 pr-2">
                      <input value={item.description} onChange={e => updateLineItem(i,'description',e.target.value)}
                        placeholder="Description"
                        className="w-full rounded px-2 py-1.5 text-sm border focus:outline-none"
                        style={{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }}
                        onFocus={e => e.target.style.borderColor='var(--gold)'}
                        onBlur={e  => e.target.style.borderColor='var(--border)'} />
                    </td>
                    <td className="py-1.5 px-1">
                      <input type="number" value={item.quantity} onChange={e => updateLineItem(i,'quantity',e.target.value)}
                        className="w-full rounded px-2 py-1.5 text-sm border focus:outline-none text-right"
                        style={{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }}
                        onFocus={e => e.target.style.borderColor='var(--gold)'}
                        onBlur={e  => e.target.style.borderColor='var(--border)'} />
                    </td>
                    <td className="py-1.5 px-1">
                      <input type="number" step="0.01" value={item.unit_price} onChange={e => updateLineItem(i,'unit_price',e.target.value)}
                        className="w-full rounded px-2 py-1.5 text-sm border focus:outline-none text-right"
                        style={{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }}
                        onFocus={e => e.target.style.borderColor='var(--gold)'}
                        onBlur={e  => e.target.style.borderColor='var(--border)'} />
                    </td>
                    <td className="py-1.5 pl-1">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-semibold" style={{ color:'var(--gold)' }}>
                          ${parseFloat(item.total||0).toLocaleString('en-US',{minimumFractionDigits:2})}
                        </span>
                        <button onClick={() => removeLineItem(i)}
                          className="w-5 h-5 flex items-center justify-center rounded"
                          style={{ color:'var(--text-dim)' }}
                          onMouseEnter={e => e.currentTarget.style.color='#f87171'}
                          onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}>
                          <X size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={i}>
                    <td className="py-3 pr-4 text-sm" style={{ color:'var(--text)' }}>{item.description}</td>
                    <td className="py-3 px-2 text-sm text-right" style={{ color:'var(--text-muted)' }}>{item.quantity}</td>
                    <td className="py-3 px-2 text-sm text-right" style={{ color:'var(--text-muted)' }}>
                      ${parseFloat(item.unit_price||0).toLocaleString('en-US',{minimumFractionDigits:2})}
                    </td>
                    <td className="py-3 text-sm text-right font-semibold" style={{ color:'var(--gold)' }}>
                      ${parseFloat(item.total||0).toLocaleString('en-US',{minimumFractionDigits:2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {editing && (
              <button onClick={addLineItem}
                className="flex items-center gap-2 text-xs mb-6 py-1"
                style={{ color:'var(--gold)' }}>
                <Plus size={13} /> Add Line Item
              </button>
            )}

            {/* Totals with named taxes */}
            <div className="flex justify-end mb-7">
              <div className="w-72 rounded-xl overflow-hidden border" style={{ borderColor:'var(--border)' }}>

                <div className="flex justify-between px-4 py-2.5 border-b" style={{ borderColor:'var(--border)' }}>
                  <span className="text-sm" style={{ color:'var(--text-dim)' }}>Subtotal</span>
                  <span className="text-sm font-medium" style={{ color:'var(--text)' }}>
                    ${displaySubtotal.toLocaleString('en-US',{minimumFractionDigits:2})}
                  </span>
                </div>

                {/* Named tax lines */}
                {displayTaxLines.map((tax, i) => editing ? (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor:'var(--border)' }}>
                    <input value={tax.name} onChange={e => updateTaxLine(i,'name',e.target.value)}
                      placeholder="e.g. VAT, WHT"
                      className="flex-1 rounded px-2 py-1 text-xs border focus:outline-none"
                      style={{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)', minWidth:0 }}
                      onFocus={e => e.target.style.borderColor='var(--gold)'}
                      onBlur={e  => e.target.style.borderColor='var(--border)'} />
                    <div className="flex items-center gap-0.5 shrink-0">
                      <input type="number" step="0.1" value={tax.rate} onChange={e => updateTaxLine(i,'rate',e.target.value)}
                        className="w-12 rounded px-1.5 py-1 text-xs border focus:outline-none text-right"
                        style={{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }}
                        onFocus={e => e.target.style.borderColor='var(--gold)'}
                        onBlur={e  => e.target.style.borderColor='var(--border)'} />
                      <span className="text-xs" style={{ color:'var(--text-dim)' }}>%</span>
                    </div>
                    <span className="text-xs font-medium shrink-0 w-14 text-right" style={{ color:'var(--text)' }}>
                      ${parseFloat(tax.amount||0).toFixed(2)}
                    </span>
                    <button onClick={() => removeTaxLine(i)}
                      className="w-5 h-5 flex items-center justify-center rounded shrink-0"
                      style={{ color:'var(--text-dim)' }}
                      onMouseEnter={e => e.currentTarget.style.color='#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}>
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div key={i} className="flex justify-between px-4 py-2.5 border-b" style={{ borderColor:'var(--border)' }}>
                    <span className="text-sm" style={{ color:'var(--text-dim)' }}>{tax.name||'Tax'} ({tax.rate}%)</span>
                    <span className="text-sm" style={{ color:'var(--text)' }}>
                      ${parseFloat(tax.amount||0).toLocaleString('en-US',{minimumFractionDigits:2})}
                    </span>
                  </div>
                ))}

                {editing && (
                  <button onClick={addTaxLine}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs border-b"
                    style={{ borderColor:'var(--border)', color:'var(--gold)', background:'color-mix(in srgb, var(--gold) 5%, transparent)' }}>
                    <Plus size={11} /> Add Tax Line (VAT, WHT, etc.)
                  </button>
                )}

                <div className="flex justify-between px-4 py-3" style={{ background:'var(--surface)' }}>
                  <span className="font-semibold" style={{ color:'var(--text)' }}>Total {invoice.currency??'USD'}</span>
                  <span className="text-lg font-bold" style={{ color:'var(--gold)' }}>
                    ${displayTotal.toLocaleString('en-US',{minimumFractionDigits:2})}
                  </span>
                </div>

                {isPaid && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-t"
                    style={{ borderColor:'color-mix(in srgb, #4ade80 20%, transparent)', background:'color-mix(in srgb, #4ade80 8%, transparent)' }}>
                    <span className="text-xs font-bold" style={{ color:'#4ade80' }}>✓ PAID</span>
                    <span className="text-xs" style={{ color:'#4ade80' }}>
                      {invoice.paid_at ? format(new Date(invoice.paid_at), 'MMM d, yyyy') : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color:'var(--text-dim)' }}>
                Notes & Payment Instructions
              </p>
              {editing ? (
                <textarea value={notes??''} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Bank details, payment instructions, terms..."
                  className="w-full rounded-lg px-3 py-2.5 text-sm border focus:outline-none resize-none"
                  style={{ background:'var(--surface)', borderColor:'var(--border)', color:'var(--text)' }}
                  onFocus={e => e.target.style.borderColor='var(--gold)'}
                  onBlur={e  => e.target.style.borderColor='var(--border)'} />
              ) : invoice.notes ? (
                <p className="text-sm leading-relaxed" style={{ color:'var(--text-muted)' }}>{invoice.notes}</p>
              ) : (
                <p className="text-sm italic" style={{ color:'var(--text-dim)' }}>
                  No notes.{canEdit && (
                    <button onClick={startEdit} className="ml-2 not-italic underline" style={{ color:'var(--gold)' }}>Add notes</button>
                  )}
                </p>
              )}
            </div>

            <div className="mt-7 pt-5 border-t text-center" style={{ borderColor:'var(--border)' }}>
              <p className="text-xs" style={{ color:'var(--text-dim)' }}>Thank you for your business</p>
              <p className="text-xs mt-0.5" style={{ color:'var(--text-dim)', opacity:0.5 }}>NYIN International FZCO · Dubai, UAE</p>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="rounded-xl border p-5" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} style={{ color:'var(--gold)' }} />
            <h2 className="font-display text-xl" style={{ color:'var(--text)' }}>Timeline</h2>
          </div>
          <TimestampRow icon={FileText}     label="Invoice Created"     value={invoice.created_at} color="var(--gold)" />
          <TimestampRow icon={Send}         label="Marked as Sent"      value={invoice.sent_at}    color="#60a5fa" />
          <TimestampRow icon={CheckCircle}  label="Payment Confirmed"   value={invoice.paid_at}    color="#4ade80" />
          {invoice.updated_at && invoice.updated_at !== invoice.created_at && (
            <TimestampRow icon={Edit2} label="Last Edited" value={invoice.updated_at} color="var(--text-dim)" />
          )}
          {invoice.deleted_at && (
            <TimestampRow icon={Trash2} label="Deleted" value={invoice.deleted_at} color="#f87171" />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={confirmAction === 'send'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        loading={updateInvoice.isPending}
        title="Mark Invoice as Sent"
        message={`Confirm that invoice ${invoice.invoice_number} for $${invoice.total_amount?.toLocaleString()} has been shared with the client? The status will change to Sent and cannot be undone.`}
        confirmLabel="Yes, Mark as Sent"
        variant="gold"
      />
      <ConfirmDialog
        isOpen={confirmAction === 'paid'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        loading={updateInvoice.isPending}
        title="⚠️ Confirm Payment Received"
        message={`Only proceed if you have confirmed receipt of the full payment of $${invoice.total_amount?.toLocaleString()} for invoice ${invoice.invoice_number}. The current timestamp will be recorded. This CANNOT be reversed.`}
        confirmLabel="I Confirm — Mark as Paid"
        variant="success"
      />
      <ConfirmDialog
        isOpen={confirmAction === 'delete'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        loading={updateInvoice.isPending}
        title="Delete Invoice"
        message={`Delete invoice ${invoice.invoice_number}? It can be restored from the invoices list at any time.`}
        confirmLabel="Yes, Delete Invoice"
        variant="danger"
      />
      <ConfirmDialog
        isOpen={confirmAction === 'restore'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        loading={updateInvoice.isPending}
        title="Restore Invoice"
        message={`Restore invoice ${invoice.invoice_number}? It will reappear in the active invoices list.`}
        confirmLabel="Yes, Restore"
        variant="success"
      />
    </AdminLayout>
  )
}