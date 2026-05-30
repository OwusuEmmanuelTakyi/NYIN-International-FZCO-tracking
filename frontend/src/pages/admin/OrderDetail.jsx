import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, AlertCircle,
  FileText, Image, Download, Package
} from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import OrderStatusPipeline from '../../components/orders/OrderStatusPipeline.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import ActivityTimeline from '../../components/orders/ActivityTimeline.jsx'
import { useOrder, useUpdateOrder } from '../../hooks/useOrders.js'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase.js'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminOrderDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { data: order, isLoading } = useOrder(id)
  const updateOrder = useUpdateOrder()
  const [confirmDialog, setConfirmDialog] = useState(null)

  const { data: documents = [] } = useQuery({
    queryKey: ['order-docs', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('order_documents')
        .select('*, profiles:uploaded_by(full_name, role)')
        .eq('order_id', id)
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  const handleStatusChange = (newStatus) => setConfirmDialog({ newStatus })

  const confirmStatusChange = async () => {
    await updateOrder.mutateAsync({ id, status: confirmDialog.newStatus })
    setConfirmDialog(null)
  }

  const handleDownload = async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from('order-documents')
        .createSignedUrl(doc.storage_path, 60 * 60)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch {
      window.open(doc.file_url, '_blank')
    }
  }

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <p className="font-display text-2xl animate-pulse" style={{ color:'var(--gold)' }}>Loading...</p>
      </div>
    </AdminLayout>
  )

  if (!order) return (
    <AdminLayout><p style={{ color:'var(--text-dim)' }}>Order not found</p></AdminLayout>
  )

  const isCancelled = order.status === 'Cancelled'
  const isSettled   = order.status === 'Settled'
  const hasConfirmed = !!order.client_confirmed_receipt

  // Proof documents (uploaded by client as delivery_proof)
  const proofDocs  = documents.filter(d => d.file_type === 'delivery_proof' || d.profiles?.role === 'client')
  const adminDocs  = documents.filter(d => d.profiles?.role === 'admin')

  return (
    <AdminLayout>
      <button onClick={() => navigate('/admin/orders')}
        className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color:'var(--text-dim)' }}
        onMouseEnter={e => e.currentTarget.style.color='var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}>
        <ArrowLeft size={14} /> Back to Orders
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="font-display text-4xl" style={{ color:'var(--text)' }}>{order.order_number}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm" style={{ color:'var(--text-dim)' }}>
            Created {format(new Date(order.created_at), 'MMMM d, yyyy — h:mm a')}
          </p>
        </div>
        <button
          onClick={() => navigate(`/admin/invoices/new?orderId=${order.id}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all"
          style={{ borderColor:'color-mix(in srgb, var(--gold) 40%, transparent)', color:'var(--gold)', background:'color-mix(in srgb, var(--gold) 8%, transparent)' }}>
          <FileText size={14} /> Generate Invoice
        </button>
      </div>

      {/* Status Pipeline */}
      <div className="rounded-xl border p-6 mb-6" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        <h2 className="font-display text-xl mb-6" style={{ color:'var(--text)' }}>Order Progress</h2>
        {isCancelled ? (
          <div className="flex items-center gap-2" style={{ color:'#f87171' }}>
            <AlertCircle size={16} />
            <span className="text-sm">This order has been cancelled</span>
          </div>
        ) : (
          <OrderStatusPipeline
            currentStatus={order.status}
            onStatusChange={handleStatusChange}
            isAdmin={true}
          />
        )}
      </div>

      {/* ── CLIENT CONFIRMATION STATUS ──────────────────── */}
      <div className="rounded-xl border p-5 mb-6" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        <h2 className="font-display text-xl mb-4" style={{ color:'var(--text)' }}>Receipt Confirmation</h2>

        {!hasConfirmed ? (
          <div className="flex items-center gap-3 p-4 rounded-xl border"
            style={{ background:'color-mix(in srgb, #fb923c 5%, transparent)', borderColor:'color-mix(in srgb, #fb923c 20%, transparent)' }}>
            <AlertCircle size={16} style={{ color:'#fb923c' }} />
            <div>
              <p className="text-sm font-medium" style={{ color:'#fdba74' }}>
                {order.status === 'In Transit'
                  ? 'Awaiting client confirmation'
                  : 'Not yet confirmed'}
              </p>
              <p className="text-xs mt-0.5" style={{ color:'var(--text-dim)' }}>
                {order.status === 'In Transit'
                  ? 'The client has not yet confirmed receipt of goods.'
                  : 'Client confirmation will be available when order is In Transit.'}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 p-4 rounded-xl border mb-4"
              style={{ background:'color-mix(in srgb, #4ade80 5%, transparent)', borderColor:'color-mix(in srgb, #4ade80 20%, transparent)' }}>
              <CheckCircle size={18} style={{ color:'#4ade80' }} />
              <div>
                <p className="text-sm font-bold" style={{ color:'#86efac' }}>
                  ✓ Client Confirmed Receipt
                </p>
                <p className="text-xs mt-0.5" style={{ color:'var(--text-dim)' }}>
                  Confirmed on {format(new Date(order.client_confirmed_at), 'MMMM d, yyyy — h:mm a')}
                </p>
              </div>
            </div>

            {/* Proof documents uploaded by client */}
            {proofDocs.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-3" style={{ color:'var(--text-dim)' }}>
                  Delivery Proof ({proofDocs.length} file{proofDocs.length>1?'s':''})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {proofDocs.map(doc => (
                    <button key={doc.id} onClick={() => handleDownload(doc)}
                      className="rounded-xl border overflow-hidden text-left transition-all group"
                      style={{ background:'var(--surface)', borderColor:'var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor='color-mix(in srgb, var(--gold) 40%, transparent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                      {/* Preview or icon */}
                      <div className="h-24 flex items-center justify-center"
                        style={{ background:'var(--bg)' }}>
                        {doc.file_name?.match(/\.(jpg|jpeg|png)$/i) ? (
                          <div className="w-full h-full relative">
                            <img src={doc.file_url} alt={doc.file_name}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.style.display='none' }} />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background:'rgba(0,0,0,0.5)' }}>
                              <Download size={20} style={{ color:'#fff' }} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FileText size={28} style={{ color:'var(--gold)' }} />
                            <Download size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color:'var(--gold)' }} />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs truncate" style={{ color:'var(--text)' }}>{doc.file_name}</p>
                        <p className="text-xs mt-0.5" style={{ color:'var(--text-dim)' }}>
                          {format(new Date(doc.created_at), 'MMM d')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {proofDocs.length === 0 && (
              <p className="text-xs" style={{ color:'var(--text-dim)' }}>
                No proof documents were uploaded by the client.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Order + Client Info */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border p-6" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
          <h2 className="font-display text-xl mb-4" style={{ color:'var(--text)' }}>Order Information</h2>
          <dl className="space-y-0">
            {[
              ['Order Type',  order.order_type],
              ['Commodity',   order.commodity ?? '—'],
              ['Quantity',    order.quantity ? `${order.quantity} ${order.unit??''}` : '—'],
              ['Unit Price',  order.unit_price ? `$${order.unit_price.toLocaleString()}` : '—'],
              ['Total Value', order.total_value ? `$${order.total_value.toLocaleString()} ${order.currency}` : '—'],
              ['Origin',      order.origin_location ?? '—'],
              ['Destination', order.destination_location ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5 border-b" style={{ borderColor:'var(--border)' }}>
                <dt className="text-sm" style={{ color:'var(--text-dim)' }}>{label}</dt>
                <dd className="text-sm font-medium text-right" style={{ color:'var(--text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border p-6" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
          <h2 className="font-display text-xl mb-4" style={{ color:'var(--text)' }}>Client Information</h2>
          <dl className="space-y-0">
            {[
              ['Name',    order.profiles?.full_name ?? '—'],
              ['Company', order.profiles?.company_name ?? '—'],
              ['Email',   order.profiles?.email ?? '—'],
              ['Phone',   order.profiles?.phone ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5 border-b" style={{ borderColor:'var(--border)' }}>
                <dt className="text-sm" style={{ color:'var(--text-dim)' }}>{label}</dt>
                <dd className="text-sm font-medium text-right" style={{ color:'var(--text)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-xl border p-6 mb-6" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
          <h2 className="font-display text-xl mb-2" style={{ color:'var(--text)' }}>Notes</h2>
          <p className="text-sm leading-relaxed" style={{ color:'var(--text-muted)' }}>{order.notes}</p>
        </div>
      )}

      {/* Admin Documents */}
      {adminDocs.length > 0 && (
        <div className="rounded-xl border p-6 mb-6" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
          <h2 className="font-display text-xl mb-4" style={{ color:'var(--text)' }}>Order Documents</h2>
          <div className="space-y-2">
            {adminDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border"
                style={{ background:'var(--surface)', borderColor:'var(--border)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background:'color-mix(in srgb, var(--gold) 12%, transparent)' }}>
                    <FileText size={14} style={{ color:'var(--gold)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color:'var(--text)' }}>{doc.file_name}</p>
                    <p className="text-xs mt-0.5" style={{ color:'var(--text-dim)' }}>
                      {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDownload(doc)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors shrink-0"
                  style={{ borderColor:'var(--border)', color:'var(--text-dim)' }}
                  onMouseEnter={e => { e.currentTarget.style.color='var(--gold)'; e.currentTarget.style.borderColor='color-mix(in srgb, var(--gold) 40%, transparent)' }}
                  onMouseLeave={e => { e.currentTarget.style.color='var(--text-dim)'; e.currentTarget.style.borderColor='var(--border)' }}>
                  <Download size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel / Reopen */}
      <div className="flex gap-3 mb-6">
        {!isCancelled && !isSettled && (
          <button onClick={() => setConfirmDialog({ newStatus:'Cancelled' })}
            className="text-sm border px-4 py-2 rounded-lg transition-colors"
            style={{ color:'#f87171', borderColor:'color-mix(in srgb, #f87171 20%, transparent)' }}>
            Cancel Order
          </button>
        )}
        {isCancelled && (
          <button onClick={() => setConfirmDialog({ newStatus:'Initiated' })}
            className="flex items-center gap-2 text-sm border px-4 py-2 rounded-lg transition-colors"
            style={{ color:'#4ade80', borderColor:'color-mix(in srgb, #4ade80 20%, transparent)' }}>
            <CheckCircle size={14} /> Reopen Order
          </button>
        )}
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline orderId={id} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmStatusChange}
        loading={updateOrder.isPending}
        title={
          confirmDialog?.newStatus === 'Cancelled' ? 'Cancel Order' :
          confirmDialog?.newStatus === 'Initiated'  ? 'Reopen Order'  :
          'Update Order Status'
        }
        message={
          confirmDialog?.newStatus === 'Cancelled'
            ? `Cancel order ${order.order_number}? You can reopen it later if needed. The client will be notified.`
            : confirmDialog?.newStatus === 'Initiated'
            ? `Reopen order ${order.order_number} and set it back to Initiated?`
            : `Change status to "${confirmDialog?.newStatus}"? The client will be notified by email.`
        }
        confirmLabel={
          confirmDialog?.newStatus === 'Cancelled' ? 'Yes, Cancel Order' :
          confirmDialog?.newStatus === 'Initiated'  ? 'Yes, Reopen Order'  :
          'Yes, Update Status'
        }
        variant={
          confirmDialog?.newStatus === 'Cancelled' ? 'danger' :
          confirmDialog?.newStatus === 'Initiated'  ? 'success' :
          'gold'
        }
      />
    </AdminLayout>
  )
}