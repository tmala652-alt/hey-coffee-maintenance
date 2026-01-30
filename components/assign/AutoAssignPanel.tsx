'use client'

import { useState, useEffect } from 'react'
import {
  Bot,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import {
  findBestTechnician,
  assignTechnician,
  getStrategyLabel,
  type AssignmentCandidate,
  type AssignmentResult,
} from '@/lib/auto-assign'
import TechnicianCard from './TechnicianCard'
import type { MaintenanceRequest } from '@/types/database.types'
import { clsx } from 'clsx'
import { useRouter } from 'next/navigation'

interface AutoAssignPanelProps {
  request: MaintenanceRequest
  onAssigned?: () => void
  className?: string
}

export default function AutoAssignPanel({
  request,
  onAssigned,
  className,
}: AutoAssignPanelProps) {
  const router = useRouter()
  const [result, setResult] = useState<AssignmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchCandidates = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await findBestTechnician(request)
      setResult(data)
    } catch (err) {
      setError('ไม่สามารถโหลดรายชื่อช่างได้')
      console.error('Auto-assign error:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCandidates()
  }, [request.id])

  const handleAssign = async (technicianId: string) => {
    setAssigning(technicianId)
    setError(null)

    const assignResult = await assignTechnician(request.id, technicianId)

    if (assignResult.success) {
      setSuccess(true)
      setTimeout(() => {
        onAssigned?.()
        router.refresh()
      }, 1500)
    } else {
      setError(assignResult.error || 'ไม่สามารถมอบหมายงานได้')
    }
    setAssigning(null)
  }

  const handleAutoAssign = async () => {
    if (!result?.recommendedId) return
    await handleAssign(result.recommendedId)
  }

  // Success state
  if (success) {
    return (
      <div className={clsx('card-glass overflow-hidden', className)}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-matcha-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <CheckCircle2 className="h-8 w-8 text-matcha-600" />
          </div>
          <h3 className="text-lg font-semibold text-coffee-900 mb-2">มอบหมายงานสำเร็จ!</h3>
          <p className="text-coffee-500">กำลังโหลดข้อมูลใหม่...</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className={clsx('card-glass overflow-hidden', className)}>
        <div className="p-4 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-matcha-100 to-matcha-200 rounded-xl flex items-center justify-center">
              <Bot className="h-5 w-5 text-matcha-600" />
            </div>
            <div>
              <h3 className="font-semibold text-coffee-900">แนะนำช่างอัตโนมัติ</h3>
              <p className="text-sm text-coffee-500">กำลังวิเคราะห์...</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-coffee-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-coffee-200 rounded w-1/3" />
                    <div className="h-3 bg-coffee-100 rounded w-2/3" />
                    <div className="h-2 bg-coffee-100 rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // No candidates
  if (!result || result.candidates.length === 0) {
    return (
      <div className={clsx('card-glass overflow-hidden', className)}>
        <div className="p-4 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-xl flex items-center justify-center">
              <Bot className="h-5 w-5 text-coffee-600" />
            </div>
            <div>
              <h3 className="font-semibold text-coffee-900">แนะนำช่างอัตโนมัติ</h3>
              <p className="text-sm text-coffee-500">ไม่พบช่างที่พร้อมรับงาน</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-coffee-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-coffee-400" />
          </div>
          <p className="text-coffee-600 mb-4">
            ไม่พบช่างที่พร้อมรับงานในขณะนี้
            <br />
            อาจเนื่องจากช่างทุกคนมีงานเต็มแล้ว
          </p>
          <button
            onClick={fetchCandidates}
            className="flex items-center gap-2 px-4 py-2 bg-coffee-100 text-coffee-700 rounded-lg mx-auto hover:bg-coffee-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    )
  }

  const displayedCandidates = showAll ? result.candidates : result.candidates.slice(0, 3)

  return (
    <div className={clsx('card-glass overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-coffee-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-matcha-100 to-matcha-200 rounded-xl flex items-center justify-center">
              <Bot className="h-5 w-5 text-matcha-600" />
            </div>
            <div>
              <h3 className="font-semibold text-coffee-900">แนะนำช่างอัตโนมัติ</h3>
              <p className="text-sm text-coffee-500">
                พบ {result.candidates.length} คน | กลยุทธ์:{' '}
                <span className="text-matcha-600 font-medium">
                  {getStrategyLabel(result.strategy)}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={fetchCandidates}
            className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
            title="รีเฟรช"
          >
            <RefreshCw className="h-5 w-5 text-coffee-500" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-cherry-50 border border-cherry-200 rounded-lg">
          <div className="flex items-center gap-2 text-cherry-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Candidates List */}
      <div className="p-4 space-y-3">
        {displayedCandidates.map((candidate, idx) => (
          <TechnicianCard
            key={candidate.profileId}
            candidate={candidate}
            rank={idx + 1}
            onAssign={handleAssign}
            isAssigning={assigning === candidate.profileId}
          />
        ))}

        {/* Show More/Less */}
        {result.candidates.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-coffee-600 hover:text-coffee-800 transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4" />
                แสดงน้อยลง
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                แสดงทั้งหมด ({result.candidates.length - 3} คนเพิ่มเติม)
              </>
            )}
          </button>
        )}
      </div>

      {/* Auto Assign Button */}
      <div className="p-4 border-t border-coffee-100 bg-cream-50">
        <button
          onClick={handleAutoAssign}
          disabled={!result.recommendedId || assigning !== null}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-matcha-500 to-matcha-600 text-white rounded-xl font-medium hover:from-matcha-600 hover:to-matcha-700 transition-all disabled:from-coffee-300 disabled:to-coffee-400 disabled:cursor-not-allowed"
        >
          {assigning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              กำลังมอบหมาย...
            </>
          ) : (
            <>
              <Bot className="h-5 w-5" />
              มอบหมายอัตโนมัติ (อันดับ 1)
            </>
          )}
        </button>
        <p className="text-xs text-coffee-400 text-center mt-2">
          ระบบจะเลือกช่างที่เหมาะสมที่สุดตามทักษะและปริมาณงาน
        </p>
      </div>
    </div>
  )
}

// Compact inline version for request detail page
export function AutoAssignInline({
  request,
  onAssigned,
}: {
  request: MaintenanceRequest
  onAssigned?: () => void
}) {
  const router = useRouter()
  const [result, setResult] = useState<AssignmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    findBestTechnician(request).then((data) => {
      setResult(data)
      setLoading(false)
    })
  }, [request.id])

  const handleAutoAssign = async () => {
    if (!result?.recommendedId) return
    setAssigning(true)

    const assignResult = await assignTechnician(request.id, result.recommendedId)

    if (assignResult.success) {
      onAssigned?.()
      router.refresh()
    }
    setAssigning(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-coffee-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังค้นหาช่าง...
      </div>
    )
  }

  if (!result?.recommendedId) {
    return null
  }

  const recommended = result.candidates[0]

  return (
    <div className="flex items-center gap-3 p-3 bg-matcha-50 border border-matcha-200 rounded-lg">
      <Bot className="h-5 w-5 text-matcha-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-matcha-700">
          แนะนำ: <span className="font-medium">{recommended.name}</span>
        </p>
        <p className="text-xs text-matcha-600">
          คะแนน: {Math.round(recommended.score * 100)} | งาน:{' '}
          {recommended.currentWorkload}/{recommended.maxWorkload}
        </p>
      </div>
      <button
        onClick={handleAutoAssign}
        disabled={assigning}
        className="px-3 py-1.5 bg-matcha-500 text-white text-sm rounded-lg hover:bg-matcha-600 transition-colors disabled:bg-matcha-300"
      >
        {assigning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'มอบหมาย'
        )}
      </button>
    </div>
  )
}
