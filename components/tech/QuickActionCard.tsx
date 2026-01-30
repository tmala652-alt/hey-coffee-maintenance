'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Play,
  CheckCircle,
  MessageSquare,
  Camera,
  MapPin,
  Clock,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SLACountdownCompact } from '@/components/sla/SLACountdown'
import { PriorityBadge } from '@/components/ui/StatusBadge'
import type { MaintenanceRequest, StatusEnum } from '@/types/database.types'
import clsx from 'clsx'

interface QuickActionCardProps {
  request: MaintenanceRequest & {
    branch?: { name: string; code: string } | null
  }
  onStatusChange?: () => void
}

export default function QuickActionCard({
  request,
  onStatusChange,
}: QuickActionCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [actionType, setActionType] = useState<string | null>(null)

  const updateStatus = async (newStatus: StatusEnum) => {
    setLoading(true)
    setActionType(newStatus)

    try {
      const supabase = createClient()
      await supabase
        .from('maintenance_requests')
        .update({ status: newStatus } as never)
        .eq('id', request.id)

      onStatusChange?.()
      router.refresh()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setLoading(false)
      setActionType(null)
    }
  }

  const getStatusColor = () => {
    switch (request.status) {
      case 'assigned':
        return 'border-l-honey-500 bg-honey-50/50'
      case 'in_progress':
        return 'border-l-blue-500 bg-blue-50/50'
      default:
        return 'border-l-coffee-300'
    }
  }

  const getStatusIndicator = () => {
    switch (request.status) {
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-honey-700 bg-honey-100 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3" />
            รอเริ่มงาน
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
            <Play className="h-3 w-3" />
            กำลังดำเนินการ
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-coffee-100 overflow-hidden border-l-4 transition-all hover:shadow-md',
        getStatusColor()
      )}
    >
      {/* Card Header */}
      <Link href={`/requests/${request.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={request.priority} />
            {getStatusIndicator()}
          </div>
          <SLACountdownCompact
            createdAt={request.created_at}
            dueAt={request.due_at}
            status={request.status}
          />
        </div>
        <h3 className="font-semibold text-coffee-900 line-clamp-1 mb-1">
          {request.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-coffee-500">
          <MapPin className="h-3.5 w-3.5" />
          <span>
            {request.branch?.code} - {request.branch?.name}
          </span>
        </div>
        {request.category && (
          <p className="text-xs text-coffee-400 mt-1">{request.category}</p>
        )}
      </Link>

      {/* Quick Actions */}
      <div className="flex border-t border-coffee-100 divide-x divide-coffee-100">
        {request.status === 'assigned' && (
          <button
            onClick={() => updateStatus('in_progress')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-matcha-700 hover:bg-matcha-50 transition-colors disabled:opacity-50"
          >
            {loading && actionType === 'in_progress' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            เริ่มงาน
          </button>
        )}

        {request.status === 'in_progress' && (
          <button
            onClick={() => updateStatus('completed')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-matcha-700 hover:bg-matcha-50 transition-colors disabled:opacity-50"
          >
            {loading && actionType === 'completed' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            เสร็จสิ้น
          </button>
        )}

        <Link
          href={`/requests/${request.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-coffee-600 hover:bg-coffee-50 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          แชท
        </Link>

        <Link
          href={`/requests/${request.id}#images`}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-coffee-600 hover:bg-coffee-50 transition-colors"
        >
          <Camera className="h-4 w-4" />
          รูป
        </Link>
      </div>
    </div>
  )
}
