'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react'
import { getTrendAnalysis, type TrendData } from '@/lib/ai-assistant'
import { clsx } from 'clsx'

interface TrendChartProps {
  className?: string
}

export default function TrendChart({ className }: TrendChartProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [data, setData] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const trendData = await getTrendAnalysis(period)
      setData(trendData)
    } catch (error) {
      console.error('Trend fetch error:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [period])

  const periodLabels = {
    week: '7 วัน',
    month: '30 วัน',
    quarter: '90 วัน',
  }

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes} นาที`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} ชม. ${mins} น.` : `${hours} ชั่วโมง`
  }

  if (loading) {
    return (
      <div className={clsx('card-glass overflow-hidden', className)}>
        <div className="p-4 border-b border-coffee-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center animate-pulse">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="h-4 w-32 bg-coffee-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-coffee-100 rounded mt-1 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-40 bg-coffee-100 rounded-xl" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-coffee-100 rounded-xl" />
              <div className="h-20 bg-coffee-100 rounded-xl" />
              <div className="h-20 bg-coffee-100 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const completionRate = data.totalRequests > 0
    ? Math.round((data.completedRequests / data.totalRequests) * 100)
    : 0

  const breachRate = data.totalRequests > 0
    ? Math.round((data.slaBreaches / data.totalRequests) * 100)
    : 0

  return (
    <div className={clsx('card-glass overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-coffee-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-coffee-900">วิเคราะห์แนวโน้ม</h3>
              <p className="text-sm text-coffee-500">ข้อมูลย้อนหลัง {periodLabels[period]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="flex bg-coffee-100 rounded-lg p-0.5">
              {(['week', 'month', 'quarter'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={clsx(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    period === p
                      ? 'bg-white text-coffee-900 shadow-sm'
                      : 'text-coffee-600 hover:text-coffee-800'
                  )}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>

            <button
              onClick={fetchData}
              className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
              title="รีเฟรช"
            >
              <RefreshCw className="h-4 w-4 text-coffee-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-sky-50 rounded-xl">
            <p className="text-3xl font-bold text-sky-700">{data.totalRequests}</p>
            <p className="text-xs text-sky-600">งานทั้งหมด</p>
          </div>
          <div className="text-center p-3 bg-matcha-50 rounded-xl">
            <p className="text-3xl font-bold text-matcha-700">{completionRate}%</p>
            <p className="text-xs text-matcha-600">สำเร็จ</p>
          </div>
          <div className="text-center p-3 bg-cherry-50 rounded-xl">
            <p className="text-3xl font-bold text-cherry-700">{breachRate}%</p>
            <p className="text-xs text-cherry-600">เลย SLA</p>
          </div>
        </div>

        {/* Average Resolution Time */}
        <div className="flex items-center justify-between p-3 bg-honey-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-honey-600" />
            <span className="text-sm text-honey-700">เวลาแก้ไขเฉลี่ย</span>
          </div>
          <span className="font-bold text-honey-800">
            {formatMinutes(data.avgResolutionTime)}
          </span>
        </div>

        {/* Category Breakdown */}
        {data.categories.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-coffee-700 mb-3">ปัญหาตามหมวดหมู่</h4>
            <div className="space-y-2">
              {data.categories.slice(0, 5).map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-6 text-center">
                    <span className="text-xs font-bold text-coffee-500">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-coffee-700">{cat.name}</span>
                      <span className="text-xs text-coffee-500">
                        {cat.count} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-coffee-100 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all',
                          idx === 0 ? 'bg-cherry-500' :
                          idx === 1 ? 'bg-orange-500' :
                          idx === 2 ? 'bg-honey-500' :
                          'bg-coffee-400'
                        )}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Issues */}
        {data.topIssues.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-coffee-700 mb-3">ปัญหาที่พบบ่อย</h4>
            <div className="space-y-2">
              {data.topIssues.map((issue, idx) => (
                <div
                  key={issue.title}
                  className="flex items-center gap-3 p-2 bg-cream-50 rounded-lg"
                >
                  <div
                    className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      idx === 0 ? 'bg-cherry-500 text-white' :
                      idx === 1 ? 'bg-orange-500 text-white' :
                      idx === 2 ? 'bg-honey-500 text-white' :
                      'bg-coffee-300 text-coffee-700'
                    )}
                  >
                    {idx + 1}
                  </div>
                  <p className="flex-1 text-sm text-coffee-700 truncate">{issue.title}</p>
                  <span className="text-xs text-coffee-500 font-medium">{issue.count} ครั้ง</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No data state */}
        {data.totalRequests === 0 && (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-coffee-300 mx-auto mb-3" />
            <p className="text-coffee-500">ไม่มีข้อมูลในช่วงเวลานี้</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Mini stat card for dashboard
export function TrendStatCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'coffee',
}: {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  color?: 'coffee' | 'matcha' | 'cherry' | 'honey' | 'sky' | 'purple'
}) {
  const colorClasses = {
    coffee: 'from-coffee-100 to-coffee-200 text-coffee-700',
    matcha: 'from-matcha-100 to-matcha-200 text-matcha-700',
    cherry: 'from-cherry-100 to-cherry-200 text-cherry-700',
    honey: 'from-honey-100 to-honey-200 text-honey-700',
    sky: 'from-sky-100 to-sky-200 text-sky-700',
    purple: 'from-purple-100 to-purple-200 text-purple-700',
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-coffee-500">{label}</p>
          <p className="text-2xl font-bold text-coffee-900 mt-1">{value}</p>
          {change !== undefined && (
            <div
              className={clsx(
                'flex items-center gap-1 mt-1 text-xs',
                change > 0 ? 'text-cherry-600' : change < 0 ? 'text-matcha-600' : 'text-coffee-500'
              )}
            >
              {change > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : change < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>
                {Math.abs(change)}% {changeLabel || ''}
              </span>
            </div>
          )}
        </div>
        <div
          className={clsx(
            'w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center',
            colorClasses[color]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
