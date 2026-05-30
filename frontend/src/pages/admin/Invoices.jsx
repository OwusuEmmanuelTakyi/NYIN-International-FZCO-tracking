import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Trash2, RotateCcw } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useInvoices } from '../../hooks/useInvoices.js'
import { supabase } from '../../lib/supabase.js'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Invoices() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: invoices = [], isLoading } = useInvoices()
  const [showDeleted, setShowDeleted] = useState(false)
  const [restoringId, setRestoringId] = useState(null)

  const activeInvoices  = invoices.filter(i => !i.is_deleted)
  const deletedInvoices = invoices.filter(i => i.is_deleted)

  const handleRestore = async (inv) => {
    setRestoringId(inv.id)
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', inv.id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success(`Invoice ${inv.invoice_number} restored`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <AdminLayout>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-white">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeInvoices.length} active
            {deletedInvoices.length > 0 && ` · ${deletedInvoices.length} deleted`}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/invoices/new')}
          className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-nyin-bg px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          New Invoice
        </button>
      </div>

      {/* Active Invoices Table */}
      <div className="bg-nyin-card border border-nyin-border rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-nyin-border">
                {['Invoice #', 'Client', 'Order', 'Amount', 'Status', 'Due Date', ''].map(h => (
                  <th
                    key={h}
                    className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3 font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-nyin-border">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-600 py-12">
                    Loading invoices...
                  </td>
                </tr>
              )}

              {!isLoading && activeInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="text-center">
                      <FileText size={32} className="text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-600 text-sm">No invoices yet</p>
                      <p className="text-gray-700 text-xs mt-1">
                        Create one from an order detail page or click New Invoice
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {activeInvoices.map(inv => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                  className="hover:bg-nyin-surface cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-gold text-sm font-medium">
                    {inv.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-white text-sm">
                    {inv.profiles?.company_name ?? inv.profiles?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {inv.orders?.order_number ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-white text-sm font-medium">
                    ${inv.total_amount?.toLocaleString() ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {inv.due_date
                      ? format(new Date(inv.due_date), 'MMM d, yyyy')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">→</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deleted Invoices */}
      {deletedInvoices.length > 0 && (
        <div>
          {/* Toggle header */}
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className="flex items-center gap-2 mb-4 text-gray-500 hover:text-white transition-colors group"
          >
            <Trash2 size={14} className="text-red-400" />
            <span className="font-display text-lg text-gray-400 group-hover:text-white transition-colors">
              Deleted Invoices
            </span>
            <span className="text-xs text-gray-600 bg-nyin-card border border-nyin-border px-2 py-0.5 rounded-full">
              {deletedInvoices.length}
            </span>
            <span className="text-xs text-gray-600">
              {showDeleted ? '▲ hide' : '▼ show'}
            </span>
          </button>

          {showDeleted && (
            <div className="bg-nyin-card border border-red-500/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-nyin-border">
                      {['Invoice #', 'Client', 'Amount', 'Deleted On', ''].map(h => (
                        <th
                          key={h}
                          className="text-left text-xs text-gray-600 uppercase tracking-wider px-4 py-3 font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nyin-border">
                    {deletedInvoices.map(inv => (
                      <tr key={inv.id} className="opacity-60 hover:opacity-80 transition-opacity">
                        <td className="px-4 py-3 text-gray-500 text-sm line-through">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm">
                          {inv.profiles?.company_name ?? inv.profiles?.full_name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm">
                          ${inv.total_amount?.toLocaleString() ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {inv.deleted_at
                            ? format(new Date(inv.deleted_at), 'MMM d, yyyy')
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRestore(inv)}
                            disabled={restoringId === inv.id}
                            className="flex items-center gap-1.5 text-green-400 hover:text-green-300 text-xs border border-green-400/20 hover:border-green-400/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={11} />
                            {restoringId === inv.id ? 'Restoring...' : 'Restore'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}