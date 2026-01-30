'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, X, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FeedbackModalProps {
  requestId: string
  requestTitle: string
  onClose: () => void
}

export default function FeedbackModal({ requestId, requestTitle, onClose }: FeedbackModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ratings, setRatings] = useState({
    speed: 0,
    quality: 0,
    service: 0,
  })
  const [comment, setComment] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('request_feedback').insert({
      request_id: requestId,
      rating_speed: ratings.speed || null,
      rating_quality: ratings.quality || null,
      rating_service: ratings.service || null,
      comment: comment || null,
      created_by: user!.id,
    })

    setLoading(false)
    if (!error) {
      setSubmitted(true)
      setTimeout(() => {
        onClose()
        router.refresh()
      }, 1500)
    }
  }

  const StarRating = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-coffee-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= value
                  ? 'fill-honey-400 text-honey-400'
                  : 'text-coffee-200 hover:text-honey-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 bg-matcha-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-matcha-600" />
          </div>
          <h2 className="text-xl font-semibold text-coffee-900 mb-2">ขอบคุณสำหรับความคิดเห็น!</h2>
          <p className="text-coffee-500">ความคิดเห็นของคุณช่วยให้เราปรับปรุงบริการได้ดียิ่งขึ้น</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-coffee-100">
          <div>
            <h2 className="text-lg font-semibold text-coffee-900">ให้คะแนนการซ่อม</h2>
            <p className="text-sm text-coffee-500 mt-0.5">{requestTitle}</p>
          </div>
          <button onClick={onClose} className="text-coffee-400 hover:text-coffee-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Overall Rating Display */}
          {(ratings.speed > 0 || ratings.quality > 0 || ratings.service > 0) && (
            <div className="text-center py-3 bg-cream-50 rounded-xl">
              <p className="text-sm text-coffee-500 mb-1">คะแนนเฉลี่ย</p>
              <div className="flex items-center justify-center gap-2">
                <Star className="h-8 w-8 fill-honey-400 text-honey-400" />
                <span className="text-3xl font-bold text-coffee-900">
                  {(
                    (ratings.speed + ratings.quality + ratings.service) /
                    [ratings.speed, ratings.quality, ratings.service].filter((r) => r > 0).length
                  ).toFixed(1)}
                </span>
                <span className="text-coffee-400 text-lg">/ 5</span>
              </div>
            </div>
          )}

          {/* Rating Fields */}
          <div className="space-y-1">
            <StarRating
              label="ความรวดเร็ว"
              value={ratings.speed}
              onChange={(v) => setRatings({ ...ratings, speed: v })}
            />
            <StarRating
              label="คุณภาพงาน"
              value={ratings.quality}
              onChange={(v) => setRatings({ ...ratings, quality: v })}
            />
            <StarRating
              label="การบริการ"
              value={ratings.service}
              onChange={(v) => setRatings({ ...ratings, service: v })}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="label">ความคิดเห็นเพิ่มเติม</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input"
              rows={3}
              placeholder="บอกเราว่าคุณคิดอย่างไร..."
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-coffee-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            ข้าม
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (ratings.speed === 0 && ratings.quality === 0 && ratings.service === 0)}
            className="btn-primary flex-1"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ส่งความคิดเห็น'}
          </button>
        </div>
      </div>
    </div>
  )
}
