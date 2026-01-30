'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, XCircle, Minus } from 'lucide-react'
import { calculateSLAStatus, getSLAStatusColor, getSLAStatusLabel } from '@/lib/sla'
import type { SLAStatus } from '@/types/database.types'
import clsx from 'clsx'

interface SLABadgeProps {
  createdAt: string | null
  dueAt: string | null
  status: string
  className?: string
}

export default function SLABadge({
  createdAt,
  dueAt,
  status,
  className,
}: SLABadgeProps) {
  const [slaStatus, setSlaStatus] = useState<SLAStatus>(() =>
    calculateSLAStatus(createdAt, dueAt, status)
  )

  useEffect(() => {
    setSlaStatus(calculateSLAStatus(createdAt, dueAt, status))

    // Update periodically for active requests
    if (status !== 'completed' && status !== 'cancelled' && dueAt) {
      const interval = setInterval(() => {
        setSlaStatus(calculateSLAStatus(createdAt, dueAt, status))
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [createdAt, dueAt, status])

  const colors = getSLAStatusColor(slaStatus)
  const label = getSLAStatusLabel(slaStatus)

  const getIcon = () => {
    switch (slaStatus) {
      case 'on_track':
        return <CheckCircle className="h-3.5 w-3.5" />
      case 'warning':
        return <Clock className="h-3.5 w-3.5" />
      case 'critical':
        return <AlertTriangle className="h-3.5 w-3.5" />
      case 'breached':
        return <XCircle className="h-3.5 w-3.5" />
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5" />
      default:
        return <Minus className="h-3.5 w-3.5" />
    }
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        colors.bg,
        colors.text,
        colors.border,
        slaStatus === 'critical' && 'animate-pulse',
        slaStatus === 'breached' && 'animate-pulse',
        className
      )}
    >
      {getIcon()}
      {label}
    </span>
  )
}

// Progress bar showing SLA completion percentage
interface SLAProgressBarProps {
  createdAt: string | null
  dueAt: string | null
  status: string
  showPercentage?: boolean
  className?: string
}

export function SLAProgressBar({
  createdAt,
  dueAt,
  status,
  showPercentage = false,
  className,
}: SLAProgressBarProps) {
  const [slaStatus, setSlaStatus] = useState<SLAStatus>(() =>
    calculateSLAStatus(createdAt, dueAt, status)
  )
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const calculate = () => {
      if (!createdAt || !dueAt) {
        setPercent(0)
        return
      }

      const now = Date.now()
      const created = new Date(createdAt).getTime()
      const due = new Date(dueAt).getTime()
      const total = due - created
      const elapsed = now - created
      const p = Math.min(100, Math.max(0, (elapsed / total) * 100))
      setPercent(p)
      setSlaStatus(calculateSLAStatus(createdAt, dueAt, status))
    }

    calculate()

    if (status !== 'completed' && status !== 'cancelled' && dueAt) {
      const interval = setInterval(calculate, 60000)
      return () => clearInterval(interval)
    }
  }, [createdAt, dueAt, status])

  if (status === 'completed' || status === 'cancelled' || !dueAt) {
    return null
  }

  const getBarColor = () => {
    switch (slaStatus) {
      case 'on_track':
        return 'bg-matcha-500'
      case 'warning':
        return 'bg-honey-500'
      case 'critical':
        return 'bg-orange-500'
      case 'breached':
        return 'bg-cherry-500'
      default:
        return 'bg-coffee-300'
    }
  }

  return (
    <div className={clsx('w-full', className)}>
      <div className="h-2 bg-coffee-100 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            getBarColor(),
            slaStatus === 'critical' && 'animate-pulse',
            slaStatus === 'breached' && 'animate-pulse'
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      {showPercentage && (
        <p className="text-xs text-coffee-500 mt-1 text-right">
          {percent.toFixed(0)}% ของเวลาที่กำหนด
        </p>
      )}
    </div>
  )
}
