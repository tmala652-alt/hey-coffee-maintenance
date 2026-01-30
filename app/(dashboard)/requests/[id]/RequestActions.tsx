'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, Play, CheckCircle, XCircle, Banknote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MaintenanceRequest, Profile, Vendor, StatusEnum } from '@/types/database.types'
import { notifyAssignment, notifyStatusChange } from '@/lib/notifications'

interface RequestActionsProps {
  request: MaintenanceRequest
  technicians: Profile[]
  vendors: Vendor[]
  isAdmin: boolean
}

export default function RequestActions({
  request,
  technicians,
  vendors,
  isAdmin,
}: RequestActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showCost, setShowCost] = useState(false)
  const [assignType, setAssignType] = useState<'technician' | 'vendor'>('technician')
  const [selectedId, setSelectedId] = useState('')
  const [costAmount, setCostAmount] = useState('')
  const [costDescription, setCostDescription] = useState('')

  const updateStatus = async (status: StatusEnum) => {
    setLoading(true)
    const supabase = createClient()

    await supabase
      .from('maintenance_requests')
      .update({ status })
      .eq('id', request.id)

    // Notify request creator about status change
    if (request.created_by) {
      await notifyStatusChange(supabase, request.created_by, request.title, request.id, status)
    }

    router.refresh()
    setLoading(false)
  }

  const handleAssign = async () => {
    if (!selectedId) return
    setLoading(true)
    const supabase = createClient()

    const update =
      assignType === 'technician'
        ? { assigned_user_id: selectedId, status: 'assigned' as StatusEnum }
        : { assigned_vendor_id: selectedId, status: 'assigned' as StatusEnum }

    await supabase
      .from('maintenance_requests')
      .update(update)
      .eq('id', request.id)

    // Send notification to assignee
    if (assignType === 'technician') {
      await notifyAssignment(supabase, selectedId, request.title, request.id)
    }

    // Notify request creator about status change
    if (request.created_by) {
      await notifyStatusChange(supabase, request.created_by, request.title, request.id, 'assigned')
    }

    setShowAssign(false)
    setSelectedId('')
    router.refresh()
    setLoading(false)
  }

  const handleAddCost = async () => {
    if (!costAmount) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await (supabase.from('cost_logs') as ReturnType<typeof supabase.from>).insert({
      request_id: request.id,
      amount: parseFloat(costAmount),
      description: costDescription,
      added_by: user!.id,
    })

    setCostAmount('')
    setCostDescription('')
    setShowCost(false)
    router.refresh()
    setLoading(false)
  }

  const canAssign = isAdmin && (request.status === 'pending' || request.status === 'assigned')
  const canStart = request.status === 'assigned'
  const canComplete = request.status === 'in_progress'
  const canCancel = request.status !== 'completed' && request.status !== 'cancelled'

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold text-coffee-900">การดำเนินการ</h2>

      <div className="space-y-2">
        {/* Assign */}
        {canAssign && (
          <>
            <button
              onClick={() => setShowAssign(!showAssign)}
              className="btn-secondary w-full"
            >
              <UserPlus className="h-5 w-5" />
              มอบหมายงาน
            </button>

            {showAssign && (
              <div className="p-4 bg-cream-50 rounded-lg space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setAssignType('technician')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      assignType === 'technician'
                        ? 'bg-coffee-700 text-white'
                        : 'bg-white text-coffee-700 border border-coffee-200'
                    }`}
                  >
                    ช่างภายใน
                  </button>
                  <button
                    onClick={() => setAssignType('vendor')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      assignType === 'vendor'
                        ? 'bg-coffee-700 text-white'
                        : 'bg-white text-coffee-700 border border-coffee-200'
                    }`}
                  >
                    ผู้รับเหมา
                  </button>
                </div>

                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="input"
                >
                  <option value="">
                    เลือก{assignType === 'technician' ? 'ช่าง' : 'ผู้รับเหมา'}
                  </option>
                  {assignType === 'technician'
                    ? technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))
                    : vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.company_name}
                        </option>
                      ))}
                </select>

                <button
                  onClick={handleAssign}
                  disabled={!selectedId || loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'ยืนยัน'
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Start */}
        {canStart && (
          <button
            onClick={() => updateStatus('in_progress')}
            disabled={loading}
            className="btn-accent w-full"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Play className="h-5 w-5" />
                เริ่มดำเนินการ
              </>
            )}
          </button>
        )}

        {/* Add Cost */}
        {(request.status === 'in_progress' || request.status === 'completed') && (
          <>
            <button
              onClick={() => setShowCost(!showCost)}
              className="btn-secondary w-full"
            >
              <Banknote className="h-5 w-5" />
              บันทึกค่าใช้จ่าย
            </button>

            {showCost && (
              <div className="p-4 bg-cream-50 rounded-lg space-y-3">
                <input
                  type="number"
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  placeholder="จำนวนเงิน (บาท)"
                  className="input"
                />
                <input
                  type="text"
                  value={costDescription}
                  onChange={(e) => setCostDescription(e.target.value)}
                  placeholder="รายละเอียด (เช่น ค่าอะไหล่)"
                  className="input"
                />
                <button
                  onClick={handleAddCost}
                  disabled={!costAmount || loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'บันทึก'
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Complete */}
        {canComplete && (
          <button
            onClick={() => updateStatus('completed')}
            disabled={loading}
            className="btn-primary w-full bg-matcha-500 hover:bg-matcha-600"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                งานเสร็จสิ้น
              </>
            )}
          </button>
        )}

        {/* Cancel */}
        {canCancel && isAdmin && (
          <button
            onClick={() => updateStatus('cancelled')}
            disabled={loading}
            className="btn-ghost w-full text-cherry-600 hover:bg-cherry-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                ยกเลิกงาน
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
