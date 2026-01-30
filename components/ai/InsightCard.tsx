'use client'

import { useState } from 'react'
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Wrench,
  BookOpen,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { AnalysisType } from '@/lib/ai-assistant'
import { getAnalysisTypeLabel } from '@/lib/ai-assistant'

interface InsightCardProps {
  type: AnalysisType
  content: string
  confidence: number
  suggestions?: string[]
  loading?: boolean
  error?: string
  onFeedback?: (helpful: boolean) => void
  className?: string
}

export default function InsightCard({
  type,
  content,
  confidence,
  suggestions = [],
  loading = false,
  error,
  onFeedback,
  className,
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [feedback, setFeedback] = useState<boolean | null>(null)

  const typeIcons: Record<AnalysisType, React.ReactNode> = {
    request_summary: <BookOpen className="h-5 w-5" />,
    root_cause: <AlertCircle className="h-5 w-5" />,
    solution_suggestion: <Wrench className="h-5 w-5" />,
    trend_analysis: <TrendingUp className="h-5 w-5" />,
    cost_prediction: <DollarSign className="h-5 w-5" />,
    preventive_recommendation: <CheckCircle className="h-5 w-5" />,
  }

  const typeColors: Record<AnalysisType, string> = {
    request_summary: 'from-sky-100 to-sky-200 text-sky-700',
    root_cause: 'from-orange-100 to-orange-200 text-orange-700',
    solution_suggestion: 'from-matcha-100 to-matcha-200 text-matcha-700',
    trend_analysis: 'from-purple-100 to-purple-200 text-purple-700',
    cost_prediction: 'from-honey-100 to-honey-200 text-honey-700',
    preventive_recommendation: 'from-teal-100 to-teal-200 text-teal-700',
  }

  const handleFeedback = (helpful: boolean) => {
    setFeedback(helpful)
    onFeedback?.(helpful)
  }

  const getConfidenceLabel = (score: number): { label: string; color: string } => {
    if (score >= 0.8) return { label: 'สูง', color: 'text-matcha-600' }
    if (score >= 0.6) return { label: 'ปานกลาง', color: 'text-honey-600' }
    return { label: 'ต่ำ', color: 'text-cherry-600' }
  }

  const confidenceInfo = getConfidenceLabel(confidence)

  if (loading) {
    return (
      <div className={clsx('card-glass overflow-hidden', className)}>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center animate-pulse">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-coffee-200 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-coffee-100 rounded w-1/2 mt-2 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-coffee-100 rounded animate-pulse" />
            <div className="h-3 bg-coffee-100 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-coffee-100 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={clsx('card-glass overflow-hidden border-cherry-200', className)}>
        <div className="p-4">
          <div className="flex items-center gap-3 text-cherry-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('card-glass overflow-hidden', className)}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-cream-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center',
                typeColors[type]
              )}
            >
              {typeIcons[type]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-coffee-900">
                  {getAnalysisTypeLabel(type)}
                </h3>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-sm text-coffee-500">
                ความมั่นใจ:{' '}
                <span className={confidenceInfo.color}>
                  {Math.round(confidence * 100)}% ({confidenceInfo.label})
                </span>
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-coffee-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-coffee-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Main Content - Rendered as markdown-like */}
          <div className="prose prose-sm prose-coffee max-w-none">
            {content.split('\n').map((line, idx) => {
              // Bold headers
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={idx} className="font-semibold text-coffee-800 mt-3 first:mt-0">
                    {line.replace(/\*\*/g, '')}
                  </p>
                )
              }
              // Bold inline
              if (line.includes('**')) {
                const parts = line.split(/(\*\*.*?\*\*)/g)
                return (
                  <p key={idx} className="text-coffee-700 text-sm">
                    {parts.map((part, i) =>
                      part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={i} className="text-coffee-800">
                          {part.replace(/\*\*/g, '')}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                )
              }
              // List items
              if (line.startsWith('- ') || line.startsWith('• ')) {
                return (
                  <p key={idx} className="text-coffee-600 text-sm ml-4 flex items-start gap-2">
                    <span className="text-coffee-400">•</span>
                    {line.slice(2)}
                  </p>
                )
              }
              // Numbered items
              if (/^\d+\.\s/.test(line)) {
                return (
                  <p key={idx} className="text-coffee-600 text-sm ml-4">
                    {line}
                  </p>
                )
              }
              // Regular line
              if (line.trim()) {
                return (
                  <p key={idx} className="text-coffee-700 text-sm">
                    {line}
                  </p>
                )
              }
              return <br key={idx} />
            })}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-coffee-100">
              <p className="text-xs font-medium text-coffee-500 mb-2">คำแนะนำเพิ่มเติม:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full"
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {onFeedback && (
            <div className="mt-4 pt-4 border-t border-coffee-100 flex items-center justify-between">
              <span className="text-xs text-coffee-500">ข้อมูลนี้มีประโยชน์ไหม?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFeedback(true)}
                  className={clsx(
                    'flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors',
                    feedback === true
                      ? 'bg-matcha-100 text-matcha-700'
                      : 'bg-coffee-50 text-coffee-500 hover:bg-coffee-100'
                  )}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  ใช่
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className={clsx(
                    'flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors',
                    feedback === false
                      ? 'bg-cherry-100 text-cherry-700'
                      : 'bg-coffee-50 text-coffee-500 hover:bg-coffee-100'
                  )}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  ไม่
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact variant for inline display
export function InsightBadge({
  type,
  summary,
  onClick,
}: {
  type: AnalysisType
  summary: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors text-left"
    >
      <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-purple-600 font-medium">
          {getAnalysisTypeLabel(type)}
        </p>
        <p className="text-sm text-purple-800 truncate">{summary}</p>
      </div>
    </button>
  )
}
