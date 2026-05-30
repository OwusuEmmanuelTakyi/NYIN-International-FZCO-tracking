import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import Login from './pages/auth/Login.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Orders from './pages/admin/Orders.jsx'
import NewOrder from './pages/admin/NewOrder.jsx'
import OrderDetail from './pages/admin/OrderDetail.jsx'
import Clients from './pages/admin/Clients.jsx'
import ClientDetail from './pages/admin/ClientDetail.jsx'
import Invoices from './pages/admin/Invoices.jsx'
import NewInvoice from './pages/admin/NewInvoice.jsx'
import InvoiceDetail from './pages/admin/InvoiceDetail.jsx'
import MyOrders from './pages/client/MyOrders.jsx'
import ClientOrderDetail from './pages/client/ClientOrderDetail.jsx'
import MyInvoices from './pages/client/MyInvoices.jsx'
import UsersPage from './pages/admin/Users.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'

// Full screen loader - only shown ONCE on initial app load
function AppLoader() {
  return (
    <div className="min-h-screen bg-nyin-bg flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-4xl text-gold tracking-widest">NYIN</p>
        <div className="flex gap-1 justify-center mt-4">
          <div className="w-1 h-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 rounded-full bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, profile } = useAuth()

  // user/profile are undefined while auth is initializing
  // null means definitively not logged in
  if (user === undefined || (user && profile === undefined)) {
    return null // render nothing - no flash, no loader
  }

  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RootRedirect() {
  const { user, profile } = useAuth()

  if (user === undefined || (user && profile === undefined)) return null

  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (profile?.role === 'client') return <Navigate to="/client/orders" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  const { user, profile } = useAuth()

  // Show loader only on very first app load before auth resolves
  if (user === undefined) return <AppLoader />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route path="/admin/dashboard"    element={<ProtectedRoute requiredRole="admin"><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/orders"       element={<ProtectedRoute requiredRole="admin"><Orders /></ProtectedRoute>} />
        <Route path="/admin/orders/new"   element={<ProtectedRoute requiredRole="admin"><NewOrder /></ProtectedRoute>} />
        <Route path="/admin/orders/:id"   element={<ProtectedRoute requiredRole="admin"><OrderDetail /></ProtectedRoute>} />
        <Route path="/admin/clients"      element={<ProtectedRoute requiredRole="admin"><Clients /></ProtectedRoute>} />
        <Route path="/admin/clients/:id"  element={<ProtectedRoute requiredRole="admin"><ClientDetail /></ProtectedRoute>} />
        <Route path="/admin/invoices"     element={<ProtectedRoute requiredRole="admin"><Invoices /></ProtectedRoute>} />
        <Route path="/admin/invoices/new" element={<ProtectedRoute requiredRole="admin"><NewInvoice /></ProtectedRoute>} />
        <Route path="/admin/invoices/:id" element={<ProtectedRoute requiredRole="admin"><InvoiceDetail /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Client */}
        <Route path="/client/orders"      element={<ProtectedRoute requiredRole="client"><MyOrders /></ProtectedRoute>} />
        <Route path="/client/orders/:id"  element={<ProtectedRoute requiredRole="client"><ClientOrderDetail /></ProtectedRoute>} />
        <Route path="/client/invoices"    element={<ProtectedRoute requiredRole="client"><MyInvoices /></ProtectedRoute>} />
         <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}