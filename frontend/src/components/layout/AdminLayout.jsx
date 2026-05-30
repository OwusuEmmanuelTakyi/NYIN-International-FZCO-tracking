import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, FileText,
  LogOut, Menu, X, ChevronRight,
  Sun, Moon, UserCog, TrendingUp, TrendingDown,
  BarChart2, Info, Clock
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useTheme } from '../../hooks/useTheme.jsx'
import NotificationBell from '../ui/NotificationBell.jsx'
import toast from 'react-hot-toast'

// Try to import logo — falls back gracefully if missing
let logoSrc = null
try {
  logoSrc = new URL('../../assets/logo.png', import.meta.url).href
} catch {
  logoSrc = null
}

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders',    icon: Package,          label: 'Orders'    },
  { to: '/admin/clients',   icon: Users,            label: 'Clients'   },
  { to: '/admin/invoices',  icon: FileText,         label: 'Invoices'  },
  { to: '/admin/users',     icon: UserCog,          label: 'Users'     },
]

// ── SPARK LINE ─────────────────────────────────────────────────
function SparkLine({ history, color }) {
  if (!history || history.length < 2) return (
    <div className="flex items-center justify-center h-16 text-xs"
      style={{ color: 'var(--text-dim)' }}>
      Collecting data...
    </div>
  )
  const min   = Math.min(...history)
  const max   = Math.max(...history)
  const range = max - min || 1
  const w = 260, h = 60, pad = 4

  const points = history.map((v, i) => {
    const x = pad + (i / (history.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')

  const lastX = pad + ((history.length - 1) / (history.length - 1)) * (w - pad * 2)
  const lastY = h - pad - ((history[history.length - 1] - min) / range) * (h - pad * 2)
  const gradId = `grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '60px' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polyline
        fill={`url(#${gradId})`}
        stroke="none"
        points={`${pad},${h} ${points} ${lastX},${h}`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  )
}

// ── PRICE POPUP ────────────────────────────────────────────────
function PricePopup({ metal, data, onClose }) {
  const isGold = metal === 'XAU'
  const color  = isGold ? 'var(--gold)' : '#A8B8C8'
  const label  = isGold ? 'Gold (XAU)' : 'Silver (XAG)'
  const desc   = isGold
    ? "The world's most enduring store of value. Gold is traded globally 23 hours a day, with the LBMA AM and PM auctions in London setting the most-watched benchmark prices."
    : "Silver serves dual roles as both a precious metal and industrial commodity. Used extensively in electronics, solar panels, and medical devices, silver's price is influenced by both investment demand and industrial consumption."

  const change    = data.price - (data.prev ?? data.price)
  const changePct = data.prev ? (change / data.prev) * 100 : 0
  const isUp      = change >= 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: 'var(--card)',
          borderColor: color,
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-start justify-between"
          style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${color} 20%, transparent)` }}>
                <BarChart2 size={11} style={{ color }} />
              </div>
              <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--text)' }}>
                {label}
              </h3>
            </div>
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
              USD Per Troy Ounce
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text-dim)', background: 'var(--border)' }}>
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Price */}
          <div>
            <div className="font-display text-4xl font-bold" style={{ color }}>
              ${data.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                {isUp
                  ? <TrendingUp  size={13} className="text-green-400" />
                  : <TrendingDown size={13} className="text-red-400"  />
                }
                <span className="text-sm font-semibold"
                  style={{ color: isUp ? '#4ade80' : '#f87171' }}>
                  {isUp ? '+' : ''}{change.toFixed(2)}
                </span>
                <span className="text-xs"
                  style={{ color: isUp ? '#4ade80' : '#f87171' }}>
                  ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
                </span>
              </div>
              <div className="flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <Clock size={10} />
                <span className="text-xs">
                  {data.updatedAt
                    ? new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'Live'}
                </span>
              </div>
            </div>
          </div>

          {/* Spark line */}
          <div className="rounded-xl p-3 border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-dim)' }}>
              Recent Trend
            </p>
            <SparkLine history={data.history} color={color} />
          </div>

          {/* Session high/low */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Session High', value: data.high, color: '#4ade80' },
              { label: 'Session Low',  value: data.low,  color: '#f87171' },
            ].map(({ label: l, value, color: c }) => (
              <div key={l} className="rounded-xl p-3 border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-dim)' }}>
                  {l}
                </p>
                <p className="font-mono text-sm font-semibold" style={{ color: c }}>
                  ${value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                </p>
              </div>
            ))}
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {desc}
          </p>

          {/* Meta */}
          <div className="rounded-xl border divide-y text-xs"
            style={{ borderColor: 'var(--border)' }}>
            {[
              { label: 'Symbol',        value: `${metal} / oz`            },
              { label: 'Benchmark',     value: 'LBMA London Fix'          },
              { label: 'Major Markets', value: 'London · Dubai · HK · NY' },
              { label: 'Trading Hours', value: 'Sun 23:00 – Fri 22:00 GMT'},
            ].map(({ label: l, value }) => (
              <div key={l} className="flex justify-between px-3 py-2"
                style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-dim)' }}>{l}</span>
                <span className="font-medium" style={{ color: 'var(--text)' }}>{value}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
            Spot prices shown for reference only. Refreshed every 60 seconds.
            Not a quote or solicitation to trade.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── PRICE CHIP ─────────────────────────────────────────────────
function PriceChip({ label, price, prevPrice, color, onClick }) {
  if (!price) return null
  const isUp   = prevPrice && price > prevPrice
  const isDown = prevPrice && price < prevPrice

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95"
      style={{
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
        background:  `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
      title={`Click for ${label} market details`}
    >
      <span className="text-xs font-bold tracking-wide" style={{ color }}>{label}</span>
      <span className="text-xs font-mono font-semibold transition-colors duration-500"
        style={{ color: isUp ? '#4ade80' : isDown ? '#f87171' : 'var(--text)' }}>
        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>/oz</span>
      {isUp   && <TrendingUp   size={10} className="text-green-400" />}
      {isDown && <TrendingDown size={10} className="text-red-400"   />}
      <Info size={10} style={{ color: `color-mix(in srgb, ${color} 50%, transparent)` }} />
    </button>
  )
}

// ── METAL TICKER ───────────────────────────────────────────────
function MetalTicker() {
  const [goldData,   setGoldData]   = useState(null)
  const [silverData, setSilverData] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [popup,      setPopup]      = useState(null)

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchPrices = async () => {
    try {
      const [goldRes, silverRes] = await Promise.all([
        fetch('https://api.gold-api.com/price/XAU'),
        fetch('https://api.gold-api.com/price/XAG'),
      ])
      if (!goldRes.ok || !silverRes.ok) throw new Error('API error')

      const gRaw = await goldRes.json()
      const sRaw = await silverRes.json()

      const goldPrice   = parseFloat(gRaw.price)
      const silverPrice = parseFloat(sRaw.price)
      if (isNaN(goldPrice) || isNaN(silverPrice)) throw new Error('Bad data')

      const now = new Date().toISOString()

      setGoldData(prev => ({
        price:     goldPrice,
        prev:      prev?.price ?? null,
        high:      Math.max(goldPrice,   prev?.high ?? goldPrice),
        low:       Math.min(goldPrice,   prev?.low  ?? goldPrice),
        history:   [...(prev?.history ?? []), goldPrice].slice(-20),
        updatedAt: now,
      }))

      setSilverData(prev => ({
        price:     silverPrice,
        prev:      prev?.price ?? null,
        high:      Math.max(silverPrice, prev?.high ?? silverPrice),
        low:       Math.min(silverPrice, prev?.low  ?? silverPrice),
        history:   [...(prev?.history ?? []), silverPrice].slice(-20),
        updatedAt: now,
      }))
    } catch (err) {
      console.warn('Metal price fetch failed:', err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center gap-3">
      {['GOLD', 'SILVER'].map(m => (
        <div key={m} className="flex items-center gap-1.5 animate-pulse">
          <span className="text-xs font-bold"
            style={{ color: m === 'GOLD' ? 'var(--gold)' : '#A8B8C8' }}>{m}</span>
          <div className="w-20 h-3 rounded" style={{ background: 'var(--border)' }} />
        </div>
      ))}
    </div>
  )

  return (
    <>
      <div className="flex items-center gap-2">
        {goldData && (
          <PriceChip
            label="GOLD"
            price={goldData.price}
            prevPrice={goldData.prev}
            color="var(--gold)"
            onClick={() => setPopup('XAU')}
          />
        )}
        <div className="w-px h-4 hidden sm:block" style={{ background: 'var(--border)' }} />
        {silverData && (
          <PriceChip
            label="SILVER"
            price={silverData.price}
            prevPrice={silverData.prev}
            color="#A8B8C8"
            onClick={() => setPopup('XAG')}
          />
        )}
        {goldData?.updatedAt && (
          <div className="hidden xl:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {new Date(goldData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {popup === 'XAU' && goldData && (
        <PricePopup metal="XAU" data={goldData} onClose={() => setPopup(null)} />
      )}
      {popup === 'XAG' && silverData && (
        <PricePopup metal="XAG" data={silverData} onClose={() => setPopup(null)} />
      )}
    </>
  )
}

// ── ADMIN LAYOUT ───────────────────────────────────────────────
export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut,  setSigningOut]  = useState(false)
  const [imgError,    setImgError]    = useState(false)
  const { profile, signOut } = useAuth()
  const { isDark, toggle }   = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const showLogo = logoSrc && !imgError

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 z-30 flex flex-col border-r
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b relative overflow-hidden"
          style={{ borderColor: 'var(--border)' }}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(ellipse at 0% 50%, var(--gold) 0%, transparent 70%)' }} />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo image or text fallback */}
              {showLogo ? (
                <img
                  src={logoSrc}
                  alt="NYIN International"
                  className="h-9 w-auto object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div>
                  <h1 className="font-display text-2xl tracking-[0.2em] leading-none"
                    style={{ color: 'var(--gold)' }}>
                    NYIN
                  </h1>
                  <p className="text-[9px] tracking-[0.25em] uppercase mt-1"
                    style={{ color: 'var(--text-dim)' }}>
                    International FZCO
                  </p>
                </div>
              )}
            </div>

            <button onClick={() => setSidebarOpen(false)}
              className="lg:hidden" style={{ color: 'var(--text-dim)' }}>
              <X size={16} />
            </button>
          </div>

          {!showLogo && (
            <div className="w-8 h-px mt-3 opacity-40" style={{ background: 'var(--gold)' }} />
          )}
        </div>

        {/* Nav label */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium"
            style={{ color: 'var(--text-dim)' }}>
            Navigation
          </p>
        </div>

        {/* Nav items */}
        <nav className="px-3 space-y-0.5 flex-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => isActive
                ? { background: `color-mix(in srgb, var(--gold) 12%, transparent)`, color: 'var(--gold)' }
                : { color: 'var(--text-muted)' }
              }
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                      style={{ background: 'var(--gold)' }} />
                  )}
                  <Icon size={15} style={{ color: isActive ? 'var(--gold)' : 'var(--text-dim)' }} />
                  <span className="flex-1 font-medium">{label}</span>
                  {isActive && (
                    <ChevronRight size={12} style={{ color: 'var(--gold)', opacity: 0.5 }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-5 border-t" style={{ borderColor: 'var(--border)' }} />

        {/* Bottom */}
        <div className="p-4 space-y-3">

          {/* Theme toggle */}
          <button onClick={toggle}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-2">
              {isDark ? <Moon size={13} /> : <Sun size={13} />}
              <span className="text-xs font-medium">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div className="w-8 h-4 rounded-full relative transition-colors duration-200"
              style={{ background: isDark ? 'var(--gold)' : 'var(--muted)' }}>
              <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200"
                style={{
                  left: isDark ? '17px' : '2px',
                  background: isDark ? 'var(--bg)' : '#fff',
                }} />
            </div>
          </button>

          {/* Profile card */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
              style={{
                background: 'color-mix(in srgb, var(--gold) 15%, transparent)',
                borderColor: 'color-mix(in srgb, var(--gold) 25%, transparent)',
              }}>
              <span className="font-display text-xs font-semibold" style={{ color: 'var(--gold)' }}>
                {profile?.full_name?.[0] ?? 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate leading-tight" style={{ color: 'var(--text)' }}>
                {profile?.full_name ?? 'Admin'}
              </p>
              <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-dim)' }}>
                {profile?.email}
              </p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
          >
            <LogOut size={13} />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-14 border-b flex items-center justify-between px-4 lg:px-6 shrink-0 gap-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

          {/* Left */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <p className="text-xs hidden md:block" style={{ color: 'var(--text-dim)' }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>

          {/* Center — Metal Prices */}
          <div className="flex-1 flex justify-center">
            <MetalTicker />
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
                background: 'var(--card)',
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-8 overflow-auto" style={{ background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}