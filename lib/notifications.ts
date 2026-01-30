// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = any

type NotificationType =
  | 'assignment'
  | 'sla_warning'
  | 'status_change'
  | 'chat'
  | 'scheduled'
  | 'approval_required'
  | 'approval_approved'
  | 'approval_rejected'
  | 'disbursement_ready'

export async function createNotification(
  supabase: SupabaseClientAny,
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
  } as never)
}

export async function notifyAssignment(
  supabase: SupabaseClientAny,
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
  supabase: SupabaseClientAny,
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
  supabase: SupabaseClientAny,
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
  supabase: SupabaseClientAny,
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
  supabase: SupabaseClientAny,
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

export async function notifySLABreach(
  supabase: SupabaseClientAny,
  userId: string,
  requestTitle: string,
  requestId: string
) {
  return createNotification(
    supabase,
    userId,
    'sla_warning',
    'งานเกินกำหนด SLA แล้ว!',
    requestTitle,
    requestId
  )
}

export async function notifySLACritical(
  supabase: SupabaseClientAny,
  userId: string,
  requestTitle: string,
  requestId: string,
  hoursRemaining: number
) {
  return createNotification(
    supabase,
    userId,
    'sla_warning',
    `เร่งด่วน! SLA เหลือเวลาไม่ถึง ${hoursRemaining} ชั่วโมง`,
    requestTitle,
    requestId
  )
}

// Batch notify multiple users
export async function notifyMultipleUsers(
  supabase: SupabaseClientAny,
  userIds: string[],
  type: NotificationType,
  title: string,
  message?: string,
  requestId?: string
) {
  const notifications = userIds.map((userId) => ({
    user_id: userId,
    type,
    title,
    message,
    request_id: requestId,
  }))

  return supabase.from('notifications').insert(notifications as never)
}

// Approval notifications
export async function notifyApprovalRequired(
  supabase: SupabaseClientAny,
  userId: string,
  recordType: string,
  amount: number
) {
  const typeLabels: Record<string, string> = {
    invoice: 'บิลผู้ขาย',
    expense: 'ค่าใช้จ่าย',
    disbursement: 'ใบเบิกเงิน',
  }

  return createNotification(
    supabase,
    userId,
    'approval_required',
    'มีรายการรออนุมัติ',
    `${typeLabels[recordType] || recordType} จำนวน ฿${amount.toLocaleString()}`
  )
}

export async function notifyApprovalApproved(
  supabase: SupabaseClientAny,
  userId: string,
  recordType: string,
  amount: number
) {
  const typeLabels: Record<string, string> = {
    invoice: 'บิลผู้ขาย',
    expense: 'ค่าใช้จ่าย',
    disbursement: 'ใบเบิกเงิน',
  }

  return createNotification(
    supabase,
    userId,
    'approval_approved',
    'รายการได้รับการอนุมัติแล้ว',
    `${typeLabels[recordType] || recordType} จำนวน ฿${amount.toLocaleString()}`
  )
}

export async function notifyApprovalRejected(
  supabase: SupabaseClientAny,
  userId: string,
  recordType: string,
  amount: number,
  reason?: string
) {
  const typeLabels: Record<string, string> = {
    invoice: 'บิลผู้ขาย',
    expense: 'ค่าใช้จ่าย',
    disbursement: 'ใบเบิกเงิน',
  }

  return createNotification(
    supabase,
    userId,
    'approval_rejected',
    'รายการไม่ได้รับการอนุมัติ',
    `${typeLabels[recordType] || recordType} ฿${amount.toLocaleString()}${reason ? ` - ${reason}` : ''}`
  )
}

export async function notifyDisbursementReady(
  supabase: SupabaseClientAny,
  userId: string,
  documentNumber: string,
  amount: number
) {
  return createNotification(
    supabase,
    userId,
    'disbursement_ready',
    'ใบเบิกเงินพร้อมจ่าย',
    `เลขที่ ${documentNumber} จำนวน ฿${amount.toLocaleString()}`
  )
}
