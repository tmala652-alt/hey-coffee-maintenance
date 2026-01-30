'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  User,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react'
import { processApproval } from '@/lib/approval'

interface ApprovalCardProps {
  approval: {
    id: string
    record_type: string
    record_id: string
    amount: number
    status: string
    current_level: number
    required_levels: number
    requested_at: string
    requester_notes?: string | null
    requester: { id: string; name: string } | null
  }
  userId: string
  typeLabels: Record<string, string>
  typeIcons: Record<string, React.ReactNode>
  canApprove: boolean
}

export default function ApprovalCard({
  approval,
  userId,
  typeLabels,
  typeIcons,
  canApprove
}: ApprovalCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null)
  const [comments, setComments] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAction = (actionType: 'approved' | 'rejected') => {
    setAction(actionType)
    setShowModal(true)
    setComments('')
    setError(null)
  }

  const handleSubmit = async () => {
    if (!action) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const result = await processApproval({
      supabase,
      approvalRequestId: approval.id,
      action,
      approverId: userId,
      comments: comments || undefined
    })

    if (!result.success) {
      setError(result.error || 'เกิดข้อผิดพลาด')
      setLoading(false)
      return
    }

    setShowModal(false)
    router.refresh()
  }

  const getRecordLink = () => {
    switch (approval.record_type) {
      case 'invoice':
        return `/admin/expenses/invoices/${approval.record_id}`
      case 'disbursement':
        return `/admin/disbursements/${approval.record_id}`
      default:
        return '#'
    }
  }

  return (
    <>
      <div className="card p-5 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              {typeIcons[approval.record_type]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-coffee-900">
                  {typeLabels[approval.record_type]}
                </span>
                <span className="text-sm px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                  ระดับ {approval.current_level}/{approval.required_levels}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-coffee-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {approval.requester?.name || '-'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(approval.requested_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {approval.requester_notes && (
                <p className="mt-2 text-sm text-coffee-400 flex items-start gap-1">
                  <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {approval.requester_notes}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-coffee-900">
              ฿{approval.amount.toLocaleString()}
            </p>
            <Link
              href={getRecordLink()}
              className="inline-flex items-center gap-1 text-sm text-coffee-500 hover:text-coffee-700 mt-1"
            >
              ดูรายละเอียด
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {canApprove && (
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-coffee-100">
            <button
              onClick={() => handleAction('rejected')}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              ไม่อนุมัติ
            </button>
            <button
              onClick={() => handleAction('approved')}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              อนุมัติ
            </button>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                action === 'approved' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {action === 'approved' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-coffee-900 mb-2">
                {action === 'approved' ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ'}
              </h3>
              <p className="text-coffee-500">
                {typeLabels[approval.record_type]} จำนวน{' '}
                <strong>฿{approval.amount.toLocaleString()}</strong>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                {action === 'rejected' ? 'เหตุผล (จำเป็น)' : 'หมายเหตุ (ถ้ามี)'}
              </label>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={3}
                required={action === 'rejected'}
                className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 resize-none"
                placeholder={action === 'rejected' ? 'ระบุเหตุผลที่ไม่อนุมัติ...' : 'หมายเหตุเพิ่มเติม...'}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-coffee-200 text-coffee-700 rounded-xl hover:bg-coffee-50 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (action === 'rejected' && !comments.trim())}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  action === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : action === 'approved' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    อนุมัติ
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    ไม่อนุมัติ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
