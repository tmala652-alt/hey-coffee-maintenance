'use client'

import { useState, useEffect } from 'react'
import {
  Lightbulb,
  Wrench,
  Replace,
  GraduationCap,
  Settings,
  ChevronRight,
  Loader2,
  AlertCircle,
  TrendingDown,
  DollarSign,
  Shield,
} from 'lucide-react'
import {
  getAIRecommendations,
  getRecommendationTypeLabel,
  type AIRecommendation,
} from '@/lib/ai-assistant'
import { clsx } from 'clsx'

export default function RecommendationsSection() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true)
      try {
        const data = await getAIRecommendations()
        setRecommendations(data)
      } catch (error) {
        console.error('Recommendations error:', error)
      }
      setLoading(false)
    }

    fetchRecommendations()
  }, [])

  const typeIcons: Record<AIRecommendation['type'], React.ReactNode> = {
    preventive_maintenance: <Wrench className="h-5 w-5" />,
    equipment_replacement: <Replace className="h-5 w-5" />,
    technician_training: <GraduationCap className="h-5 w-5" />,
    process_improvement: <Settings className="h-5 w-5" />,
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-matcha-100 text-matcha-700',
    medium: 'bg-honey-100 text-honey-700',
    high: 'bg-cherry-100 text-cherry-700',
  }

  const priorityLabels: Record<string, string> = {
    low: 'ต่ำ',
    medium: 'ปานกลาง',
    high: 'สูง',
  }

  if (loading) {
    return (
      <div className="card-glass overflow-hidden h-full">
        <div className="p-4 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-honey-100 to-honey-200 rounded-xl flex items-center justify-center animate-pulse">
              <Lightbulb className="h-5 w-5 text-honey-600" />
            </div>
            <div>
              <div className="h-4 w-32 bg-coffee-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-coffee-100 rounded mt-1 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-coffee-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass overflow-hidden h-full">
      {/* Header */}
      <div className="p-4 border-b border-coffee-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-honey-100 to-honey-200 rounded-xl flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-honey-600" />
          </div>
          <div>
            <h3 className="font-semibold text-coffee-900">คำแนะนำจาก AI</h3>
            <p className="text-sm text-coffee-500">
              {recommendations.length} รายการ
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-coffee-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-8 w-8 text-coffee-400" />
            </div>
            <p className="text-coffee-500 text-sm">
              ยังไม่มีคำแนะนำในขณะนี้
            </p>
            <p className="text-coffee-400 text-xs mt-1">
              AI จะวิเคราะห์และแนะนำเมื่อมีข้อมูลเพียงพอ
            </p>
          </div>
        ) : (
          recommendations.map((rec) => {
            const typeInfo = getRecommendationTypeLabel(rec.type)
            const isExpanded = expanded === rec.id

            return (
              <div
                key={rec.id}
                className={clsx(
                  'rounded-xl border-2 transition-all overflow-hidden',
                  rec.priority === 'high'
                    ? 'border-cherry-200 bg-cherry-50/50'
                    : rec.priority === 'medium'
                    ? 'border-honey-200 bg-honey-50/50'
                    : 'border-coffee-100 bg-white'
                )}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : rec.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        `bg-${typeInfo.color}-100 text-${typeInfo.color}-600`
                      )}
                      style={{
                        backgroundColor: typeInfo.color === 'matcha' ? '#dcfce7' :
                          typeInfo.color === 'honey' ? '#fef3c7' :
                          typeInfo.color === 'sky' ? '#e0f2fe' :
                          typeInfo.color === 'purple' ? '#f3e8ff' : '#f5f5f4',
                        color: typeInfo.color === 'matcha' ? '#15803d' :
                          typeInfo.color === 'honey' ? '#a16207' :
                          typeInfo.color === 'sky' ? '#0369a1' :
                          typeInfo.color === 'purple' ? '#7e22ce' : '#78716c'
                      }}
                    >
                      {typeIcons[rec.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full', priorityColors[rec.priority])}>
                          {priorityLabels[rec.priority]}
                        </span>
                        <span className="text-xs text-coffee-400">{typeInfo.label}</span>
                      </div>
                      <h4 className="font-medium text-coffee-900 text-sm">{rec.title}</h4>
                    </div>
                    <ChevronRight
                      className={clsx(
                        'h-5 w-5 text-coffee-400 transition-transform flex-shrink-0',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-coffee-100 mt-2 pt-3">
                    <p className="text-sm text-coffee-600 mb-3">{rec.description}</p>

                    {/* Impact */}
                    {rec.estimatedImpact && Object.keys(rec.estimatedImpact).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-coffee-500">ผลกระทบที่คาดการณ์:</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.estimatedImpact.costSaving && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-matcha-100 text-matcha-700 rounded-full text-xs">
                              <DollarSign className="h-3 w-3" />
                              ประหยัด ฿{rec.estimatedImpact.costSaving.toLocaleString()}
                            </span>
                          )}
                          {rec.estimatedImpact.timeSaving && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs">
                              <TrendingDown className="h-3 w-3" />
                              ลด {rec.estimatedImpact.timeSaving} นาที
                            </span>
                          )}
                          {rec.estimatedImpact.preventedIssues && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                              <Shield className="h-3 w-3" />
                              ป้องกัน {rec.estimatedImpact.preventedIssues} ปัญหา
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-3 py-2 bg-coffee-100 text-coffee-700 text-sm rounded-lg hover:bg-coffee-200 transition-colors">
                        ไม่สนใจ
                      </button>
                      <button className="flex-1 px-3 py-2 bg-matcha-500 text-white text-sm rounded-lg hover:bg-matcha-600 transition-colors">
                        ดำเนินการ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
