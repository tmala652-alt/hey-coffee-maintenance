'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  X,
  Trash2,
  AlertCircle,
  Upload,
  FileText
} from 'lucide-react'
import { VendorInvoice, ExpenseCategory } from '@/types/database.types'

interface InvoiceFormProps {
  invoice?: VendorInvoice
  vendors: { id: string; company_name: string }[]
  categories: ExpenseCategory[]
  branches: { id: string; name: string; code: string }[]
  organizationId: string
  userId: string
}

interface InvoiceItem {
  id?: string
  description: string
  categoryId: string
  quantity: number
  unit: string
  unitPrice: number
}

export default function InvoiceForm({
  invoice,
  vendors,
  categories,
  branches,
  organizationId,
  userId
}: InvoiceFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    invoiceNumber: invoice?.invoice_number || '',
    invoiceDate: invoice?.invoice_date || new Date().toISOString().split('T')[0],
    dueDate: invoice?.due_date || '',
    vendorId: invoice?.vendor_id || '',
    branchId: invoice?.branch_id || '',
    vatPercent: invoice?.vat_percent || 7,
    notes: invoice?.notes || ''
  })

  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items?.map(item => ({
      id: item.id,
      description: item.description,
      categoryId: item.category_id || '',
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unit_price
    })) || [
      { description: '', categoryId: '', quantity: 1, unit: 'ชิ้น', unitPrice: 0 }
    ]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const addItem = () => {
    setItems([...items, { description: '', categoryId: '', quantity: 1, unit: 'ชิ้น', unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const vatAmount = Math.round((subtotal * form.vatPercent / 100) * 100) / 100
  const totalAmount = subtotal + vatAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!form.invoiceNumber.trim()) {
      setError('กรุณาระบุเลขที่บิล')
      setLoading(false)
      return
    }
    if (!form.vendorId) {
      setError('กรุณาเลือกผู้ขาย')
      setLoading(false)
      return
    }
    if (items.some(item => !item.description.trim())) {
      setError('กรุณาระบุรายละเอียดสินค้า/บริการทุกรายการ')
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      if (invoice) {
        // Update existing invoice
        const { error: updateError } = await supabase
          .from('vendor_invoices')
          .update({
            invoice_number: form.invoiceNumber,
            invoice_date: form.invoiceDate,
            due_date: form.dueDate || null,
            vendor_id: form.vendorId,
            branch_id: form.branchId || null,
            subtotal,
            vat_percent: form.vatPercent,
            vat_amount: vatAmount,
            total_amount: totalAmount,
            notes: form.notes || null
          })
          .eq('id', invoice.id)

        if (updateError) throw updateError

        // Delete old items and insert new ones
        await supabase
          .from('vendor_invoice_items')
          .delete()
          .eq('invoice_id', invoice.id)

        const invoiceItems = items.map((item, index) => ({
          invoice_id: invoice.id,
          description: item.description,
          category_id: item.categoryId || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          sort_order: index
        }))

        const { error: itemsError } = await supabase
          .from('vendor_invoice_items')
          .insert(invoiceItems)

        if (itemsError) throw itemsError

      } else {
        // Create new invoice
        const { data: newInvoice, error: createError } = await supabase
          .from('vendor_invoices')
          .insert({
            organization_id: organizationId,
            invoice_number: form.invoiceNumber,
            invoice_date: form.invoiceDate,
            due_date: form.dueDate || null,
            vendor_id: form.vendorId,
            branch_id: form.branchId || null,
            subtotal,
            vat_percent: form.vatPercent,
            vat_amount: vatAmount,
            total_amount: totalAmount,
            status: 'draft',
            notes: form.notes || null,
            created_by: userId
          })
          .select()
          .single()

        if (createError) throw createError

        // Insert items
        const invoiceItems = items.map((item, index) => ({
          invoice_id: newInvoice.id,
          description: item.description,
          category_id: item.categoryId || null,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          sort_order: index
        }))

        const { error: itemsError } = await supabase
          .from('vendor_invoice_items')
          .insert(invoiceItems)

        if (itemsError) throw itemsError
      }

      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !loading && setOpen(false)}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-200 ${open ? 'scale-100' : 'scale-95'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-coffee-100 rounded-xl">
              <FileText className="w-5 h-5 text-coffee-600" />
            </div>
            <h2 className="text-xl font-semibold text-coffee-900">
              {invoice ? 'แก้ไขบิล' : 'เพิ่มบิลใหม่'}
            </h2>
          </div>
          <button
            onClick={() => !loading && setOpen(false)}
            className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-coffee-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  เลขที่บิล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500"
                  placeholder="INV-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  วันที่บิล <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.invoiceDate}
                  onChange={e => setForm({ ...form, invoiceDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  วันครบกำหนดชำระ
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  ผู้ขาย <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.vendorId}
                  onChange={e => setForm({ ...form, vendorId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500"
                  required
                >
                  <option value="">เลือกผู้ขาย</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  สาขา
                </label>
                <select
                  value={form.branchId}
                  onChange={e => setForm({ ...form, branchId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500"
                >
                  <option value="">เลือกสาขา (ถ้ามี)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-coffee-700">
                  รายการสินค้า/บริการ
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-coffee-100 text-coffee-700 rounded-lg hover:bg-coffee-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มรายการ
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 p-4 bg-coffee-50 rounded-xl"
                  >
                    <div className="col-span-12 md:col-span-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => updateItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 text-sm"
                        placeholder="รายละเอียด"
                        required
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <select
                        value={item.categoryId}
                        onChange={e => updateItem(index, 'categoryId', e.target.value)}
                        className="w-full px-3 py-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 text-sm"
                      >
                        <option value="">ประเภท</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 text-sm text-center"
                        placeholder="จำนวน"
                        min="0"
                        step="any"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={e => updateItem(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 text-sm text-center"
                        placeholder="หน่วย"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 text-sm text-right"
                        placeholder="ราคา/หน่วย"
                        min="0"
                        step="any"
                      />
                    </div>
                    <div className="col-span-5 md:col-span-1 flex items-center justify-end">
                      <span className="text-sm font-medium text-coffee-700">
                        ฿{(item.quantity * item.unitPrice).toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-coffee-500">ยอดรวมก่อน VAT</span>
                  <span className="font-medium text-coffee-900">฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-coffee-500">
                    VAT
                    <input
                      type="number"
                      value={form.vatPercent}
                      onChange={e => setForm({ ...form, vatPercent: parseFloat(e.target.value) || 0 })}
                      className="w-16 mx-2 px-2 py-1 border border-coffee-200 rounded text-center text-sm"
                      min="0"
                      max="100"
                      step="any"
                    />
                    %
                  </span>
                  <span className="font-medium text-coffee-900">฿{vatAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-coffee-200">
                  <span className="font-semibold text-coffee-900">ยอดรวมทั้งสิ้น</span>
                  <span className="font-bold text-lg text-coffee-900">฿{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                หมายเหตุ
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 resize-none"
                placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-coffee-100 bg-coffee-50">
            <button
              type="button"
              onClick={() => !loading && setOpen(false)}
              disabled={loading}
              className="px-5 py-2.5 text-coffee-600 hover:bg-coffee-100 rounded-xl transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-coffee-600 text-white rounded-xl hover:bg-coffee-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  {invoice ? 'บันทึกการแก้ไข' : 'สร้างบิล'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {invoice ? 'แก้ไข' : 'เพิ่มบิล'}
      </button>
      {createPortal(modalContent, document.body)}
    </>
  )
}
