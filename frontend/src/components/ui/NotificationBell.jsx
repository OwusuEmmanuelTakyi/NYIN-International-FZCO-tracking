import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, Package, FileText, CheckCircle, Upload } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.jsx'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const TYPE_ICONS = {
  order_created:    { icon: Package,      color: 'var(--gold)'  },
  status_updated:   { icon: Package,      color: '#60a5fa'      },
  order_cancelled:  { icon: Package,      color: '#f87171'      },
  invoice_sent:     { icon: FileText,     color: '#a78bfa'      },
  receipt_confirmed:{ icon: CheckCircle,  color: '#4ade80'      },
  document_uploaded:{ icon: Upload,       color: '#fb923c'      },
  default:          { icon: Bell,         color: 'var(--gold)'  },
}

export default function NotificationBell() {
  const [open, setOpen]   = useState(false)
  const { profile }       = useAuth()
  const queryClient       = useQueryClient()
  const navigate          = useNavigate()
  const panelRef          = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', profile.id)
        .order('sent_at', { ascending: false })
        .limit(20)
      return data ?? []
    },
    enabled: !!profile?.id,
    refetchInterval: 30000, // refresh every 30s
  })

  const unread = notifications.filter(n => !n.read_at).length

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', profile.id)
        .is('read_at', null)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  })

  const markOneRead = async (id) => {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const handleClick = async (n) => {
    await markOneRead(n.id)
    setOpen(false)
    if (n.order_id) {
      const path = profile?.role === 'admin'
        ? `/admin/orders/${n.order_id}`
        : `/client/orders/${n.order_id}`
      navigate(path)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg border transition-all"
        style={{
          borderColor: open ? 'var(--gold)' : 'var(--border)',
          color:       open ? 'var(--gold)' : 'var(--text-muted)',
          background:  open
            ? 'color-mix(in srgb, var(--gold) 10%, transparent)'
            : 'var(--card)',
        }}
      >
        <Bell size={14} />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: '#f87171', color: '#fff', fontSize: '9px' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-10 w-80 rounded-xl border shadow-2xl z-50 overflow-hidden"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Notifications
              </h3>
              {unread > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'color-mix(in srgb, #f87171 20%, transparent)', color: '#f87171' }}>
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs flex items-center gap-1 transition-colors"
                  style={{ color: 'var(--gold)' }}
                >
                  <CheckCheck size={11} />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}
                style={{ color: 'var(--text-dim)' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="p-8 text-center">
                <Bell size={24} className="mx-auto mb-2" style={{ color: 'var(--text-dim)' }} />
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  No notifications yet
                </p>
              </div>
            )}
            {notifications.map(n => {
              const meta = TYPE_ICONS[n.type] ?? TYPE_ICONS.default
              const Icon = meta.icon
              const isUnread = !n.read_at

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer border-b transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    background: isUnread
                      ? 'color-mix(in srgb, var(--gold) 5%, transparent)'
                      : 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isUnread
                      ? 'color-mix(in srgb, var(--gold) 5%, transparent)'
                      : 'transparent'
                  }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border mt-0.5"
                    style={{
                      background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
                      borderColor: `color-mix(in srgb, ${meta.color} 25%, transparent)`,
                    }}>
                    <Icon size={12} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                      {n.subject}
                    </p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-dim)' }}>
                      {n.body}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
                      {n.sent_at
                        ? formatDistanceToNow(new Date(n.sent_at), { addSuffix: true })
                        : ''}
                    </p>
                  </div>
                  {isUnread && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1"
                      style={{ background: 'var(--gold)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}