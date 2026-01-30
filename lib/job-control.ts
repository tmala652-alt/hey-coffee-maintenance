import { createClient } from '@/lib/supabase/client'
import { addMinutes, differenceInMinutes } from 'date-fns'
import type { JobPause, PauseReasonCategory } from '@/types/database.types'

export interface PauseJobParams {
  requestId: string
  userId: string
  reason: string
  reasonCategory: PauseReasonCategory
  notes?: string
}

export interface ResumeJobParams {
  requestId: string
  userId: string
  notes?: string
}

export interface PauseResult {
  pause: JobPause
  success: boolean
  error?: string
}

export interface ResumeResult {
  pausedDuration: number // minutes
  success: boolean
  error?: string
}

/**
 * Pause a job - stops SLA countdown
 */
export async function pauseJob(params: PauseJobParams): Promise<PauseResult> {
  const { requestId, userId, reason, reasonCategory, notes } = params
  const supabase = createClient()

  try {
    // 1. Check current state
    type RequestState = { status: string; is_paused: boolean | null; sla_mode: string | null; created_at: string | null; due_at: string | null; pause_count: number | null }
    const { data: request, error: fetchError } = await supabase
      .from('maintenance_requests')
      .select('status, is_paused, sla_mode, created_at, due_at, pause_count')
      .eq('id', requestId)
      .single() as { data: RequestState | null; error: unknown }

    if (fetchError || !request) {
      return { pause: {} as JobPause, success: false, error: 'ไม่พบงานที่ต้องการ' }
    }

    if (request.is_paused) {
      return { pause: {} as JobPause, success: false, error: 'งานนี้หยุดพักอยู่แล้ว' }
    }

    if (request.status === 'completed' || request.status === 'cancelled') {
      return { pause: {} as JobPause, success: false, error: 'ไม่สามารถหยุดพักงานที่เสร็จสิ้นแล้ว' }
    }

    // 2. Create pause record
    const { data: pause, error: insertError } = await supabase
      .from('job_pauses')
      .insert({
        request_id: requestId,
        paused_by: userId,
        reason,
        reason_category: reasonCategory,
        notes,
      } as never)
      .select()
      .single() as { data: JobPause | null; error: unknown }

    if (insertError || !pause) {
      return { pause: {} as JobPause, success: false, error: 'ไม่สามารถบันทึกการหยุดพักได้' }
    }

    // 3. Update request
    const { error: updateError } = await supabase
      .from('maintenance_requests')
      .update({
        is_paused: true,
        sla_paused_at: new Date().toISOString(),
        pause_count: (request.pause_count || 0) + 1,
      } as never)
      .eq('id', requestId)

    if (updateError) {
      // Rollback pause record
      await supabase.from('job_pauses').delete().eq('id', pause.id)
      return { pause: {} as JobPause, success: false, error: 'ไม่สามารถอัพเดทสถานะงานได้' }
    }

    // 4. Create notification for relevant parties
    await createPauseNotification(requestId, reason, reasonCategory)

    return { pause: pause as JobPause, success: true }
  } catch (error) {
    console.error('Pause job error:', error)
    return { pause: {} as JobPause, success: false, error: 'เกิดข้อผิดพลาด' }
  }
}

/**
 * Resume a paused job - continues SLA countdown
 */
export async function resumeJob(params: ResumeJobParams): Promise<ResumeResult> {
  const { requestId, userId, notes } = params
  const supabase = createClient()

  try {
    // 1. Get active pause
    const { data: activePause, error: pauseError } = await supabase
      .from('job_pauses')
      .select('*')
      .eq('request_id', requestId)
      .is('resumed_at', null)
      .single() as { data: JobPause | null; error: unknown }

    if (pauseError || !activePause) {
      return { pausedDuration: 0, success: false, error: 'ไม่พบการหยุดพักที่ยังไม่ได้ดำเนินการต่อ' }
    }

    // 2. Calculate paused duration
    const pausedDuration = differenceInMinutes(new Date(), new Date(activePause.paused_at))

    // 3. Update pause record
    const { error: updatePauseError } = await supabase
      .from('job_pauses')
      .update({
        resumed_at: new Date().toISOString(),
        resumed_by: userId,
        notes: notes ? `${activePause.notes || ''}\n[Resume] ${notes}` : activePause.notes,
      } as never)
      .eq('id', activePause.id)

    if (updatePauseError) {
      return { pausedDuration: 0, success: false, error: 'ไม่สามารถอัพเดทการหยุดพักได้' }
    }

    // 4. Get request to calculate new due_at
    type RequestDue = { sla_paused_duration: unknown; sla_mode: string | null; due_at: string | null }
    const { data: request, error: requestError } = await supabase
      .from('maintenance_requests')
      .select('sla_paused_duration, sla_mode, due_at')
      .eq('id', requestId)
      .single() as { data: RequestDue | null; error: unknown }

    if (requestError || !request) {
      return { pausedDuration: 0, success: false, error: 'ไม่พบข้อมูลงาน' }
    }

    // 5. Calculate new due_at (extend by paused duration)
    let newDueAt = request.due_at
    if (request.due_at) {
      newDueAt = addMinutes(new Date(request.due_at), pausedDuration).toISOString()
    }

    // 6. Calculate total paused duration
    const currentPausedMinutes = parseIntervalToMinutes(request.sla_paused_duration)
    const totalPausedMinutes = currentPausedMinutes + pausedDuration

    // 7. Update request
    const { error: updateRequestError } = await supabase
      .from('maintenance_requests')
      .update({
        is_paused: false,
        sla_paused_at: null,
        sla_paused_duration: `${totalPausedMinutes} minutes`,
        due_at: newDueAt,
      } as never)
      .eq('id', requestId)

    if (updateRequestError) {
      return { pausedDuration: 0, success: false, error: 'ไม่สามารถอัพเดทสถานะงานได้' }
    }

    // 8. Create notification
    await createResumeNotification(requestId)

    return { pausedDuration, success: true }
  } catch (error) {
    console.error('Resume job error:', error)
    return { pausedDuration: 0, success: false, error: 'เกิดข้อผิดพลาด' }
  }
}

