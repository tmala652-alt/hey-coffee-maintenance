import { clsx } from 'clsx'
import { Clock, UserCheck, Loader2, CheckCircle, XCircle, ArrowDown, Minus, ArrowUp, AlertTriangle } from 'lucide-react'
import { StatusEnum, PriorityEnum } from '@/types/database.types'

const statusConfig: Record<StatusEnum, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'รอดำเนินการ', className: 'badge-pending', icon: Clock },
  assigned: { label: 'มอบหมายแล้ว', className: 'badge-assigned', icon: UserCheck },
  in_progress: { label: 'กำลังดำเนินการ', className: 'badge-in-progress', icon: Loader2 },
  completed: { label: 'เสร็จสิ้น', className: 'badge-completed', icon: CheckCircle },
  cancelled: { label: 'ยกเลิก', className: 'badge-cancelled', icon: XCircle },
}

const priorityConfig: Record<PriorityEnum, { label: string; className: string; icon: React.ElementType }> = {
  low: { label: 'ต่ำ', className: 'badge-low', icon: ArrowDown },
  medium: { label: 'ปานกลาง', className: 'badge-medium', icon: Minus },
  high: { label: 'สูง', className: 'badge-high', icon: ArrowUp },
  critical: { label: 'เร่งด่วน', className: 'badge-critical', icon: AlertTriangle },
}

interface StatusBadgeProps {
  status: StatusEnum
  showIcon?: boolean
}

interface PriorityBadgeProps {
  priority: PriorityEnum
  showIcon?: boolean
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  return (
    <span className={clsx(config.className, 'flex items-center gap-1.5')}>
      {showIcon && <Icon className={clsx('h-3.5 w-3.5', status === 'in_progress' && 'animate-spin')} />}
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority, showIcon = true }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  const Icon = config.icon
  return (
    <span className={clsx(config.className, 'flex items-center gap-1.5')}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  )
}
