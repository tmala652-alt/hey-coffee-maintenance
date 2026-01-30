'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, Pause, Calendar, Briefcase } from 'lucide-react'
import { getSLAInfo, getSLAStatusColor, getSLAStatusLabel } from '@/lib/sla'
import {
  calculateWorkingHoursProgress,
  formatMinutesToReadable,
  getSLAStatusFromPercentage,
} from '@/lib/sla-working-hours'
import type { SLAStatus, SLAMode } from '@/types/database.types'
import clsx from 'clsx'

interface SLACountdownProps {
  createdAt: string | null
  dueAt: string | null
  status: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  slaMode?: SLAMode
  isPaused?: boolean
  pausedDuration?: number // minutes
  branchId?: string
}

export default function SLACountdown({
  createdAt,
  dueAt,
  status,
  showLabel = true,
  size = 'md',
  className,
  slaMode = 'calendar',
  isPaused = false,
  pausedDuration = 0,
  branchId,
}: SLACountdownProps) {
  const [slaInfo, setSlaInfo] = useState(() =>
    getSLAInfo(createdAt, dueAt, status)
  )
  const [workingHoursInfo, setWorkingHoursInfo] = useState<{
    percentage: number
    remainingMinutes: number
    slaStatus: SLAStatus
  } | null>(null)

  useEffect(() => {
    // For calendar mode, use existing logic
    if (slaMode === 'calendar') {
      setSlaInfo(getSLAInfo(createdAt, dueAt, status))
    }

    // For working_hours mode, calculate using working hours
    if (slaMode === 'working_hours' && branchId && createdAt && dueAt) {
      const updateWorkingHours = async () => {
        const progress = await calculateWorkingHoursProgress(
          new Date(createdAt),
          new Date(dueAt),
          branchId,
          pausedDuration
        )
        setWorkingHoursInfo({
          percentage: progress.percentage,
          remainingMinutes: progress.remainingMinutes,
          slaStatus: getSLAStatusFromPercentage(progress.percentage, status),
        })
      }
      updateWorkingHours()
    }

    // Update every minute for active requests
    if (status !== 'completed' && status !== 'cancelled' && dueAt && !isPaused) {
      const interval = setInterval(() => {
        if (slaMode === 'calendar') {
          setSlaInfo(getSLAInfo(createdAt, dueAt, status))
        } else if (slaMode === 'working_hours' && branchId && createdAt) {
          calculateWorkingHoursProgress(
            new Date(createdAt),
            new Date(dueAt),
            branchId,
            pausedDuration
          ).then((progress) => {
            setWorkingHoursInfo({
              percentage: progress.percentage,
              remainingMinutes: progress.remainingMinutes,
              slaStatus: getSLAStatusFromPercentage(progress.percentage, status),
            })
          })
        }
      }, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [createdAt, dueAt, status, slaMode, branchId, pausedDuration, isPaused])

  // Determine which info to use
  const effectiveStatus =
    slaMode === 'working_hours' && workingHoursInfo
      ? workingHoursInfo.slaStatus
      : slaInfo.status
  const effectiveTimeRemaining =
    slaMode === 'working_hours' && workingHoursInfo
      ? formatMinutesToReadable(workingHoursInfo.remainingMinutes)
      : slaInfo.formattedTimeRemaining
  const isOverdue =
    slaMode === 'working_hours' && workingHoursInfo
      ? workingHoursInfo.percentage >= 100
      : slaInfo.isOverdue

  // Don't show anything for completed/cancelled or no SLA
  if (effectiveStatus === 'completed' || effectiveStatus === 'no_sla') {
    return null
  }

  const colors = getSLAStatusColor(effectiveStatus)
  const label = getSLAStatusLabel(effectiveStatus)

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const IconComponent = isPaused ? Pause : isOverdue ? AlertTriangle : Clock
  const ModeIcon = slaMode === 'working_hours' ? Briefcase : Calendar

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {/* Paused indicator */}
      {isPaused && (
        <div className="inline-flex items-center gap-1.5 text-amber-600 text-xs">
          <Pause className="h-3 w-3" />
          <span className="font-medium">SLA หยุดนับชั่วคราว</span>
        </div>
      )}

      <div
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all',
          isPaused ? 'bg-amber-50 text-amber-700 border-amber-200' : colors.bg,
          !isPaused && colors.text,
          !isPaused && colors.border,
          'border',
          sizeClasses[size],
          !isPaused && effectiveStatus === 'critical' && 'animate-pulse',
          !isPaused && effectiveStatus === 'breached' && 'animate-pulse ring-2 ring-cherry-300'
        )}
      >
        <IconComponent className={clsx(iconSizes[size], isPaused ? 'text-amber-600' : colors.icon)} />
        <span className="font-mono">{effectiveTimeRemaining}</span>
        {showLabel && (
          <>
            <span className="hidden sm:inline text-xs opacity-75">({label})</span>
            <span title={slaMode === 'working_hours' ? 'เวลาทำการ' : 'เวลาปฏิทิน'}>
              <ModeIcon className={clsx('h-3 w-3 opacity-50 ml-1')} />
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// Compact version for lists
export function SLACountdownCompact({
  createdAt,
  dueAt,
  status,
  slaMode = 'calendar',
  isPaused = false,
  pausedDuration = 0,
  branchId,
}: {
  createdAt: string | null
  dueAt: string | null
  status: string
  slaMode?: SLAMode
  isPaused?: boolean
  pausedDuration?: number
  branchId?: string
}) {
  const [slaInfo, setSlaInfo] = useState(() =>
    getSLAInfo(createdAt, dueAt, status)
  )
  const [workingHoursInfo, setWorkingHoursInfo] = useState<{
    percentage: number
    remainingMinutes: number
    slaStatus: SLAStatus
  } | null>(null)

  useEffect(() => {
    if (slaMode === 'calendar') {
      setSlaInfo(getSLAInfo(createdAt, dueAt, status))
    }

    if (slaMode === 'working_hours' && branchId && createdAt && dueAt) {
      calculateWorkingHoursProgress(
        new Date(createdAt),
        new Date(dueAt),
        branchId,
        pausedDuration
      ).then((progress) => {
        setWorkingHoursInfo({
          percentage: progress.percentage,
          remainingMinutes: progress.remainingMinutes,
          slaStatus: getSLAStatusFromPercentage(progress.percentage, status),
        })
      })
    }

    if (status !== 'completed' && status !== 'cancelled' && dueAt && !isPaused) {
      const interval = setInterval(() => {
        if (slaMode === 'calendar') {
          setSlaInfo(getSLAInfo(createdAt, dueAt, status))
        } else if (slaMode === 'working_hours' && branchId && createdAt) {
          calculateWorkingHoursProgress(
            new Date(createdAt),
            new Date(dueAt),
            branchId,
            pausedDuration
          ).then((progress) => {
            setWorkingHoursInfo({
              percentage: progress.percentage,
              remainingMinutes: progress.remainingMinutes,
              slaStatus: getSLAStatusFromPercentage(progress.percentage, status),
            })
          })
        }
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [createdAt, dueAt, status, slaMode, branchId, pausedDuration, isPaused])

  const effectiveStatus =
    slaMode === 'working_hours' && workingHoursInfo
      ? workingHoursInfo.slaStatus
      : slaInfo.status
  const effectiveTimeRemaining =
    slaMode === 'working_hours' && workingHoursInfo
      ? formatMinutesToReadable(workingHoursInfo.remainingMinutes)
      : slaInfo.formattedTimeRemaining
  const isOverdue =
    slaMode === 'working_hours' && workingHoursInfo
      ? workingHoursInfo.percentage >= 100
      : slaInfo.isOverdue

  if (effectiveStatus === 'completed' || effectiveStatus === 'no_sla') {
    return null
  }

  const colors = getSLAStatusColor(effectiveStatus)

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-xs font-medium',
        isPaused ? 'text-amber-600' : colors.text,
        !isPaused && effectiveStatus === 'critical' && 'animate-pulse',
        !isPaused && effectiveStatus === 'breached' && 'animate-pulse'
      )}
    >
      {isPaused ? (
        <Pause className="h-3 w-3" />
      ) : isOverdue ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {effectiveTimeRemaining}
      {isPaused && <span className="text-[10px]">(หยุด)</span>}
    </span>
  )
}
