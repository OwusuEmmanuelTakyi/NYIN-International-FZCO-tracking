import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { format } from 'date-fns'
import {
  CheckCircle, FileText, Upload,
  AlertCircle, Plus, MessageSquare,
  Package, Send
} from 'lucide-react'

const EVENT_ICONS = {
  order_created:    { icon: Package,       color: '#C9A646' },
  status_updated:   { icon: CheckCircle,   color: '#4ade80' },
  order_cancelled:  { icon: AlertCircle,   color: '#f87171' },
  order_reopened:   { icon: CheckCircle,   color: '#C9A646' },
  invoice_created:  { icon: FileText,      color: '#60a5fa' },
  invoice_sent:     { icon: Send,          color: '#a78bfa' },
  invoice_paid:     { icon: CheckCircle,   color: '#4ade80' },
  document_upload:  { icon: Upload,        color: '#fb923c' },
  receipt_confirmed:{ icon: CheckCircle,   color: '#4ade80' },
  note:             { icon: MessageSquare, color: '#9CA3AF' },
  default:          { icon: Plus,          color: '#6B7280' },
}

function TimelineEvent({ event, isLast }) {
  const meta   = EVENT_ICONS[event.action] ?? EVENT_ICONS.default
  const Icon   = meta.icon
  const color  = meta.color

  return (
    <div className="flex gap-3">
      {/* Icon + line */}
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
          style={{
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
          }}
        >
          <Icon size={13} style={{ color }} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-1 mb-1 min-h-4"
            style={{ background: 'var(--border)' }} />
        )}
      </div>

      {/* Content */}
      <div className={`pb-4 flex-1 min-w-0 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {event.description}
          </p>
          <span className="text-xs shrink-0" style={{ color: 'var(--text-dim)' }}>
            {format(new Date(event.created_at), 'MMM d, HH:mm')}
          </span>
        </div>
        {event.by_name && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            by {event.by_name}
          </p>
        )}
        {event.metadata?.note && (
          <div
            className="mt-2 px-3 py-2 rounded-lg text-xs border-l-2"
            style={{
              background: 'var(--surface)',
              borderLeftColor: color,
              color: 'var(--text-muted)',
            }}
          >
            {event.metadata.note}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ActivityTimeline({ orderId }) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const isAdmin = profile?.role === 'admin'

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['timeline', orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*, profiles:performed_by(full_name, role)')
        .eq('entity_id', orderId)
        .order('created_at', { ascending: false })
      return (data ?? []).map(e => ({
        ...e,
        by_name: e.profiles?.full_name,
        description: e.metadata?.description ?? formatAction(e.action, e.metadata),
      }))
    }
  })

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('activity_log').insert([{
        entity_type: 'order',
        entity_id:   orderId,
        action:      'note',
        performed_by: profile?.id,
        metadata: {
          note,
          description: `Note added`,
        },
      }])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', orderId] })
      setNote('')
      setAdding(false)
    }
  })

  function formatAction(action, meta) {
    switch (action) {
      case 'order_created':    return 'Order created'
      case 'status_updated':   return `Status changed to "${meta?.status ?? ''}"`
      case 'order_cancelled':  return 'Order cancelled'
      case 'order_reopened':   return 'Order reopened'
      case 'invoice_created':  return `Invoice ${meta?.invoice_number ?? ''} created`
      case 'invoice_sent':     return `Invoice ${meta?.invoice_number ?? ''} sent to client`
      case 'invoice_paid':     return `Invoice ${meta?.invoice_number ?? ''} marked as paid`
      case 'document_upload':  return `Document uploaded: ${meta?.file_name ?? ''}`
      case 'receipt_confirmed':return 'Client confirmed receipt'
      case 'note':             return 'Note added'
      default:                 return action.replace(/_/g, ' ')
    }
  }

  return (
    <div
      className="rounded-xl border"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="p-5 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border)' }}
      >
        <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>
          Activity Timeline
        </h2>
        {isAdmin && (
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{
              borderColor: 'var(--border)',
              color: adding ? 'var(--gold)' : 'var(--text-dim)',
              background: adding
                ? 'color-mix(in srgb, var(--gold) 10%, transparent)'
                : 'transparent',
            }}
          >
            <MessageSquare size={11} />
            Add Note
          </button>
        )}
      </div>

      {/* Add note form */}
      {adding && (
        <div className="px-5 pt-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add an internal note about this order..."
            rows={3}
            className="w-full rounded-lg px-3 py-2.5 text-sm border resize-none focus:outline-none transition-colors"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setAdding(false); setNote('') }}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => addNote.mutate()}
              disabled={!note.trim() || addNote.isPending}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--gold)', color: 'var(--bg)' }}
            >
              {addNote.isPending ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </div>
      )}

      {/* Events */}
      <div className="p-5">
        {isLoading && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>
            Loading timeline...
          </p>
        )}
        {!isLoading && events.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>
            No activity yet
          </p>
        )}
        {events.map((event, i) => (
          <TimelineEvent
            key={event.id}
            event={event}
            isLast={i === events.length - 1}
          />
        ))}
      </div>
    </div>
  )
}