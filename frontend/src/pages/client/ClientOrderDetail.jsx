import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle, Upload, X,
  FileText, Download, AlertCircle,
  Image as ImageIcon, Loader, Plus, Trash2
} from 'lucide-react'
import ClientLayout from '../../components/layout/ClientLayout.jsx'
import OrderStatusPipeline from '../../components/orders/OrderStatusPipeline.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import ActivityTimeline from '../../components/orders/ActivityTimeline.jsx'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { PDFDownloadLink } from '@react-pdf/renderer'
import InvoicePDF from '../../components/invoices/InvoicePDF.jsx'

// ── FILE PREVIEW CARD ─────────────────────────────────────────
function FilePreviewCard({ file, onRemove, uploading }) {
  const isImage = file.type?.startsWith('image/')
  return (
    <div className="relative rounded-xl border overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

      {/* Preview */}
      <div className="h-28 flex items-center justify-center"
        style={{ background: 'var(--bg)' }}>
        {isImage && file.preview ? (
          <img src={file.preview} alt={file.name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <FileText size={28} style={{ color: 'var(--gold)' }} />
            <span className="text-xs px-2 text-center" style={{ color: 'var(--text-dim)' }}>
              {file.name.split('.').pop()?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <Loader size={20} className="animate-spin" style={{ color: 'var(--gold)' }} />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="px-2 py-1.5">
        <p className="text-xs truncate" style={{ color: 'var(--text)' }}>{file.name}</p>
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </p>
      </div>

      {/* Remove button */}
      {!uploading && (
        <button
          onClick={() => onRemove()}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────
export default function ClientOrderDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const queryClient = useQueryClient()

  // Staged files for receipt confirmation
  const [stagedFiles,    setStagedFiles]    = useState([])
  // Standalone doc upload files (separate section)
  const [docFiles,       setDocFiles]       = useState([])
  const [confirmReceipt, setConfirmReceipt] = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [uploadingDocs,  setUploadingDocs]  = useState(false)

  // ── DATA ──────────────────────────────────────────────────
  const { data: order, isLoading } = useQuery({
    queryKey: ['client-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders').select('*').eq('id', id).single()
      if (error) throw error
      return data
    }
  })

  const { data: documents = [], refetch: refetchDocs } = useQuery({
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

  const { data: invoices = [] } = useQuery({
    queryKey: ['order-invoices', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, profiles:client_id(*), orders:order_id(order_number)')
        .eq('order_id', id)
        .eq('is_deleted', false)
      return data ?? []
    }
  })

  // ── STAGE FILES FOR RECEIPT ──────────────────────────────
  const handleStageFiles = (e) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const valid = []
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`)
        continue
      }
      const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: only PDF, JPG, PNG, DOCX files allowed`)
        continue
      }
      valid.push({
        file,
        name:    file.name,
        size:    file.size,
        type:    file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        id:      `${Date.now()}-${Math.random()}`,
      })
    }

    setStagedFiles(prev => [...prev, ...valid])
    e.target.value = ''
  }

  const removeStagedFile = (fileId) => {
    setStagedFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) URL.revokeObjectURL(file.preview)
      return prev.filter(f => f.id !== fileId)
    })
  }

  // ── STAGE DOC FILES (standalone upload) ──────────────────
  const handleStageDocFiles = (e) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const valid = []
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB`)
        continue
      }
      valid.push({
        file,
        name:    file.name,
        size:    file.size,
        type:    file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        id:      `${Date.now()}-${Math.random()}`,
      })
    }
    setDocFiles(prev => [...prev, ...valid])
    e.target.value = ''
  }

  const removeDocFile = (fileId) => {
    setDocFiles(prev => {
      const f = prev.find(x => x.id === fileId)
      if (f?.preview) URL.revokeObjectURL(f.preview)
      return prev.filter(x => x.id !== fileId)
    })
  }

  // ── UPLOAD SINGLE FILE ────────────────────────────────────
  const uploadOneFile = async (fileObj, fileType = 'other') => {
    const path = `orders/${id}/${Date.now()}_${fileObj.name}`

    const { error: uploadError } = await supabase.storage
      .from('order-documents')
      .upload(path, fileObj.file, { upsert: false })

    if (uploadError) throw uploadError

    // Get a signed URL
    const { data: signedData } = await supabase.storage
      .from('order-documents')
      .createSignedUrl(path, 60 * 60 * 24 * 7) // 7 days

    await supabase.from('order_documents').insert([{
      order_id:     id,
      uploaded_by:  user.id,
      file_name:    fileObj.name,
      file_url:     signedData?.signedUrl ?? '',
      storage_path: path,
      file_type:    fileType,
    }])

    return path
  }

  // ── CONFIRM RECEIPT (uploads staged files first) ──────────
  const confirmReceiptMutation = useMutation({
    mutationFn: async () => {
      setUploading(true)

      // Upload all staged proof files
      for (const f of stagedFiles) {
        await uploadOneFile(f, 'delivery_proof')
      }

      // Mark order confirmed
      const { error } = await supabase.from('orders').update({
        client_confirmed_receipt: true,
        client_confirmed_at:      new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error

      // Log activity
      await supabase.from('activity_log').insert([{
        entity_type:  'order',
        entity_id:    id,
        action:       'receipt_confirmed',
        performed_by: user.id,
        metadata: {
          description:    'Client confirmed receipt of goods',
          files_uploaded: stagedFiles.length,
        },
      }])
    },
    onSuccess: () => {
      // Clean up previews
      stagedFiles.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
      setStagedFiles([])
      setConfirmReceipt(false)
      setUploading(false)
      queryClient.invalidateQueries({ queryKey: ['client-order', id] })
      queryClient.invalidateQueries({ queryKey: ['order-docs', id] })
      queryClient.invalidateQueries({ queryKey: ['timeline', id] })
      toast.success('Receipt confirmed! NYIN has been notified.')
    },
    onError: (err) => {
      setUploading(false)
      toast.error('Failed: ' + err.message)
    }
  })

  // ── UPLOAD STANDALONE DOCS ────────────────────────────────
  const uploadDocsMutation = useMutation({
    mutationFn: async () => {
      setUploadingDocs(true)
      for (const f of docFiles) {
        await uploadOneFile(f, 'other')
      }
      await supabase.from('activity_log').insert([{
        entity_type:  'order',
        entity_id:    id,
        action:       'document_upload',
        performed_by: user.id,
        metadata: {
          description:    `${docFiles.length} document(s) uploaded`,
          files_uploaded: docFiles.length,
        },
      }])
    },
    onSuccess: () => {
      docFiles.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
      setDocFiles([])
      setUploadingDocs(false)
      queryClient.invalidateQueries({ queryKey: ['order-docs', id] })
      queryClient.invalidateQueries({ queryKey: ['timeline', id] })
      toast.success(`${docFiles.length} document(s) uploaded successfully`)
    },
    onError: (err) => {
      setUploadingDocs(false)
      toast.error('Upload failed: ' + err.message)
    }
  })

  // ── DELETE DOCUMENT ───────────────────────────────────────
  const deleteDocument = async (doc) => {
    try {
      // Remove from storage
      if (doc.storage_path) {
        await supabase.storage.from('order-documents').remove([doc.storage_path])
      }
      // Remove from DB
      await supabase.from('order_documents').delete().eq('id', doc.id)
      queryClient.invalidateQueries({ queryKey: ['order-docs', id] })
      toast.success('Document removed')
    } catch (err) {
      toast.error('Failed to remove: ' + err.message)
    }
  }

  // ── DOWNLOAD ──────────────────────────────────────────────
  const handleDownload = async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from('order-documents')
        .createSignedUrl(doc.storage_path, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch {
      window.open(doc.file_url, '_blank')
    }
  }

  // ── LOADING ───────────────────────────────────────────────
  if (isLoading) return (
    <ClientLayout>
      <div className="flex items-center justify-center py-24">
        <p className="font-display text-2xl animate-pulse" style={{ color: 'var(--gold)' }}>
          Loading...
        </p>
      </div>
    </ClientLayout>
  )

  if (!order) return (
    <ClientLayout>
      <p className="text-center py-24 text-sm" style={{ color: 'var(--text-dim)' }}>
        Order not found
      </p>
    </ClientLayout>
  )

  const isInTransit  = order.status === 'In Transit'
  const isCancelled  = order.status === 'Cancelled'
  const hasConfirmed = !!order.client_confirmed_receipt

  // My uploaded docs (not by admin)
  const myDocs    = documents.filter(d => d.profiles?.role !== 'admin')
  const adminDocs = documents.filter(d => d.profiles?.role === 'admin')

  return (
    <ClientLayout>
      <button
        onClick={() => navigate('/client/orders')}
        className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: 'var(--text-dim)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
      >
        <ArrowLeft size={14} /> Back to My Orders
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="font-display text-3xl" style={{ color: 'var(--text)' }}>
              {order.order_number}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            {order.order_type} · {format(new Date(order.created_at), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Cancelled */}
      {isCancelled && (
        <div className="rounded-xl border p-4 mb-6 flex items-center gap-3"
          style={{
            background:  'color-mix(in srgb, #f87171 5%, transparent)',
            borderColor: 'color-mix(in srgb, #f87171 20%, transparent)',
          }}>
          <AlertCircle size={16} style={{ color: '#f87171' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#fca5a5' }}>
              This order has been cancelled
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Contact NYIN International if you have questions
            </p>
          </div>
        </div>
      )}

      {/* Status Pipeline */}
      <div className="rounded-xl border p-6 mb-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="font-display text-xl mb-6" style={{ color: 'var(--text)' }}>
          Order Progress
        </h2>
        <OrderStatusPipeline currentStatus={order.status} isAdmin={false} />
        {hasConfirmed && (
          <div className="flex items-center gap-2 mt-5 text-sm"
            style={{ color: '#4ade80' }}>
            <CheckCircle size={14} />
            Receipt confirmed on{' '}
            {format(new Date(order.client_confirmed_at), 'MMMM d, yyyy — h:mm a')}
          </div>
        )}
      </div>

      {/* ── CONFIRM RECEIPT SECTION ──────────────────────────── */}
      {isInTransit && !hasConfirmed && (
        <div className="rounded-xl border mb-6 overflow-hidden"
          style={{
            background:  'var(--card)',
            borderColor: 'color-mix(in srgb, #fb923c 35%, transparent)',
          }}>

          {/* Banner header */}
          <div className="p-5 flex items-center gap-3 border-b"
            style={{
              background:  'color-mix(in srgb, #fb923c 8%, transparent)',
              borderColor: 'color-mix(in srgb, #fb923c 20%, transparent)',
            }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'color-mix(in srgb, #fb923c 20%, transparent)' }}>
              <AlertCircle size={18} style={{ color: '#fb923c' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#fdba74' }}>
                Action Required — Confirm Receipt of Goods
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                Your shipment is in transit. Upload delivery proof then confirm receipt.
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* STEP 1 — Stage proof files */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Step 1 — Upload Delivery Proof
                    <span className="text-xs font-normal ml-2" style={{ color: 'var(--text-dim)' }}>
                      (optional)
                    </span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    Add photos or documents. Files will upload when you confirm receipt.
                  </p>
                </div>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer shrink-0 ml-4 transition-all"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--gold) 40%, transparent)',
                    color:       'var(--gold)',
                    background:  'color-mix(in srgb, var(--gold) 8%, transparent)',
                  }}>
                  <Plus size={12} />
                  Add Files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    className="hidden"
                    onChange={handleStageFiles}
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Staged files grid */}
              {stagedFiles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {stagedFiles.map(f => (
                    <FilePreviewCard
                      key={f.id}
                      file={f}
                      uploading={uploading}
                      onRemove={() => removeStagedFile(f.id)}
                    />
                  ))}
                  {/* Add more */}
                  {!uploading && (
                    <label className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center h-28 cursor-pointer transition-all"
                      style={{ borderColor: 'var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <Plus size={20} style={{ color: 'var(--text-dim)' }} />
                      <span className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                        Add more
                      </span>
                      <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx"
                        className="hidden" onChange={handleStageFiles} />
                    </label>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all"
                  style={{ borderColor: 'var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'color-mix(in srgb, #fb923c 40%, transparent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                    style={{ background: 'color-mix(in srgb, #fb923c 12%, transparent)' }}>
                    <ImageIcon size={18} style={{ color: '#fb923c' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Click to add delivery photos or documents
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                    PDF, JPG, PNG, DOCX — max 10MB each
                  </p>
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx"
                    className="hidden" onChange={handleStageFiles} />
                </label>
              )}
            </div>

            {/* Divider */}
            <div className="border-t" style={{ borderColor: 'var(--border)' }} />

            {/* STEP 2 — Confirm */}
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
                Step 2 — Confirm Receipt
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
                {stagedFiles.length > 0
                  ? `${stagedFiles.length} file(s) staged and ready to upload. Clicking confirm will upload them and notify NYIN.`
                  : 'Click confirm to notify NYIN that you have received the goods. You can optionally add proof files above first.'}
              </p>
              <button
                onClick={() => setConfirmReceipt(true)}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: '#fb923c', color: '#fff' }}
                onMouseEnter={e => !uploading && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {uploading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Uploading & Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm Receipt of Goods
                    {stagedFiles.length > 0 && ` (${stagedFiles.length} file${stagedFiles.length>1?'s':''})`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already confirmed */}
      {hasConfirmed && (
        <div className="rounded-xl border p-4 mb-6 flex items-center gap-3"
          style={{
            background:  'color-mix(in srgb, #4ade80 5%, transparent)',
            borderColor: 'color-mix(in srgb, #4ade80 20%, transparent)',
          }}>
          <CheckCircle size={18} style={{ color: '#4ade80' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#86efac' }}>
              ✓ Receipt Confirmed
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {format(new Date(order.client_confirmed_at), 'MMMM d, yyyy — h:mm a')}
            </p>
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="rounded-xl border p-6 mb-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="font-display text-xl mb-4" style={{ color: 'var(--text)' }}>
          Order Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {[
            ['Commodity',    order.commodity ?? '—'],
            ['Quantity',     order.quantity ? `${order.quantity} ${order.unit ?? ''}` : '—'],
            ['Unit Price',   order.unit_price ? `$${order.unit_price.toLocaleString()}` : '—'],
            ['Total Value',  order.total_value ? `$${order.total_value.toLocaleString()} ${order.currency}` : '—'],
            ['Origin',       order.origin_location ?? '—'],
            ['Destination',  order.destination_location ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2.5 border-b"
              style={{ borderColor: 'var(--border)' }}>
              <dt className="text-sm" style={{ color: 'var(--text-dim)' }}>{label}</dt>
              <dd className="text-sm font-medium" style={{ color: 'var(--text)' }}>{value}</dd>
            </div>
          ))}
        </div>
        {order.notes && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-dim)' }}>
              Notes
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="rounded-xl border p-6 mb-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="font-display text-xl mb-4" style={{ color: 'var(--text)' }}>
            Invoices
          </h2>
          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv.id} className="rounded-xl border p-4"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--gold)' }}>
                      {inv.invoice_number}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                      ${inv.total_amount?.toLocaleString()} {inv.currency}
                      {inv.due_date && ` · Due ${format(new Date(inv.due_date), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
                <PDFDownloadLink
                  document={<InvoicePDF invoice={inv} />}
                  fileName={`${inv.invoice_number}.pdf`}
                  style={{ textDecoration: 'none' }}
                >
                  {({ loading }) => (
                    <div className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg border cursor-pointer"
                      style={{
                        borderColor: 'color-mix(in srgb, var(--gold) 30%, transparent)',
                        color:       loading ? 'var(--text-dim)' : 'var(--gold)',
                        background:  'color-mix(in srgb, var(--gold) 6%, transparent)',
                      }}>
                      <Download size={12} />
                      {loading ? 'Generating PDF...' : 'Download Invoice PDF'}
                    </div>
                  )}
                </PDFDownloadLink>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DOCUMENTS SECTION ────────────────────────────────── */}
      <div className="rounded-xl border p-6 mb-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="font-display text-xl mb-4" style={{ color: 'var(--text)' }}>
          Documents
        </h2>

        {/* Admin docs (read-only) */}
        {adminDocs.length > 0 && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-dim)' }}>
              From NYIN Team
            </p>
            <div className="space-y-2">
              {adminDocs.map(doc => (
                <div key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'color-mix(in srgb, var(--gold) 12%, transparent)' }}>
                      <FileText size={14} style={{ color: 'var(--gold)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--text)' }}>
                        {doc.file_name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDownload(doc)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors shrink-0 ml-2"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--gold) 40%, transparent)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                    <Download size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My docs (with delete) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
              My Documents
            </p>
          </div>

          {/* Staged doc files */}
          {docFiles.length > 0 && (
            <div className="mb-3">
              <p className="text-xs mb-2" style={{ color: 'var(--gold)' }}>
                {docFiles.length} file(s) ready to upload — click Upload to send
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {docFiles.map(f => (
                  <FilePreviewCard
                    key={f.id}
                    file={f}
                    uploading={uploadingDocs}
                    onRemove={() => removeDocFile(f.id)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => uploadDocsMutation.mutate()}
                  disabled={uploadingDocs}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: 'var(--gold)', color: 'var(--bg)' }}
                >
                  {uploadingDocs
                    ? <><Loader size={14} className="animate-spin" /> Uploading...</>
                    : <><Upload size={14} /> Upload {docFiles.length} File(s)</>
                  }
                </button>
                <button
                  onClick={() => {
                    docFiles.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview) })
                    setDocFiles([])
                  }}
                  className="px-4 py-2 rounded-lg border text-sm transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Uploaded my docs */}
          {myDocs.length > 0 && (
            <div className="space-y-2 mb-3">
              {myDocs.map(doc => (
                <div key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'color-mix(in srgb, #60a5fa 12%, transparent)' }}>
                      {doc.file_name?.match(/\.(jpg|jpeg|png)$/i)
                        ? <ImageIcon size={14} style={{ color: '#60a5fa' }} />
                        : <FileText  size={14} style={{ color: '#60a5fa' }} />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--text)' }}>
                        {doc.file_name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                        {doc.file_type === 'delivery_proof' ? '📦 Delivery Proof · ' : ''}
                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => handleDownload(doc)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--gold) 40%, transparent)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                      <Download size={13} />
                    </button>
                    <button onClick={() => deleteDocument(doc)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'color-mix(in srgb, #f87171 30%, transparent)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {myDocs.length === 0 && docFiles.length === 0 && (
            <div className="rounded-xl border-2 border-dashed p-8 text-center mb-3"
              style={{ borderColor: 'var(--border)' }}>
              <FileText size={22} className="mx-auto mb-2" style={{ color: 'var(--text-dim)' }} />
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                No documents uploaded yet
              </p>
            </div>
          )}

          {/* Add document button */}
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer w-fit transition-all"
            style={{
              borderColor: 'var(--border)',
              color:       'var(--text-muted)',
              background:  'var(--surface)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <Plus size={12} />
            Add Document
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              className="hidden"
              onChange={handleStageDocFiles}
              disabled={uploadingDocs}
            />
          </label>
        </div>
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline orderId={id} />

      {/* Confirm Receipt Dialog */}
      <ConfirmDialog
        isOpen={confirmReceipt}
        onClose={() => { if (!uploading) setConfirmReceipt(false) }}
        onConfirm={() => confirmReceiptMutation.mutate()}
        loading={confirmReceiptMutation.isPending || uploading}
        title="Confirm Receipt of Goods"
        message={
          stagedFiles.length > 0
            ? `You are about to upload ${stagedFiles.length} proof file(s) and confirm receipt of goods for order ${order.order_number}. NYIN International will be notified immediately. This cannot be undone.`
            : `Confirm that you have received the goods for order ${order.order_number}? NYIN International will be notified immediately. This cannot be undone.`
        }
        confirmLabel={
          uploading
            ? 'Uploading files...'
            : stagedFiles.length > 0
            ? `Upload ${stagedFiles.length} File(s) & Confirm`
            : 'Yes, Confirm Receipt'
        }
        variant="success"
      />
    </ClientLayout>
  )
}