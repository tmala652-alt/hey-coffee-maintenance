'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  BookOpen,
  Clock,
  DollarSign,
  CheckSquare,
  ChevronRight,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import { getSmartSuggestions, type SmartSuggestions } from '@/lib/ai-assistant'
import type { MaintenanceRequest } from '@/types/database.types'
import { clsx } from 'clsx'

interface SuggestionPanelProps {
  request: MaintenanceRequest
  className?: string
}

export default function SuggestionPanel({ request, className }: SuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getSmartSuggestions(request)
        setSuggestions(data)
      } catch (err) {
        setError('ไม่สามารถโหลดคำแนะนำได้')
        console.error('Suggestion error:', err)
      }
      setLoading(false)
    }

    fetchSuggestions()
  }, [request.id])

  if (loading) {
    return (
      <div className={clsx('card-glass overflow-hidden', className)}>
        <div className="p-4 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center animate-pulse">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="h-4 w-32 bg-coffee-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-coffee-100 rounded mt-1 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-coffee-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={clsx('card-glass overflow-hidden', className)}>
        <div className="p-4 text-center">
          <AlertCircle className="h-8 w-8 text-coffee-400 mx-auto mb-2" />
          <p className="text-sm text-coffee-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!suggestions) return null

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes} นาที`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} ชม. ${mins} นาที` : `${hours} ชั่วโมง`
  }

  return (
    <div className={clsx('card-glass overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-coffee-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-coffee-900">AI แนะนำ</h3>
            <p className="text-sm text-coffee-500">ข้อมูลจากงานที่คล้ายกัน</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Time Estimate */}
        <div className="flex items-start gap-3 p-3 bg-sky-50 rounded-xl">
          <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sky-800">เวลาที่คาดว่าใช้</p>
            <p className="text-lg font-bold text-sky-900">
              {formatMinutes(suggestions.estimatedTime.average)}
            </p>
            <p className="text-xs text-sky-600">
              ช่วง: {formatMinutes(suggestions.estimatedTime.min)} -{' '}
              {formatMinutes(suggestions.estimatedTime.max)}
            </p>
          </div>
        </div>

        {/* Cost Estimate */}
        {suggestions.estimatedCost.average > 0 && (
          <div className="flex items-start gap-3 p-3 bg-honey-50 rounded-xl">
            <div className="w-10 h-10 bg-honey-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 text-honey-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-honey-800">ค่าใช้จ่ายโดยประมาณ</p>
              <p className="text-lg font-bold text-honey-900">
                ฿{suggestions.estimatedCost.average.toLocaleString()}
              </p>
              <p className="text-xs text-honey-600">
                ช่วง: ฿{suggestions.estimatedCost.min.toLocaleString()} - ฿
                {suggestions.estimatedCost.max.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Similar Issues Info */}
        {suggestions.similarIssues.count > 0 && (
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-purple-800">ปัญหาที่คล้ายกัน</p>
              <p className="text-lg font-bold text-purple-900">
                {suggestions.similarIssues.count} งาน
              </p>
              <p className="text-xs text-purple-600">
                แก้ไขเฉลี่ย: {formatMinutes(suggestions.similarIssues.avgResolutionTime)}
              </p>
            </div>
          </div>
        )}

        {/* Suggested Actions */}
        {suggestions.suggestedActions.length > 0 && (
          <div>
            <p className="text-sm font-medium text-coffee-700 mb-2 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              ขั้นตอนที่แนะนำ
            </p>
            <div className="space-y-2">
              {suggestions.suggestedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-matcha-50 rounded-lg"
                >
                  <div className="w-5 h-5 bg-matcha-200 text-matcha-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-matcha-800">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related KB Articles */}
        {suggestions.relatedArticles.length > 0 && (
          <div>
            <p className="text-sm font-medium text-coffee-700 mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              บทความที่เกี่ยวข้อง
            </p>
            <div className="space-y-2">
              {suggestions.relatedArticles.slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  href={`/tech/knowledge/${article.slug}`}
                  className="flex items-center justify-between p-3 bg-cream-50 hover:bg-cream-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="h-5 w-5 text-coffee-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-coffee-800 truncate group-hover:text-coffee-900">
                        {article.title}
                      </p>
                      {article.estimated_time && (
                        <p className="text-xs text-coffee-500">
                          {article.estimated_time} นาที
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-coffee-400 group-hover:text-coffee-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-cream-50 border-t border-coffee-100">
        <p className="text-xs text-coffee-400 text-center">
          ข้อมูลจากการวิเคราะห์งานที่คล้ายกัน {suggestions.similarIssues.count} รายการ
        </p>
      </div>
    </div>
  )
}

// Compact inline version
export function SuggestionInline({ request }: { request: MaintenanceRequest }) {
  const [suggestions, setSuggestions] = useState<SmartSuggestions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSmartSuggestions(request).then((data) => {
      setSuggestions(data)
      setLoading(false)
    })
  }, [request.id])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-coffee-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังวิเคราะห์...
      </div>
    )
  }

  if (!suggestions) return null

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes} นาที`
    return `${Math.round(minutes / 60)} ชม.`
  }

  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs">
        <Clock className="h-3 w-3" />~{formatMinutes(suggestions.estimatedTime.average)}
      </span>
      {suggestions.estimatedCost.average > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-honey-100 text-honey-700 rounded-full text-xs">
          <DollarSign className="h-3 w-3" />~฿{suggestions.estimatedCost.average.toLocaleString()}
        </span>
      )}
      {suggestions.relatedArticles.length > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
          <BookOpen className="h-3 w-3" />
          {suggestions.relatedArticles.length} บทความ
        </span>
      )}
    </div>
  )
}
