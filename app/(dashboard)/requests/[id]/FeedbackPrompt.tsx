'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import FeedbackModal from '@/components/ui/FeedbackModal'
import { createClient } from '@/lib/supabase/client'

interface FeedbackPromptProps {
  requestId: string
  requestTitle: string
  status: string
  createdBy: string
  currentUserId: string
}

export default function FeedbackPrompt({
  requestId,
  requestTitle,
  status,
  createdBy,
  currentUserId,
}: FeedbackPromptProps) {
  const [showModal, setShowModal] = useState(false)
  const [hasFeedback, setHasFeedback] = useState<boolean | null>(null)
  const [feedback, setFeedback] = useState<{
    rating_speed: number | null
    rating_quality: number | null
    rating_service: number | null
    overall_rating: number | null
    comment: string | null
  } | null>(null)

  useEffect(() => {
    const checkFeedback = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('request_feedback')
        .select('*')
        .eq('request_id', requestId)
        .single()

      setHasFeedback(!!data)
      setFeedback(data)
    }
    checkFeedback()
  }, [requestId])

  // Only show for completed requests to the creator
  if (status !== 'completed' || createdBy !== currentUserId) {
    return null
  }

  // Still loading
  if (hasFeedback === null) {
    return null
  }

  // Already has feedback - show it
  if (hasFeedback && feedback) {
    return (
      <div className="card p-5 bg-gradient-to-br from-honey-50 to-cream-50 border-honey-200">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-5 w-5 text-honey-500 fill-honey-500" />
          <h3 className="font-semibold text-coffee-900">คะแนนที่คุณให้ไว้</h3>
        </div>
        <div className="flex items-center gap-6 mb-3">
          <div className="text-center">
            <p className="text-xs text-coffee-500">ความเร็ว</p>
            <p className="text-lg font-bold text-coffee-900">{feedback.rating_speed || '-'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-coffee-500">คุณภาพ</p>
            <p className="text-lg font-bold text-coffee-900">{feedback.rating_quality || '-'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-coffee-500">บริการ</p>
            <p className="text-lg font-bold text-coffee-900">{feedback.rating_service || '-'}</p>
          </div>
          <div className="text-center border-l border-coffee-200 pl-6">
            <p className="text-xs text-coffee-500">เฉลี่ย</p>
            <p className="text-2xl font-bold text-honey-600">
              {feedback.overall_rating?.toFixed(1) || '-'}
            </p>
          </div>
        </div>
        {feedback.comment && (
          <p className="text-sm text-coffee-600 italic">"{feedback.comment}"</p>
        )}
      </div>
    )
  }

  // No feedback yet - prompt to give
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="card p-5 w-full text-left hover:shadow-lg transition-shadow bg-gradient-to-br from-honey-50 to-cream-50 border-honey-200 group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-honey-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="h-6 w-6 text-honey-600" />
            </div>
            <div>
              <h3 className="font-semibold text-coffee-900">ให้คะแนนการซ่อม</h3>
              <p className="text-sm text-coffee-500">ช่วยเราปรับปรุงบริการให้ดีขึ้น</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-5 w-5 text-coffee-200" />
            ))}
          </div>
        </div>
      </button>

      {showModal && (
        <FeedbackModal
          requestId={requestId}
          requestTitle={requestTitle}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
