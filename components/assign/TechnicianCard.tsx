'use client'

import { Star, Briefcase, MapPin, Clock, Award, ChevronRight } from 'lucide-react'
import type { AssignmentCandidate } from '@/lib/auto-assign'
import { clsx } from 'clsx'

interface TechnicianCardProps {
  candidate: AssignmentCandidate
  rank: number
  onAssign: (profileId: string) => void
  isAssigning?: boolean
  showDetails?: boolean
}

export default function TechnicianCard({
  candidate,
  rank,
  onAssign,
  isAssigning = false,
  showDetails = true,
}: TechnicianCardProps) {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
      case 3:
        return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
      default:
        return 'bg-coffee-200 text-coffee-700'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-matcha-600'
    if (score >= 0.6) return 'text-honey-600'
    if (score >= 0.4) return 'text-orange-600'
    return 'text-cherry-600'
  }

  const getFactorBar = (value: number) => {
    const percentage = Math.round(value * 100)
    let color = 'bg-matcha-500'
    if (percentage < 40) color = 'bg-cherry-500'
    else if (percentage < 70) color = 'bg-honey-500'

    return (
      <div className="flex-1 h-1.5 bg-coffee-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'p-4 rounded-xl border-2 transition-all hover:shadow-md',
        rank === 1
          ? 'border-matcha-300 bg-gradient-to-br from-matcha-50 to-white'
          : 'border-coffee-100 bg-white hover:border-coffee-200'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        <div
          className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0',
            getRankBadge(rank)
          )}
        >
          {rank}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-coffee-900 truncate">{candidate.name}</h4>
            <div
              className={clsx(
                'text-xl font-bold',
                getScoreColor(candidate.score)
              )}
            >
              {Math.round(candidate.score * 100)}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3 text-xs text-coffee-500 mb-3">
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              งาน: {candidate.currentWorkload}/{candidate.maxWorkload}
            </span>
            {candidate.skills.length > 0 && (
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5" />
                ทักษะ: {candidate.skills.length} รายการ
              </span>
            )}
          </div>

          {/* Factor Breakdown */}
          {showDetails && (
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-coffee-500 w-16">ทักษะ</span>
                {getFactorBar(candidate.factors.skillMatch)}
                <span className="text-xs font-medium text-coffee-600 w-8 text-right">
                  {Math.round(candidate.factors.skillMatch * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-coffee-500 w-16">ว่าง</span>
                {getFactorBar(candidate.factors.workload)}
                <span className="text-xs font-medium text-coffee-600 w-8 text-right">
                  {Math.round(candidate.factors.workload * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-coffee-500 w-16">พร้อม</span>
                {getFactorBar(candidate.factors.availability)}
                <span className="text-xs font-medium text-coffee-600 w-8 text-right">
                  {Math.round(candidate.factors.availability * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Skills Tags */}
          {candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {candidate.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill.id}
                  className="text-xs bg-coffee-100 text-coffee-600 px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  {skill.category}
                  <span className="flex">
                    {Array.from({ length: skill.skill_level || 1 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-2.5 w-2.5 fill-honey-400 text-honey-400"
                      />
                    ))}
                  </span>
                </span>
              ))}
              {candidate.skills.length > 3 && (
                <span className="text-xs text-coffee-400">
                  +{candidate.skills.length - 3} อื่นๆ
                </span>
              )}
            </div>
          )}

          {/* Assign Button */}
          <button
            onClick={() => onAssign(candidate.profileId)}
            disabled={isAssigning}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              rank === 1
                ? 'bg-matcha-500 text-white hover:bg-matcha-600 disabled:bg-matcha-300'
                : 'bg-coffee-100 text-coffee-700 hover:bg-coffee-200 disabled:bg-coffee-50'
            )}
          >
            {isAssigning ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                กำลังมอบหมาย...
              </>
            ) : (
              <>
                มอบหมายงาน
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Compact version for lists
export function TechnicianCardCompact({
  candidate,
  rank,
  onSelect,
  isSelected = false,
}: {
  candidate: AssignmentCandidate
  rank: number
  onSelect: (profileId: string) => void
  isSelected?: boolean
}) {
  return (
    <button
      onClick={() => onSelect(candidate.profileId)}
      className={clsx(
        'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
        isSelected
          ? 'border-matcha-500 bg-matcha-50'
          : 'border-coffee-100 hover:border-coffee-200'
      )}
    >
      <div
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
          rank === 1
            ? 'bg-yellow-500 text-white'
            : rank === 2
            ? 'bg-gray-400 text-white'
            : rank === 3
            ? 'bg-orange-400 text-white'
            : 'bg-coffee-200 text-coffee-700'
        )}
      >
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-coffee-900 truncate">{candidate.name}</p>
        <p className="text-xs text-coffee-500">
          งาน: {candidate.currentWorkload}/{candidate.maxWorkload} |
          คะแนน: {Math.round(candidate.score * 100)}
        </p>
      </div>

      <div
        className={clsx(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center',
          isSelected ? 'border-matcha-500 bg-matcha-500' : 'border-coffee-300'
        )}
      >
        {isSelected && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  )
}
