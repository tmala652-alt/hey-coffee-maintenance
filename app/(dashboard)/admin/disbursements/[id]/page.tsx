'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Printer,
  Eye,
  Building2,
  Calendar,
  Wallet,
  FileText,
  CheckCircle,
  X,
  Phone,
  Mail,
  Hash
} from 'lucide-react'

interface DisbursementItem {
  id: string
  description: string
  amount: number
  sort_order: number
}

interface Disbursement {
  id: string
  document_number: string
  document_date: string
  payee_type: string
  payee_name: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_name: string | null
  total_amount: number
  status: string
  notes: string | null
  created_at: string
  paid_at: string | null
  paid_reference: string | null
  vendor: { id: string; company_name: string; phone?: string; email?: string; address?: string } | null
  employee: { id: string; name: string } | null
  creator: { id: string; name: string } | null
  items: DisbursementItem[]
  organization: { id: string; name: string } | null
}

// Number to Thai Baht text
function numberToThaiText(num: number): string {
  const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']

  if (num === 0) return 'ศูนย์บาทถ้วน'

  const intPart = Math.floor(num)
  const decPart = Math.round((num - intPart) * 100)

  let result = ''
  let tempNum = intPart
  let position = 0

  while (tempNum > 0) {
    const digit = tempNum % 10
    if (digit !== 0) {
      if (position === 1 && digit === 1) {
        result = 'สิบ' + result
      } else if (position === 1 && digit === 2) {
        result = 'ยี่สิบ' + result
      } else if (position === 0 && digit === 1 && intPart > 10) {
        result = 'เอ็ด' + result
      } else {
        result = units[digit] + positions[position] + result
      }
    }
    tempNum = Math.floor(tempNum / 10)
    position++
  }

  result += 'บาท'

  if (decPart > 0) {
    let satang = ''
    const tens = Math.floor(decPart / 10)
    const ones = decPart % 10

    if (tens > 0) {
      if (tens === 1) satang += 'สิบ'
      else if (tens === 2) satang += 'ยี่สิบ'
      else satang += units[tens] + 'สิบ'
    }
    if (ones > 0) {
      if (ones === 1 && tens > 0) satang += 'เอ็ด'
      else satang += units[ones]
    }
    result += satang + 'สตางค์'
  } else {
    result += 'ถ้วน'
  }

  return result
}

