import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Package, FileText, LogOut, Menu, X, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useTheme } from '../../hooks/useTheme.jsx'
import NotificationBell from '../ui/NotificationBell.jsx'
import toast from 'react-hot-toast'

// Try to import logo
let logoSrc = null
try {
  logoSrc = new URL('../../assets/logo.png', import.meta.url).href
} catch {
  logoSrc = null
}

const navItems = [
  { to: '/client/orders',   icon: Package,  label: 'My Orders'   },
  { to: '/client/invoices', icon: FileText, label: 'My Invoices' },
]

export default function ClientLayout({ children }) {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [imgError, setImgError]   = useState(false)
  const { profile, signOut }      = useAuth()
  const { isDark, toggle }        = useTheme()
  const navigate                  = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  const showLogo = logoSrc && !imgError

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── TOPBAR ──────────────────────────────────────── */}
      <header
        className="h-16 border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Left — Logo + Desktop nav */}
        <div className="flex items-center gap-6">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            {showLogo ? (
              <img
                src={logoSrc}
                alt="NYIN International"
                className="h-8 w-auto object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <div>
                <h1 className="font-display text-xl tracking-widest leading-none"
                  style={{ color: 'var(--gold)' }}>
                  NYIN
                </h1>
                <p className="text-[9px] tracking-widest uppercase"
                  style={{ color: 'var(--text-dim)' }}>
                  International FZCO
                </p>
              </div>
            )}
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '6px',
                  padding:        '6px 12px',
                  borderRadius:   '8px',
                  fontSize:       '13px',
                  fontWeight:     500,
                  transition:     'all 0.15s',
                  background:     isActive
                    ? `color-mix(in srgb, var(--gold) 12%, transparent)`
                    : 'transparent',
                  color:          isActive ? 'var(--gold)' : 'var(--text-muted)',
                  textDecoration: 'none',
                })}
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

          {/* User info — desktop */}
          <div className="hidden sm:flex items-center gap-2 mr-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center border"
              style={{
                background:  'color-mix(in srgb, var(--gold) 15%, transparent)',
                borderColor: 'color-mix(in srgb, var(--gold) 25%, transparent)',
              }}
            >
              <span className="font-display text-xs" style={{ color: 'var(--gold)' }}>
                {profile?.full_name?.[0] ?? 'C'}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-medium leading-tight" style={{ color: 'var(--text)' }}>
                {profile?.full_name}
              </p>
              {profile?.company_name && (
                <p className="text-xs" style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
                  {profile.company_name}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-4 hidden sm:block" style={{ background: 'var(--border)' }} />

          {/* Notification Bell */}
          <NotificationBell />

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all"
            style={{
              borderColor: 'var(--border)',
              color:       'var(--text-muted)',
              background:  'var(--card)',
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Sign out — desktop */}
          <button
            onClick={handleSignOut}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
            style={{
              color:       'var(--text-dim)',
              borderColor: 'transparent',
              background:  'transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color       = '#F87171'
              e.currentTarget.style.background  = 'rgba(248,113,113,0.05)'
              e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color       = 'var(--text-dim)'
              e.currentTarget.style.background  = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <LogOut size={13} />
            Sign Out
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ─────────────────────────────────── */}
      {menuOpen && (
        <div
          className="md:hidden border-b px-4 py-3 space-y-1"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display:        'flex',
                alignItems:     'center',
                gap:            '8px',
                padding:        '10px 12px',
                borderRadius:   '8px',
                fontSize:       '13px',
                background:     isActive
                  ? `color-mix(in srgb, var(--gold) 10%, transparent)`
                  : 'transparent',
                color:          isActive ? 'var(--gold)' : 'var(--text-muted)',
                textDecoration: 'none',
              })}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}

          {/* Mobile user info */}
          <div
            className="flex items-center justify-between p-3 rounded-lg mt-2 border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center border shrink-0"
                style={{
                  background:  'color-mix(in srgb, var(--gold) 15%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--gold) 25%, transparent)',
                }}
              >
                <span className="font-display text-xs" style={{ color: 'var(--gold)' }}>
                  {profile?.full_name?.[0] ?? 'C'}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {profile?.full_name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
                  {profile?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#F87171', background: 'rgba(248,113,113,0.08)' }}
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── PAGE CONTENT ────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
        {children}
      </main>
    </div>
  )
}