'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Edit,
  Trash2,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react'
import InvoiceForm from '../InvoiceForm'
import { VendorInvoice, ExpenseCategory } from '@/types/database.types'

interface InvoiceActionsProps {
  invoice: VendorInvoice
  vendors: { id: string; company_name: string }[]
  categories: ExpenseCategory[]
  branches: { id: string; name: string; code: string }[]
  organizationId: string
  userId: string
  isAdmin: boolean
}

export default function InvoiceActions({
  invoice,
  vendors,
  categories,
  branches,
  organizationId,
  userId,
  isAdmin
}: InvoiceActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canEdit = isAdmin || invoice.status === 'draft'
  const canDelete = isAdmin

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: deleteError } = await supabase
      .from('vendor_invoices')
      .delete()
      .eq('id', invoice.id)

    if (deleteError) {
      setError(deleteError.message)
      setLoading(false)
      return
    }

    router.push('/admin/expenses/invoices')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {canEdit && (
        <InvoiceForm
          invoice={invoice}
          vendors={vendors}
          categories={categories}
          branches={branches}
          organizationId={organizationId}
          userId={userId}
        />
      )}

      {canDelete && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-coffee-600" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-coffee-100 z-20 overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowDeleteConfirm(true)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบบิล
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-coffee-900 mb-2">
                ยืนยันการลบบิล
              </h3>
              <p className="text-coffee-500">
                คุณต้องการลบบิล <strong>{invoice.invoice_number}</strong> หรือไม่?
                <br />
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-coffee-200 text-coffee-700 rounded-xl hover:bg-coffee-50 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    ลบบิล
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