export default function DisbursementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [disbursement, setDisbursement] = useState<Disbursement | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchDisbursement()
  }, [params.id])

  const fetchDisbursement = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('disbursement_requests')
      .select(`
        *,
        vendor:vendors(id, company_name, phone, email, address),
        employee:profiles!disbursement_requests_employee_id_fkey(id, name),
        creator:profiles!disbursement_requests_created_by_fkey(id, name),
        items:disbursement_items(*),
        organization:organizations(id, name)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error:', error)
      router.push('/admin/disbursements')
      return
    }

    setDisbursement(data)
    setLoading(false)
  }

  const handlePrint = () => {
    setShowPreview(true)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handleMarkAsPaid = async () => {
    if (!disbursement) return
    setUpdating(true)

    const supabase = createClient()
    await supabase
      .from('disbursement_requests')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', disbursement.id)

    await fetchDisbursement()
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-coffee-200 border-t-coffee-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!disbursement) {
    return (
      <div className="text-center py-12">
        <p className="text-coffee-500">ไม่พบใบเบิก</p>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }

  const statusLabels: Record<string, string> = {
    draft: 'ร่าง',
    submitted: 'ส่งแล้ว',
    processing: 'กำลังดำเนินการ',
    paid: 'จ่ายแล้ว',
    cancelled: 'ยกเลิก'
  }

  const payeeName = disbursement.payee_name ||
    disbursement.vendor?.company_name ||
    disbursement.employee?.name || '-'

  // A4 Document Component
  const A4Document = () => (
    <div className="a4-document bg-white" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '15mm 20mm',
      margin: '0 auto',
      boxSizing: 'border-box',
      fontFamily: 'Sarabun, sans-serif'
    }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ใบขอเบิกเงิน</h1>
        <p className="text-gray-600">{disbursement.organization?.name || 'Hey! Coffee Maintenance'}</p>
      </div>

      {/* Document Info */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
        <div>
          <p className="text-sm text-gray-500">เลขที่เอกสาร</p>
          <p className="text-xl font-bold text-gray-900">{disbursement.document_number}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">วันที่</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(disbursement.document_date).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Payee Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">ข้อมูลผู้รับเงิน</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ชื่อผู้รับเงิน</p>
            <p className="text-lg font-semibold text-gray-900">{payeeName}</p>
            {disbursement.vendor?.address && (
              <p className="text-sm text-gray-600 mt-1">{disbursement.vendor.address}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">ข้อมูลบัญชีธนาคาร</p>
            {disbursement.bank_name ? (
              <div>
                <p className="font-semibold text-gray-900">{disbursement.bank_name}</p>
                <p className="text-sm text-gray-700">เลขที่: {disbursement.bank_account_number}</p>
                <p className="text-sm text-gray-700">ชื่อบัญชี: {disbursement.bank_account_name}</p>
              </div>
            ) : (
              <p className="text-gray-400">-</p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">รายการเบิก</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700 w-12">ลำดับ</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">รายละเอียด</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold text-gray-700 w-32">จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {disbursement.items
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">{index + 1}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-900">{item.description}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-900">
                    {item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            {/* Empty rows for consistent look */}
            {disbursement.items.length < 5 && Array.from({ length: 5 - disbursement.items.length }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-gray-300 px-3 py-2 text-center text-gray-400">&nbsp;</td>
                <td className="border border-gray-300 px-3 py-2">&nbsp;</td>
                <td className="border border-gray-300 px-3 py-2">&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={2} className="border border-gray-300 px-3 py-3 text-right text-gray-900">
                ยอดรวมทั้งสิ้น
              </td>
              <td className="border border-gray-300 px-3 py-3 text-right text-xl text-gray-900">
                {disbursement.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount in Thai */}
      <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-600">
          <span className="font-semibold">จำนวนเงิน (ตัวอักษร):</span>{' '}
          <span className="text-blue-800">{numberToThaiText(disbursement.total_amount)}</span>
        </p>
      </div>

      {/* Notes */}
      {disbursement.notes && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">หมายเหตุ</h3>
          <p className="text-gray-700 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {disbursement.notes}
          </p>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-12 pt-8">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
            <p className="font-semibold text-gray-700">ผู้ขอเบิก</p>
            <p className="text-sm text-gray-500 mt-1">{disbursement.creator?.name || '........................'}</p>
            <p className="text-xs text-gray-400 mt-1">วันที่ ....../....../......</p>
          </div>
          <div>
            <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
            <p className="font-semibold text-gray-700">ผู้ตรวจสอบ</p>
            <p className="text-sm text-gray-500 mt-1">........................</p>
            <p className="text-xs text-gray-400 mt-1">วันที่ ....../....../......</p>
          </div>
          <div>
            <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
            <p className="font-semibold text-gray-700">ผู้อนุมัติ</p>
            <p className="text-sm text-gray-500 mt-1">........................</p>
            <p className="text-xs text-gray-400 mt-1">วันที่ ....../....../......</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        <p>เอกสารนี้พิมพ์จากระบบ {disbursement.organization?.name || 'Hey! Coffee Maintenance'}</p>
        <p>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .a4-document {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 15mm 20mm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }

        @media screen {
          .preview-modal .a4-document {
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          }
        }
      `}</style>

      {/* Header Actions - No Print */}
      <div className="no-print mb-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/disbursements"
            className="inline-flex items-center gap-2 text-coffee-600 hover:text-coffee-800"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Link>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[disbursement.status]}`}>
              {statusLabels[disbursement.status]}
            </span>
            {disbursement.status !== 'paid' && (
              <button
                onClick={handleMarkAsPaid}
                disabled={updating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {updating ? 'กำลังบันทึก...' : 'บันทึกจ่ายแล้ว'}
              </button>
            )}
            <button
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-coffee-300 text-coffee-700 rounded-lg hover:bg-coffee-50"
            >
              <Eye className="w-4 h-4" />
              ดูเอกสาร
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700"
            >
              <Printer className="w-4 h-4" />
              พิมพ์
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card - No Print */}
      <div className="no-print mb-6">
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-coffee-500 mb-1">เลขที่เอกสาร</p>
              <p className="text-xl font-bold text-coffee-900">{disbursement.document_number}</p>
            </div>
            <div>
              <p className="text-sm text-coffee-500 mb-1">ผู้รับเงิน</p>
              <p className="text-lg font-semibold text-coffee-900">{payeeName}</p>
            </div>
            <div>
              <p className="text-sm text-coffee-500 mb-1">วันที่เอกสาร</p>
              <p className="text-lg font-semibold text-coffee-900">
                {new Date(disbursement.document_date).toLocaleDateString('th-TH')}
              </p>
            </div>
            <div>
              <p className="text-sm text-coffee-500 mb-1">ยอดรวม</p>
              <p className="text-2xl font-bold text-blue-600">
                ฿{disbursement.total_amount.toLocaleString()}
              </p>
            </div>
          </div>

          {disbursement.status === 'paid' && disbursement.paid_at && (
            <div className="mt-4 pt-4 border-t border-coffee-100">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  จ่ายเงินแล้วเมื่อ {new Date(disbursement.paid_at).toLocaleString('th-TH')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Items List - No Print */}
      <div className="no-print">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-coffee-100 bg-coffee-50">
            <h3 className="font-semibold text-coffee-900">รายการเบิก ({disbursement.items.length} รายการ)</h3>
          </div>
          <div className="divide-y divide-coffee-100">
            {disbursement.items
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item, index) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-600 font-medium">
                      {index + 1}
                    </span>
                    <span className="text-coffee-900">{item.description}</span>
                  </div>
                  <span className="font-semibold text-coffee-900">
                    ฿{item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
          <div className="p-4 bg-blue-50 flex items-center justify-between">
            <span className="font-semibold text-blue-900">ยอดรวมทั้งสิ้น</span>
            <span className="text-2xl font-bold text-blue-600">
              ฿{disbursement.total_amount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50 preview-modal">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Close button */}
              <div className="no-print flex justify-end mb-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* A4 Document */}
              <div className="print-area">
                <A4Document />
              </div>

              {/* Print button */}
              <div className="no-print flex justify-center mt-6 gap-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ปิด
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700 flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  พิมพ์เอกสาร
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
