'use client'

import { useState } from 'react'
import { Eye, Printer, X } from 'lucide-react'

interface DisbursementItem {
  id: string
  description: string
  amount: number
  sort_order: number
}

interface DisbursementData {
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
  vendor: { id: string; company_name: string; address?: string } | null
  employee: { id: string; name: string } | null
  creator: { id: string; name: string } | null
  items: DisbursementItem[]
}

interface DisbursementPreviewProps {
  disbursement: DisbursementData
  organizationName?: string
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

export default function DisbursementPreview({ disbursement, organizationName = 'Hey! Coffee Maintenance' }: DisbursementPreviewProps) {
  const [showPreview, setShowPreview] = useState(false)

  const payeeName = disbursement.payee_name ||
    disbursement.vendor?.company_name ||
    disbursement.employee?.name || '-'

  const handlePrint = () => {
    setShowPreview(true)
    setTimeout(() => {
      window.print()
    }, 100)
  }

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
        <p className="text-gray-600">{organizationName}</p>
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
        <p>เอกสารนี้พิมพ์จากระบบ {organizationName}</p>
        <p>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowPreview(true)}
          className="p-2 text-coffee-500 hover:text-coffee-700 hover:bg-coffee-100 rounded-lg transition-colors"
          title="ดูเอกสาร"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={handlePrint}
          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
          title="พิมพ์"
        >
          <Printer className="w-5 h-5" />
        </button>
      </div>

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
      `}</style>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[9999] overflow-auto bg-black/50">
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
              <div className="print-area shadow-2xl">
                <A4Document />
              </div>

              {/* Action buttons */}
              <div className="no-print flex justify-center mt-6 gap-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50"
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
