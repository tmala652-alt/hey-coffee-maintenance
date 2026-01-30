import { SupabaseClient } from '@supabase/supabase-js'

type NotificationType = 'assignment' | 'sla_warning' | 'status_change' | 'chat' | 'scheduled'

export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  type: NotificationType,
  title: string,
  message?: string,
  requestId?: string
) {
  return supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    request_id: requestId,
  })
}

export async function notifyAssignment(
  supabase: SupabaseClient,
  assigneeId: string,
  requestTitle: string,
  requestId: string
) {
  return createNotification(
    supabase,
    assigneeId,
    'assignment',
    'คุณได้รับมอบหมายงานใหม่',
    requestTitle,
    requestId
  )
}

export async function notifySLAWarning(
  supabase: SupabaseClient,
  userId: string,
  requestTitle: string,
  requestId: string,
  hoursRemaining: number
) {
  return createNotification(
    supabase,
    userId,
    'sla_warning',
    `SLA ใกล้ครบกำหนด! เหลือ ${hoursRemaining} ชั่วโมง`,
    requestTitle,
    requestId
  )
}

export async function notifyStatusChange(
  supabase: SupabaseClient,
  userId: string,
  requestTitle: string,
  requestId: string,
  newStatus: string
) {
  const statusNames: Record<string, string> = {
    pending: 'รอดำเนินการ',
    assigned: 'มอบหมายแล้ว',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
  }

  return createNotification(
    supabase,
    userId,
    'status_change',
    `สถานะงานเปลี่ยนเป็น "${statusNames[newStatus] || newStatus}"`,
    requestTitle,
    requestId
  )
}

export async function notifyChat(
  supabase: SupabaseClient,
  userId: string,
  senderName: string,
  requestId: string
) {
  return createNotification(
    supabase,
    userId,
    'chat',
    `${senderName} ส่งข้อความใหม่`,
    'คลิกเพื่อดูข้อความ',
    requestId
  )
}

export async function notifyScheduledMaintenance(
  supabase: SupabaseClient,
  userId: string,
  scheduleName: string,
  requestId: string
) {
  return createNotification(
    supabase,
    userId,
    'scheduled',
    'งานบำรุงรักษาตามกำหนดถูกสร้าง',
    scheduleName,
    requestId
  )
}