/**
 * Get pause history for a request
 */
export async function getPauseHistory(requestId: string): Promise<JobPause[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('job_pauses')
    .select(`
      *,
      paused_by_profile:profiles!job_pauses_paused_by_fkey(name),
      resumed_by_profile:profiles!job_pauses_resumed_by_fkey(name)
    `)
    .eq('request_id', requestId)
    .order('paused_at', { ascending: false }) as { data: JobPause[] | null; error: unknown }

  if (error) {
    console.error('Get pause history error:', error)
    return []
  }

  return data || []
}

/**
 * Parse interval string to minutes
 */
function parseIntervalToMinutes(interval: unknown): number {
  if (!interval) return 0
  const str = String(interval)

  // Handle "X minutes" format
  const minutesMatch = str.match(/(\d+)\s*minutes?/i)
  if (minutesMatch) {
    return parseInt(minutesMatch[1], 10)
  }

  // Handle "HH:MM:SS" format
  const timeMatch = str.match(/(\d+):(\d+):(\d+)/)
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10)
    const minutes = parseInt(timeMatch[2], 10)
    return hours * 60 + minutes
  }

  return 0
}

/**
 * Create notification for pause event
 */
async function createPauseNotification(
  requestId: string,
  reason: string,
  reasonCategory: PauseReasonCategory
): Promise<void> {
  const supabase = createClient()

  // Get request info
  type RequestInfo = { title: string; created_by: string | null; assigned_user_id: string | null }
  const { data: request } = await supabase
    .from('maintenance_requests')
    .select('title, created_by, assigned_user_id')
    .eq('id', requestId)
    .single() as { data: RequestInfo | null }

  if (!request) return

  const reasonLabels: Record<PauseReasonCategory, string> = {
    waiting_parts: 'รออะไหล่',
    waiting_approval: 'รออนุมัติ',
    waiting_vendor: 'รอ Vendor',
    customer_unavailable: 'ลูกค้าไม่สะดวก',
    weather: 'สภาพอากาศ',
    other: 'อื่นๆ',
  }

  // Notify request creator
  if (request.created_by) {
    await supabase.from('notifications').insert({
      user_id: request.created_by,
      title: 'งานถูกหยุดพักชั่วคราว',
      message: `งาน "${request.title}" ถูกหยุดพัก: ${reasonLabels[reasonCategory]}`,
      type: 'job_paused',
      request_id: requestId,
    } as never)
  }

  // Notify assigned technician if different
  if (request.assigned_user_id && request.assigned_user_id !== request.created_by) {
    await supabase.from('notifications').insert({
      user_id: request.assigned_user_id,
      title: 'งานถูกหยุดพักชั่วคราว',
      message: `งาน "${request.title}" ถูกหยุดพัก: ${reasonLabels[reasonCategory]}`,
      type: 'job_paused',
      request_id: requestId,
    } as never)
  }
}

/**
 * Create notification for resume event
 */
async function createResumeNotification(requestId: string): Promise<void> {
  const supabase = createClient()

  // Get request info
  type RequestInfo = { title: string; created_by: string | null; assigned_user_id: string | null }
  const { data: request } = await supabase
    .from('maintenance_requests')
    .select('title, created_by, assigned_user_id')
    .eq('id', requestId)
    .single() as { data: RequestInfo | null }

  if (!request) return

  // Notify request creator
  if (request.created_by) {
    await supabase.from('notifications').insert({
      user_id: request.created_by,
      title: 'งานดำเนินการต่อ',
      message: `งาน "${request.title}" กลับมาดำเนินการต่อแล้ว`,
      type: 'job_resumed',
      request_id: requestId,
    } as never)
  }

  // Notify assigned technician if different
  if (request.assigned_user_id && request.assigned_user_id !== request.created_by) {
    await supabase.from('notifications').insert({
      user_id: request.assigned_user_id,
      title: 'งานดำเนินการต่อ',
      message: `งาน "${request.title}" กลับมาดำเนินการต่อแล้ว`,
      type: 'job_resumed',
      request_id: requestId,
    } as never)
  }
}

/**
 * Get pause reason label in Thai
 */
export function getPauseReasonLabel(category: PauseReasonCategory): string {
  const labels: Record<PauseReasonCategory, string> = {
    waiting_parts: 'รออะไหล่',
    waiting_approval: 'รออนุมัติ',
    waiting_vendor: 'รอ Vendor',
    customer_unavailable: 'ลูกค้าไม่สะดวก',
    weather: 'สภาพอากาศ',
    other: 'อื่นๆ',
  }
  return labels[category] || category
}
