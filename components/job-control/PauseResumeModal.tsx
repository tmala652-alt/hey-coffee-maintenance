'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Pause, Play, AlertCircle, X, Loader2 } from 'lucide-react'
import { pauseJob, resumeJob, getPauseReasonLabel } from '@/lib/job-control'
import type { PauseReasonCategory } from '@/types/database.types'
import { clsx } from 'clsx'

const PAUSE_REASONS: { value: PauseReasonCategory; label: string; icon: string }[] = [
  { value: 'waiting_parts', label: 'รออะไหล่', icon: '🔧' },
  { value: 'waiting_approval', label: 'รออนุมัติ', icon: '📝' },
  { value: 'waiting_vendor', label: 'รอ Vendor', icon: '🏢' },
  { value: 'customer_unavailable', label: 'ลูกค้าไม่สะดวก', icon: '👤' },
  { value: 'weather', label: 'สภาพอากาศ', icon: '🌧️' },
  { value: 'other', label: 'อื่นๆ', icon: '📋' },
]

interface PauseModalProps {
  requestId: string
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export function PauseModal({ requestId, userId, onClose, onSuccess }: PauseModalProps) {
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState<PauseReasonCategory | ''>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePause = async () => {
    if (!category) {
      setError('กรุณาเลือกเหตุผล')
      return
    }

    setLoading(true)
    setError('')

    const result = await pauseJob({
      requestId,
      userId,
      reason: reason || getPauseReasonLabel(category),
      reasonCategory: category,
      notes,
    })

    setLoading(false)

    if (result.success) {
      onSuccess()
    } else {
      setError(result.error || 'เกิดข้อผิดพลาด')
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Pause className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-coffee-900">พักงานชั่วคราว</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-coffee-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Reason Category */}
          <div>
            <label className="text-sm font-medium text-coffee-700 mb-2 block">
              เหตุผลการพักงาน *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAUSE_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setCategory(r.value)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-left',
                    category === r.value
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-coffee-200 hover:border-coffee-300 text-coffee-600'
                  )}
                >
                  <span className="text-lg">{r.icon}</span>
                  <span className="text-sm font-medium">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          {category === 'other' && (
            <div>
              <label className="text-sm font-medium text-coffee-700 mb-2 block">
                ระบุเหตุผล *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผลการพักงาน"
                className="w-full px-4 py-2.5 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-coffee-700 mb-2 block">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุ (ไม่บังคับ)"
              rows={3}
              className="w-full px-4 py-2.5 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                SLA จะหยุดนับเวลาจนกว่าจะกดดำเนินการต่อ กรุณาระบุเหตุผลให้ชัดเจน
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-cherry-50 border border-cherry-200 rounded-lg p-3">
              <p className="text-sm text-cherry-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-coffee-100 bg-cream-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-coffee-200 rounded-lg text-coffee-600 font-medium hover:bg-coffee-50 transition-colors"
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            onClick={handlePause}
            disabled={!category || loading || (category === 'other' && !reason)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
            พักงาน
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}

interface ResumeModalProps {
  requestId: string
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export function ResumeModal({ requestId, userId, onClose, onSuccess }: ResumeModalProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleResume = async () => {
    setLoading(true)
    setError('')

    const result = await resumeJob({
      requestId,
      userId,
      notes,
    })

    setLoading(false)

    if (result.success) {
      onSuccess()
    } else {
      setError(result.error || 'เกิดข้อผิดพลาด')
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-matcha-100 rounded-xl flex items-center justify-center">
              <Play className="h-5 w-5 text-matcha-600" />
            </div>
            <h3 className="text-lg font-semibold text-coffee-900">ดำเนินการต่อ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-coffee-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-coffee-600">
            ยืนยันการกลับมาดำเนินการต่อ? SLA จะเริ่มนับเวลาต่อจากที่หยุดไว้
          </p>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-coffee-700 mb-2 block">
              หมายเหตุการดำเนินการต่อ
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุ (ไม่บังคับ)"
              rows={3}
              className="w-full px-4 py-2.5 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-matcha-500 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-cherry-50 border border-cherry-200 rounded-lg p-3">
              <p className="text-sm text-cherry-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-coffee-100 bg-cream-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-coffee-200 rounded-lg text-coffee-600 font-medium hover:bg-coffee-50 transition-colors"
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleResume}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-matcha-500 text-white rounded-lg font-medium hover:bg-matcha-600 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            ดำเนินการต่อ
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}
