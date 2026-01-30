'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  X,
  Wallet,
  AlertCircle,
  FileText,
  CheckCircle
} from 'lucide-react'
import { createDisbursement } from '@/lib/disbursement'

interface InvoiceForDisbursement {
  id: string
  invoice_number: string
  total_amount: number
  vendor_id: string
  vendor: { id: string; company_name: string } | null
}

interface DisbursementFormProps {
  vendors: { id: string; company_name: string }[]
  invoices: InvoiceForDisbursement[]
  organizationId: string
  userId: string
}

export default function DisbursementForm({
  vendors,
  invoices,
  organizationId,
  userId
}: DisbursementFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [payeeType, setPayeeType] = useState<'vendor' | 'employee'>('vendor')
  const [vendorId, setVendorId] = useState('')
  const [payeeName, setPayeeName] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filter invoices by selected vendor
  const filteredInvoices = vendorId
    ? invoices.filter(inv => inv.vendor_id === vendorId)
    : invoices

  // Calculate total
  const totalAmount = selectedInvoices.reduce((sum, invId) => {
    const inv = invoices.find(i => i.id === invId)
    return sum + (inv?.total_amount || 0)
  }, 0)

  const toggleInvoice = (invoiceId: string) => {
    if (selectedInvoices.includes(invoiceId)) {
      setSelectedInvoices(selectedInvoices.filter(id => id !== invoiceId))
    } else {
      setSelectedInvoices([...selectedInvoices, invoiceId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (payeeType === 'vendor' && !vendorId) {
      setError('กรุณาเลือกผู้รับเงิน')
      setLoading(false)
      return
    }
    if (selectedInvoices.length === 0) {
      setError('กรุณาเลือกอย่างน้อย 1 บิล')
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Create disbursement items from selected invoices
    const items = selectedInvoices.map(invId => {
      const inv = invoices.find(i => i.id === invId)
      return {
        invoiceId: invId,
        description: `บิลเลขที่ ${inv?.invoice_number}`,
        amount: inv?.total_amount || 0
      }
    })

    const result = await createDisbursement({
      supabase,
      organizationId,
      payeeType,
      vendorId: payeeType === 'vendor' ? vendorId : undefined,
      payeeName: payeeName || undefined,
      bankAccountName: bankAccountName || undefined,
      bankAccountNumber: bankAccountNumber || undefined,
      bankName: bankName || undefined,
      items,
      notes: notes || undefined,
      createdBy: userId
    })

    if (!result.success) {
      setError(result.error || 'เกิดข้อผิดพลาด')
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  const resetForm = () => {
    setPayeeType('vendor')
    setVendorId('')
    setPayeeName('')
    setBankAccountName('')
    setBankAccountNumber('')
    setBankName('')
    setNotes('')
    setSelectedInvoices([])
    setError(null)
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
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden transform transition-all duration-200 ${open ? 'scale-100' : 'scale-95'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-coffee-900">
              สร้างใบเบิกเงิน
            </h2>
          </div>
          <button
            onClick={() => {
              if (!loading) {
                setOpen(false)
                resetForm()
              }
            }}
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

            {/* Payee Type */}
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-3">
                ประเภทผู้รับเงิน
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payeeType"
                    value="vendor"
                    checked={payeeType === 'vendor'}
                    onChange={() => setPayeeType('vendor')}
                    className="w-4 h-4 text-coffee-600"
                  />
                  <span className="text-coffee-700">ผู้ขาย (Vendor)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payeeType"
                    value="employee"
                    checked={payeeType === 'employee'}
                    onChange={() => setPayeeType('employee')}
                    className="w-4 h-4 text-coffee-600"
                  />
                  <span className="text-coffee-700">พนักงาน</span>
                </label>
              </div>
            </div>

            {/* Vendor Selection */}
            {payeeType === 'vendor' && (
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  เลือกผู้ขาย <span className="text-red-500">*</span>
                </label>
                <select
                  value={vendorId}
                  onChange={e => {
                    setVendorId(e.target.value)
                    setSelectedInvoices([])
                  }}
                  className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500"
                  required
                >
                  <option value="">เลือกผู้ขาย</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.company_name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Payee Name */}
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                ชื่อผู้รับเงิน
              </label>
              <input
                type="text"
                value={payeeName}
                onChange={e => setPayeeName(e.target.value)}
                className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500"
                placeholder="ระบุชื่อ (ถ้าต่างจากที่เลือก)"
              />
            </div>

            {/* Bank Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  ธนาคาร
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500"
                  placeholder="ชื่อธนาคาร"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  เลขบัญชี
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={e => setBankAccountNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500"
                  placeholder="เลขที่บัญชี"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  ชื่อบัญชี
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={e => setBankAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500"
                  placeholder="ชื่อบัญชี"
                />
              </div>
            </div>

            {/* Invoice Selection */}
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-3">
                เลือกบิลที่ต้องการเบิก <span className="text-red-500">*</span>
              </label>

              {filteredInvoices.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto border border-coffee-200 rounded-xl p-3">
                  {filteredInvoices.map(inv => (
                    <label
                      key={inv.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedInvoices.includes(inv.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-coffee-50 hover:bg-coffee-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(inv.id)}
                          onChange={() => toggleInvoice(inv.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <p className="font-medium text-coffee-900">{inv.invoice_number}</p>
                          <p className="text-sm text-coffee-500">
                            {inv.vendor?.company_name}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-coffee-900">
                        ฿{inv.total_amount.toLocaleString()}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-coffee-50 rounded-xl">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-coffee-300" />
                  <p className="text-coffee-500">
                    {vendorId ? 'ไม่มีบิลของผู้ขายนี้' : 'ไม่มีบิล กรุณาสร้างบิลก่อน'}
                  </p>
                </div>
              )}
            </div>

            {/* Total */}
            {selectedInvoices.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">
                      เลือก {selectedInvoices.length} รายการ
                    </p>
                    <p className="text-sm font-medium text-blue-700">ยอดรวมทั้งสิ้น</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    ฿{totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                หมายเหตุ
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 resize-none"
                placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-coffee-100 bg-coffee-50">
            <button
              type="button"
              onClick={() => {
                if (!loading) {
                  setOpen(false)
                  resetForm()
                }
              }}
              disabled={loading}
              className="px-5 py-2.5 text-coffee-600 hover:bg-coffee-100 rounded-xl transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading || selectedInvoices.length === 0}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  สร้างใบเบิก
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
        onClick={() => {
          resetForm()
          setOpen(true)
        }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        สร้างใบเบิก
      </button>
      {createPortal(modalContent, document.body)}
    </>
  )
}
