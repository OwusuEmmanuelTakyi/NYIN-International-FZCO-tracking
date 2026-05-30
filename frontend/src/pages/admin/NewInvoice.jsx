import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import { useCreateInvoice } from '../../hooks/useInvoices.js'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase.js'

export default function NewInvoice() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const createInvoice = useCreateInvoice()

  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ])
  const [taxRate, setTaxRate] = useState(0)

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: { currency: 'USD', notes: '' }
  })

  // Load order if coming from order detail
  const { data: order } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, profiles:client_id(full_name, company_name, email)')
        .eq('id', orderId)
        .single()
      return data
    },
    enabled: !!orderId
  })

  // Load invoice count for auto-numbering
  const { data: invoiceCount = 0 } = useQuery({
    queryKey: ['invoice-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
      return count ?? 0
    }
  })

  // Pre-fill from order
  useEffect(() => {
    if (order) {
      setLineItems([{
        description: `${order.order_type} — ${order.commodity ?? 'Commodity'} (${order.quantity ?? ''} ${order.unit ?? ''})`,
        quantity: order.quantity ?? 1,
        unit_price: order.unit_price ?? 0,
        total: order.total_value ?? 0,
      }])
      setValue('client_id', order.client_id)
    }
  }, [order])

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(3, '0')}`

  const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems]
    updated[index][field] = value
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = (parseFloat(updated[index].quantity) || 0) * (parseFloat(updated[index].unit_price) || 0)
    }
    setLineItems(updated)
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    await createInvoice.mutateAsync({
      invoice_number: invoiceNumber,
      order_id: orderId ?? null,
      client_id: order?.client_id ?? null,
      line_items: lineItems,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: total,
      currency: data.currency,
      status: 'Draft',
      due_date: data.due_date ?? null,
      notes: data.notes ?? null,
    })
    navigate('/admin/invoices')
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="font-display text-4xl text-white mb-2">New Invoice</h1>
        <p className="text-gray-500 text-sm mb-8">
          Invoice number: <span className="text-gold">{invoiceNumber}</span>
          {order && <span className="ml-3">· For order <span className="text-gold">{order.order_number}</span></span>}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Client info */}
          {order && (
            <div className="bg-nyin-card border border-nyin-border rounded-lg p-6">
              <h2 className="font-display text-xl text-white mb-3">Bill To</h2>
              <p className="text-white text-sm">{order.profiles?.company_name ?? order.profiles?.full_name}</p>
              <p className="text-gray-500 text-sm">{order.profiles?.email}</p>
            </div>
          )}

          {/* Line Items */}
          <div className="bg-nyin-card border border-nyin-border rounded-lg p-6">
            <h2 className="font-display text-xl text-white mb-4">Line Items</h2>

            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 uppercase tracking-wider px-1">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-1"></div>
              </div>

              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={item.description}
                    onChange={e => updateLineItem(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="col-span-5 bg-nyin-surface border border-nyin-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => updateLineItem(index, 'quantity', e.target.value)}
                    className="col-span-2 bg-nyin-surface border border-nyin-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                  />
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={e => updateLineItem(index, 'unit_price', e.target.value)}
                    className="col-span-2 bg-nyin-surface border border-nyin-border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold"
                  />
                  <div className="col-span-2 text-gold text-sm font-medium px-1">
                    ${item.total.toLocaleString()}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="col-span-1 text-gray-600 hover:text-red-400 transition-colors flex justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-2 text-gold hover:text-gold-light text-sm mt-4 transition-colors"
            >
              <Plus size={14} /> Add Line Item
            </button>

            {/* Totals */}
            <div className="border-t border-nyin-border mt-6 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-white">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tax Rate (%)</span>
                <input
                  type="number"
                  value={taxRate}
                  onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-20 bg-nyin-surface border border-nyin-border rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-gold"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax Amount</span>
                <span className="text-white">${taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-nyin-border">
                <span className="text-white">Total</span>
                <span className="text-gold">${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Due Date + Notes */}
          <div className="bg-nyin-card border border-nyin-border rounded-lg p-6 space-y-4">
            <h2 className="font-display text-xl text-white">Additional Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Due Date</label>
                <input
                  type="date"
                  {...register('due_date')}
                  className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Currency</label>
                <select
                  {...register('currency')}
                  className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold"
                >
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="GHS">GHS</option>
                  <option value="HKD">HKD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Payment instructions, bank details, etc."
                className="w-full bg-nyin-surface border border-nyin-border rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-gold placeholder-gray-600 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createInvoice.isPending}
            className="w-full bg-gold hover:bg-gold-dark text-nyin-bg font-semibold py-3 rounded transition-colors disabled:opacity-50"
          >
            {createInvoice.isPending ? 'Creating Invoice...' : 'Create Invoice'}
          </button>
        </form>
      </div>
    </AdminLayout>
  )
}