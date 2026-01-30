'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Link2, Plus, ExternalLink, Loader2, X, Check } from 'lucide-react'
import {
  detectIncident,
  createIncident,
  linkRequestToIncident,
  getIncidentSeverityLabel,
  type DetectionResult,
} from '@/lib/incident-detection'
import type { MaintenanceRequest } from '@/types/database.types'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { clsx } from 'clsx'
import { useRouter } from 'next/navigation'

interface IncidentAlertProps {
  request: MaintenanceRequest
  className?: string
}

export default function IncidentAlert({ request, className }: IncidentAlertProps) {
  const router = useRouter()
  const [detection, setDetection] = useState<DetectionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRelated, setShowRelated] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    const runDetection = async () => {
      setLoading(true)
      try {
        const result = await detectIncident(request)
        setDetection(result)
      } catch (error) {
        console.error('Detection error:', error)
      }
      setLoading(false)
    }

    runDetection()
  }, [request.id])

  const handleLinkToIncident = async () => {
    if (!detection?.suggestedIncident) return

    setLinking(true)
    const result = await linkRequestToIncident(request.id, detection.suggestedIncident.id)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setLinking(false)
  }

  if (loading) {
    return (
      <div className={clsx('animate-pulse', className)}>
        <div className="h-16 bg-coffee-100 rounded-lg"></div>
      </div>
    )
  }

  if (!detection?.isRepeat) {
    return null
  }

  return (
    <>
      <div
        className={clsx(
          'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-orange-800">ตรวจพบปัญหาซ้ำ!</h4>
            <p className="text-sm text-orange-600 mt-1">
              พบปัญหาคล้ายกัน {detection.relatedRequests.length} งาน ในช่วง 30 วันที่ผ่านมา
              (ความมั่นใจ {Math.round(detection.confidence * 100)}%)
            </p>

            {/* Pattern indicators */}
            <div className="flex flex-wrap gap-2 mt-2">
              {detection.pattern.branch && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  สาขาเดียวกัน
                </span>
              )}
              {detection.pattern.category && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  หมวดหมู่เดียวกัน
                </span>
              )}
              {detection.pattern.equipment && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  อุปกรณ์เดียวกัน
                </span>
              )}
              {detection.pattern.timeframe && (
                <span className="text-xs bg-cherry-100 text-cherry-700 px-2 py-1 rounded-full">
                  เกิดซ้ำบ่อย
                </span>
              )}
            </div>

            {/* Existing incident info */}
            {detection.suggestedIncident && (
              <div className="mt-3 p-2 bg-white/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-600">Incident ที่เกี่ยวข้อง:</span>
                  <span
                    className={clsx(
                      'text-xs px-2 py-0.5 rounded-full',
                      detection.suggestedIncident.severity === 'critical' &&
                        'bg-cherry-100 text-cherry-700',
                      detection.suggestedIncident.severity === 'high' &&
                        'bg-orange-100 text-orange-700',
                      detection.suggestedIncident.severity === 'medium' &&
                        'bg-honey-100 text-honey-700',
                      detection.suggestedIncident.severity === 'low' &&
                        'bg-matcha-100 text-matcha-700'
                    )}
                  >
                    {getIncidentSeverityLabel(
                      detection.suggestedIncident.severity as any
                    )}
                  </span>
                </div>
                <p className="text-sm font-medium text-orange-800 mt-1">
                  {detection.suggestedIncident.title}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setShowRelated(!showRelated)}
                className="flex items-center gap-1 text-sm text-orange-700 hover:text-orange-800 transition-colors"
              >
                <Link2 className="h-4 w-4" />
                {showRelated ? 'ซ่อน' : 'ดูงานที่เกี่ยวข้อง'}
              </button>

              {detection.suggestedIncident ? (
                <button
                  onClick={handleLinkToIncident}
                  disabled={linking}
                  className="flex items-center gap-1 text-sm bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {linking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  เชื่อมโยง Incident
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1 text-sm bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  สร้าง Incident
                </button>
              )}
            </div>

            {/* Related requests list */}
            {showRelated && (
              <div className="mt-3 space-y-2">
                {detection.relatedRequests.map((rel) => (
                  <a
                    key={rel.id}
                    href={`/requests/${rel.id}`}
                    className="flex items-center justify-between p-2 bg-white/50 rounded-lg hover:bg-white transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-coffee-800 truncate">
                        {rel.title}
                      </p>
                      <p className="text-xs text-coffee-500">
                        {format(new Date(rel.created_at), 'd MMM yyyy', { locale: th })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-coffee-400">
                        {Math.round(rel.score * 100)}%
                      </span>
                      <ExternalLink className="h-4 w-4 text-coffee-400" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <CreateIncidentModal
          request={request}
          relatedRequests={detection.relatedRequests}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

// Create Incident Modal Component
function CreateIncidentModal({
  request,
  relatedRequests,
  onClose,
  onCreated,
}: {
  request: MaintenanceRequest
  relatedRequests: { id: string; title: string }[]
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState(
    `ปัญหาซ้ำ: ${request.category} - สาขา ${request.branch_id}`
  )
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [selectedRequests, setSelectedRequests] = useState<string[]>([
    request.id,
    ...relatedRequests.slice(0, 3).map((r) => r.id),
  ])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!title) {
      setError('กรุณาระบุหัวข้อ')
      return
    }

    setCreating(true)
    setError('')

    const result = await createIncident(title, description, selectedRequests, severity)

    if (result.incident) {
      onCreated()
    } else {
      setError(result.error || 'เกิดข้อผิดพลาด')
    }
    setCreating(false)
  }

  const toggleRequest = (id: string) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-coffee-900">สร้าง Incident</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-coffee-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-coffee-700 mb-2 block">
              หัวข้อ Incident *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-coffee-700 mb-2 block">
              รายละเอียด
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายปัญหาที่เกิดขึ้นซ้ำ..."
              rows={3}
              className="w-full px-4 py-2.5 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="text-sm font-medium text-coffee-700 mb-2 block">
              ความรุนแรง
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={clsx(
                    'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                    severity === s
                      ? s === 'low'
                        ? 'border-matcha-500 bg-matcha-50 text-matcha-700'
                        : s === 'medium'
                        ? 'border-honey-500 bg-honey-50 text-honey-700'
                        : s === 'high'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-cherry-500 bg-cherry-50 text-cherry-700'
                      : 'border-coffee-200 text-coffee-600 hover:border-coffee-300'
                  )}
                >
                  {getIncidentSeverityLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Related Requests */}
          <div>
            <label className="text-sm font-medium text-coffee-700 mb-2 block">
              งานที่เกี่ยวข้อง
            </label>
            <div className="space-y-2">
              {/* Current request */}
              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                <Check className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-700 truncate">{request.title}</span>
                <span className="text-xs text-orange-500">(งานนี้)</span>
              </div>

              {/* Related requests */}
              {relatedRequests.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => toggleRequest(rel.id)}
                  className={clsx(
                    'flex items-center gap-2 w-full p-2 rounded-lg border transition-colors text-left',
                    selectedRequests.includes(rel.id)
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-coffee-200 hover:border-coffee-300'
                  )}
                >
                  <div
                    className={clsx(
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      selectedRequests.includes(rel.id)
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-coffee-300'
                    )}
                  >
                    {selectedRequests.includes(rel.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-coffee-700 truncate">{rel.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-cherry-50 border border-cherry-200 rounded-lg p-3">
              <p className="text-sm text-cherry-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-coffee-100 bg-cream-50">
          <button
            onClick={onClose}
            disabled={creating}
            className="flex-1 px-4 py-2.5 border border-coffee-200 rounded-lg text-coffee-600 font-medium hover:bg-coffee-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleCreate}
            disabled={!title || creating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            สร้าง Incident
          </button>
        </div>
      </div>
    </div>
  )
}
