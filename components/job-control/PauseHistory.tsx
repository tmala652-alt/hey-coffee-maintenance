'use client'

import { useState, useEffect } from 'react'
import { Pause, Play, Clock, User, MessageSquare, History } from 'lucide-react'
import { getPauseHistory, getPauseReasonLabel } from '@/lib/job-control'
import { format, differenceInMinutes } from 'date-fns'
import { th } from 'date-fns/locale'
import type { JobPause, PauseReasonCategory } from '@/types/database.types'
import { clsx } from 'clsx'

interface PauseHistoryProps {
  requestId: string
  className?: string
}

type PauseWithProfiles = JobPause & {
  paused_by_profile?: { name: string } | null
  resumed_by_profile?: { name: string } | null
}

export default function PauseHistory({ requestId, className }: PauseHistoryProps) {
  const [pauses, setPauses] = useState<PauseWithProfiles[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPauses = async () => {
      setLoading(true)
      const history = await getPauseHistory(requestId)
      setPauses(history as PauseWithProfiles[])
      setLoading(false)
    }

    fetchPauses()
  }, [requestId])

  if (loading) {
    return (
      <div className={clsx('animate-pulse', className)}>
        <div className="h-20 bg-coffee-100 rounded-lg"></div>
      </div>
    )
  }

  if (pauses.length === 0) {
    return null
  }

  const totalPausedMinutes = pauses.reduce((total, pause) => {
    if (pause.resumed_at) {
      return total + differenceInMinutes(new Date(pause.resumed_at), new Date(pause.paused_at))
    }
    return total
  }, 0)

  return (
    <div className={clsx('card p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-coffee-900">ประวัติการหยุดพัก</h3>
        </div>
        <span className="text-sm text-coffee-500">
          รวม {pauses.length} ครั้ง ({formatDuration(totalPausedMinutes)})
        </span>
      </div>

      <div className="space-y-3">
        {pauses.map((pause) => {
          const duration = pause.resumed_at
            ? differenceInMinutes(new Date(pause.resumed_at), new Date(pause.paused_at))
            : differenceInMinutes(new Date(), new Date(pause.paused_at))
          const isActive = !pause.resumed_at

          return (
            <div
              key={pause.id}
              className={clsx(
                'border rounded-lg p-3 transition-colors',
                isActive
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-coffee-100 bg-white'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      isActive ? 'bg-amber-200' : 'bg-coffee-100'
                    )}
                  >
                    {isActive ? (
                      <Pause className="h-4 w-4 text-amber-700" />
                    ) : (
                      <Play className="h-4 w-4 text-coffee-600" />
                    )}
                  </div>
                  <div>
                    <span
                      className={clsx(
                        'text-sm font-medium',
                        isActive ? 'text-amber-700' : 'text-coffee-700'
                      )}
                    >
                      {getPauseReasonLabel(pause.reason_category as PauseReasonCategory)}
                    </span>
                    {isActive && (
                      <span className="ml-2 text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
                        กำลังหยุดพัก
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-mono text-coffee-500">
                  {formatDuration(duration)}
                </span>
              </div>

              {/* Details */}
              <div className="text-xs text-coffee-500 space-y-1 ml-10">
                <div className="flex items-center gap-2">
                  <Pause className="h-3 w-3" />
                  <span>
                    หยุดพัก: {format(new Date(pause.paused_at), 'd MMM yyyy HH:mm', { locale: th })}
                  </span>
                  {pause.paused_by_profile && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {pause.paused_by_profile.name}
                    </span>
                  )}
                </div>

                {pause.resumed_at && (
                  <div className="flex items-center gap-2">
                    <Play className="h-3 w-3" />
                    <span>
                      ดำเนินการต่อ: {format(new Date(pause.resumed_at), 'd MMM yyyy HH:mm', { locale: th })}
                    </span>
                    {pause.resumed_by_profile && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {pause.resumed_by_profile.name}
                      </span>
                    )}
                  </div>
                )}

                {pause.reason && pause.reason !== getPauseReasonLabel(pause.reason_category as PauseReasonCategory) && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-3 w-3 mt-0.5" />
                    <span>{pause.reason}</span>
                  </div>
                )}

                {pause.notes && (
                  <div className="flex items-start gap-2 text-coffee-400">
                    <MessageSquare className="h-3 w-3 mt-0.5" />
                    <span className="whitespace-pre-wrap">{pause.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} นาที`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours} ชม.`
  }

  return `${hours} ชม. ${mins} น.`
}
