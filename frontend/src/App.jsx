import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { useAuth } from './hooks/useAuth.jsx'

// ── LAZY IMPORTS ──────────────────────────────────────────────
const Login         = lazy(() => import('./pages/auth/Login.jsx'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'))

const Dashboard     = lazy(() => import('./pages/admin/Dashboard.jsx'))
const Orders        = lazy(() => import('./pages/admin/Orders.jsx'))
const NewOrder      = lazy(() => import('./pages/admin/NewOrder.jsx'))
const OrderDetail   = lazy(() => import('./pages/admin/OrderDetail.jsx'))
const Clients       = lazy(() => import('./pages/admin/Clients.jsx'))
const ClientDetail  = lazy(() => import('./pages/admin/ClientDetail.jsx'))
const Invoices      = lazy(() => import('./pages/admin/Invoices.jsx'))
const NewInvoice    = lazy(() => import('./pages/admin/NewInvoice.jsx'))
const InvoiceDetail = lazy(() => import('./pages/admin/InvoiceDetail.jsx'))
const UsersPage     = lazy(() => import('./pages/admin/Users.jsx'))

const MyOrders          = lazy(() => import('./pages/client/MyOrders.jsx'))
const ClientOrderDetail = lazy(() => import('./pages/client/ClientOrderDetail.jsx'))
const MyInvoices        = lazy(() => import('./pages/client/MyInvoices.jsx'))

// ── PAGE LOADER ───────────────────────────────────────────────
function PageLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center">
        <p
          className="font-display text-3xl tracking-widest mb-4"
          style={{ color: 'var(--gold)' }}
        >
          NYIN
        </p>
        <div className="flex gap-1.5 justify-center">
          {[0, 150, 300].map(delay => (
            <div
              key={delay}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'var(--gold)',
                animation:  `bounce 1s ease-in-out ${delay}ms infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── INLINE LOADER (between page transitions — no full screen) ─
function InlineLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated gold bar */}
        <div className="w-48 h-0.5 rounded-full overflow-hidden"
          style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full"
            style={{
              background: 'var(--gold)',
              width: '40%',
              animation: 'slideLoader 1s ease-in-out infinite',
            }}
          />
        </div>
        <p className="text-xs tracking-widest uppercase"
          style={{ color: 'var(--text-dim)' }}>
          Loading
        </p>
      </div>
    </div>
  )
}

// ── PROTECTED ROUTE ───────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const { user, profile } = useAuth()

  // Still initializing — show nothing (auth context handles loader)
  if (user === undefined || (user !== null && profile === undefined)) {
    return <PageLoader />
  }

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect to correct portal instead of login
    if (profile?.role === 'admin')  return <Navigate to="/admin/dashboard" replace />
    if (profile?.role === 'client') return <Navigate to="/client/orders"   replace />
    return <Navigate to="/login" replace />
  }

  return children
}

// ── ROOT REDIRECT ─────────────────────────────────────────────
function RootRedirect() {
  const { user, profile } = useAuth()

  if (user === undefined || (user !== null && profile === undefined)) {
    return <PageLoader />
  }

  if (!user)                         return <Navigate to="/login"            replace />
  if (profile?.role === 'admin')     return <Navigate to="/admin/dashboard"  replace />
  if (profile?.role === 'client')    return <Navigate to="/client/orders"    replace />
  return <Navigate to="/login" replace />
}

// ── APP ───────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth()

  // First app load — show full page loader until auth resolves
  if (user === undefined) return <PageLoader />

  return (
    <BrowserRouter>
      <Suspense fallback={<InlineLoader />}>
        <Routes>

          {/* Public */}
          <Route path="/"              element={<RootRedirect />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ── ADMIN ──────────────────────────────────── */}
          <Route path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/orders"
            element={
              <ProtectedRoute requiredRole="admin">
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/orders/new"
            element={
              <ProtectedRoute requiredRole="admin">
                <NewOrder />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/orders/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/clients"
            element={
              <ProtectedRoute requiredRole="admin">
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/clients/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <ClientDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/invoices"
            element={
              <ProtectedRoute requiredRole="admin">
                <Invoices />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/invoices/new"
            element={
              <ProtectedRoute requiredRole="admin">
                <NewInvoice />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/invoices/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <InvoiceDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <UsersPage />
              </ProtectedRoute>
            }
          />

          {/* ── CLIENT ─────────────────────────────────── */}
          <Route path="/client/orders"
            element={
              <ProtectedRoute requiredRole="client">
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route path="/client/orders/:id"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientOrderDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/client/invoices"
            element={
              <ProtectedRoute requiredRole="client">
                <MyInvoices />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}