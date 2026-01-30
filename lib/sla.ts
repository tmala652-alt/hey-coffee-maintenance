import type { SLAStatus } from '@/types/database.types'

export interface SLAInfo {
  status: SLAStatus
  elapsedPercent: number
  timeRemaining: number // in milliseconds
  isOverdue: boolean
  formattedTimeRemaining: string
}

/**
 * Calculate SLA status based on created_at, due_at, and current status
 */
export function calculateSLAStatus(
  createdAt: string | null,
  dueAt: string | null,
  requestStatus: string
): SLAStatus {
  // Completed or cancelled requests don't have active SLA
  if (requestStatus === 'completed' || requestStatus === 'cancelled') {
    return 'completed'
  }

  // No SLA defined
  if (!dueAt || !createdAt) {
    return 'no_sla'
  }

  const now = new Date().getTime()
  const created = new Date(createdAt).getTime()
  const due = new Date(dueAt).getTime()

  const totalDuration = due - created
  const elapsed = now - created
  const elapsedPercent = (elapsed / totalDuration) * 100

  if (elapsedPercent >= 100) {
    return 'breached'
  } else if (elapsedPercent >= 90) {
    return 'critical'
  } else if (elapsedPercent >= 75) {
    return 'warning'
  }

  return 'on_track'
}

/**
 * Get comprehensive SLA information
 */
export function getSLAInfo(
  createdAt: string | null,
  dueAt: string | null,
  requestStatus: string
): SLAInfo {
  const status = calculateSLAStatus(createdAt, dueAt, requestStatus)

  // Default values for no SLA or completed
  if (!dueAt || !createdAt || status === 'completed' || status === 'no_sla') {
    return {
      status,
      elapsedPercent: 0,
      timeRemaining: 0,
      isOverdue: false,
      formattedTimeRemaining: '-',
    }
  }

  const now = new Date().getTime()
  const created = new Date(createdAt).getTime()
  const due = new Date(dueAt).getTime()

  const totalDuration = due - created
  const elapsed = now - created
  const elapsedPercent = Math.min(100, (elapsed / totalDuration) * 100)
  const timeRemaining = due - now
  const isOverdue = timeRemaining < 0

  return {
    status,
    elapsedPercent,
    timeRemaining,
    isOverdue,
    formattedTimeRemaining: formatTimeRemaining(timeRemaining),
  }
}

/**
 * Format time remaining into human-readable string (Thai)
 */
export function formatTimeRemaining(ms: number): string {
  const isOverdue = ms < 0
  const absMs = Math.abs(ms)

  const hours = Math.floor(absMs / (1000 * 60 * 60))
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (isOverdue) {
      return `เกิน ${days} วัน ${remainingHours} ชม.`
    }
    return `${days} วัน ${remainingHours} ชม.`
  }

  if (hours > 0) {
    if (isOverdue) {
      return `เกิน ${hours} ชม. ${minutes} นาที`
    }
    return `${hours} ชม. ${minutes} นาที`
  }

  if (isOverdue) {
    return `เกิน ${minutes} นาที`
  }
  return `${minutes} นาที`
}

/**
 * Get color scheme based on SLA status
 */
export function getSLAStatusColor(status: SLAStatus): {
  bg: string
  text: string
  border: string
  icon: string
} {
  switch (status) {
    case 'on_track':
      return {
        bg: 'bg-matcha-50',
        text: 'text-matcha-700',
        border: 'border-matcha-200',
        icon: 'text-matcha-500',
      }
    case 'warning':
      return {
        bg: 'bg-honey-50',
        text: 'text-honey-700',
        border: 'border-honey-200',
        icon: 'text-honey-500',
      }
    case 'critical':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        icon: 'text-orange-500',
      }
    case 'breached':
      return {
        bg: 'bg-cherry-50',
        text: 'text-cherry-700',
        border: 'border-cherry-200',
        icon: 'text-cherry-500',
      }
    case 'completed':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: 'text-blue-500',
      }
    default:
      return {
        bg: 'bg-coffee-50',
        text: 'text-coffee-700',
        border: 'border-coffee-200',
        icon: 'text-coffee-500',
      }
  }
}

/**
 * Get Thai label for SLA status
 */
export function getSLAStatusLabel(status: SLAStatus): string {
  switch (status) {
    case 'on_track':
      return 'ปกติ'
    case 'warning':
      return 'ใกล้ครบกำหนด'
    case 'critical':
      return 'เร่งด่วน'
    case 'breached':
      return 'เกิน SLA'
    case 'completed':
      return 'เสร็จสิ้น'
    case 'no_sla':
      return 'ไม่มี SLA'
    default:
      return '-'
  }
}

/**
 * Calculate elapsed percentage for progress bar
 */
export function calculateElapsedPercent(
  createdAt: string | null,
  dueAt: string | null
): number {
  if (!createdAt || !dueAt) return 0

  const now = new Date().getTime()
  const created = new Date(createdAt).getTime()
  const due = new Date(dueAt).getTime()

  const totalDuration = due - created
  if (totalDuration <= 0) return 100

  const elapsed = now - created
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
}
