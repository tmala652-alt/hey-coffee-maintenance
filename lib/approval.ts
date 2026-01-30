import { SupabaseClient } from '@supabase/supabase-js'
import {
  ApprovalRequest,
  ApprovalLog,
  ApprovalThreshold,
  ApprovalStatus,
  RoleEnum,
  Database
} from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export interface SubmitApprovalParams {
  supabase: AnySupabaseClient
  recordType: 'invoice' | 'expense' | 'disbursement'
  recordId: string
  amount: number
  requestedBy: string
  organizationId: string
  notes?: string
}

export interface ProcessApprovalParams {
  supabase: AnySupabaseClient
  approvalRequestId: string
  action: 'approved' | 'rejected'
  approverId: string
  comments?: string
}

export interface ApprovalResult {
  success: boolean
  data?: ApprovalRequest
  error?: string
}

// Get applicable thresholds for an amount
export async function getApplicableThresholds(
  supabase: AnySupabaseClient,
  organizationId: string,
  amount: number
): Promise<ApprovalThreshold[]> {
  const { data, error } = await supabase
    .from('approval_thresholds')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .lte('min_amount', amount)
    .order('approval_level', { ascending: true })

  if (error) {
    console.error('Error fetching thresholds:', error)
    return []
  }

  // Filter thresholds where amount <= max_amount (or max_amount is null for unlimited)
  return (data || []).filter(t =>
    t.max_amount === null || amount <= t.max_amount
  )
}

// Get unique approval levels required
export function getRequiredLevels(thresholds: ApprovalThreshold[]): number {
  if (!thresholds.length) return 1
  const levels = new Set(thresholds.map(t => t.approval_level))
  return levels.size
}

// Submit a record for approval
export async function submitForApproval(
  params: SubmitApprovalParams
): Promise<ApprovalResult> {
  const { supabase, recordType, recordId, amount, requestedBy, organizationId, notes } = params

  try {
    // 1. Get applicable thresholds
    const thresholds = await getApplicableThresholds(supabase, organizationId, amount)
    const requiredLevels = getRequiredLevels(thresholds)

    // 2. Create approval request
    const { data, error } = await supabase
      .from('approval_requests')
      .insert({
        organization_id: organizationId,
        record_type: recordType,
        record_id: recordId,
        amount,
        status: 'pending',
        current_level: 1,
        required_levels: requiredLevels,
        requester_notes: notes,
        requested_by: requestedBy
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // 3. Update the source record status to pending
    const tableMap = {
      invoice: 'vendor_invoices',
      expense: 'expense_records',
      disbursement: 'disbursement_requests'
    }
    const tableName = tableMap[recordType]
    const statusField = recordType === 'disbursement' ? 'approval_status' : 'status'

    await supabase
      .from(tableName)
      .update({ [statusField]: 'pending' })
      .eq('id', recordId)

    // 4. Notify approvers for level 1
    await notifyApprovers(supabase, data.id, 1, organizationId, amount)

    return { success: true, data }
  } catch (err) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการส่งขออนุมัติ' }
  }
}

// Process an approval (approve or reject)
export async function processApproval(
  params: ProcessApprovalParams
): Promise<ApprovalResult> {
  const { supabase, approvalRequestId, action, approverId, comments } = params

  try {
    // 1. Get the approval request
    const { data: request, error: fetchError } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('id', approvalRequestId)
      .single()

    if (fetchError || !request) {
      return { success: false, error: 'ไม่พบคำขออนุมัติ' }
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'คำขออนุมัตินี้ได้ดำเนินการแล้ว' }
    }

    // 2. Log the approval action
    const { error: logError } = await supabase
      .from('approval_logs')
      .insert({
        approval_request_id: approvalRequestId,
        approval_level: request.current_level,
        action,
        approved_by: approverId,
        comments
      })

    if (logError) {
      return { success: false, error: logError.message }
    }

    // 3. Process based on action
    if (action === 'rejected') {
      // Update request status to rejected
      await supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          completed_at: new Date().toISOString()
        })
        .eq('id', approvalRequestId)

      // Update source record status
      await updateSourceRecordStatus(supabase, request, 'rejected')

      // Notify requester
      await notifyRequester(supabase, request, 'rejected', comments)

    } else {
      // Check if more levels needed
      if (request.current_level < request.required_levels) {
        // Move to next level
        await supabase
          .from('approval_requests')
          .update({ current_level: request.current_level + 1 })
          .eq('id', approvalRequestId)

        // Notify next level approvers
        await notifyApprovers(
          supabase,
          approvalRequestId,
          request.current_level + 1,
          request.organization_id,
          request.amount
        )
      } else {
        // All levels approved
        await supabase
          .from('approval_requests')
          .update({
            status: 'approved',
            completed_at: new Date().toISOString()
          })
          .eq('id', approvalRequestId)

        // Update source record status
        await updateSourceRecordStatus(supabase, request, 'approved')

        // Notify requester
        await notifyRequester(supabase, request, 'approved', comments)
      }
    }

    // Fetch updated request
    const { data: updatedRequest } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('id', approvalRequestId)
      .single()

    return { success: true, data: updatedRequest }
  } catch (err) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการดำเนินการอนุมัติ' }
  }
}

// Update the source record status
async function updateSourceRecordStatus(
  supabase: AnySupabaseClient,
  request: ApprovalRequest,
  status: ApprovalStatus
) {
  const tableMap = {
    invoice: 'vendor_invoices',
    expense: 'expense_records',
    disbursement: 'disbursement_requests'
  }
  const tableName = tableMap[request.record_type as keyof typeof tableMap]
  const statusField = request.record_type === 'disbursement' ? 'approval_status' : 'status'

  await supabase
    .from(tableName)
    .update({ [statusField]: status })
    .eq('id', request.record_id)
}

// Notify approvers based on level
async function notifyApprovers(
  supabase: AnySupabaseClient,
  approvalRequestId: string,
  level: number,
  organizationId: string,
  amount: number
) {
  // Get thresholds for this level
  const { data: thresholds } = await supabase
    .from('approval_thresholds')
    .select('approver_role, approver_id')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('approval_level', level)
    .lte('min_amount', amount)

  if (!thresholds?.length) return

  // Get users to notify
  const roles = Array.from(new Set(thresholds.map(t => t.approver_role)))
  const specificIds = thresholds
    .filter(t => t.approver_id)
    .map(t => t.approver_id)

  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId)
    .or(`role.in.(${roles.join(',')}),id.in.(${specificIds.join(',')})`)

  if (!users?.length) return

  // Create notifications
  const notifications = users.map(user => ({
    user_id: user.id,
    type: 'approval_required',
    title: 'มีรายการรออนุมัติ',
    message: `มีรายการรออนุมัติ จำนวน ฿${amount.toLocaleString()}`
  }))

  await supabase.from('notifications').insert(notifications)
}

// Notify the requester about approval result
async function notifyRequester(
  supabase: AnySupabaseClient,
  request: ApprovalRequest,
  status: 'approved' | 'rejected',
  comments?: string
) {
  const title = status === 'approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'
  const message = status === 'approved'
    ? `รายการของคุณได้รับการอนุมัติแล้ว จำนวน ฿${request.amount.toLocaleString()}`
    : `รายการของคุณไม่ได้รับการอนุมัติ${comments ? `: ${comments}` : ''}`

  await supabase.from('notifications').insert({
    user_id: request.requested_by,
    type: status === 'approved' ? 'approval_approved' : 'approval_rejected',
    title,
    message
  })
}

// Get pending approvals for a user
export async function getPendingApprovalsForUser(
  supabase: AnySupabaseClient,
  userId: string,
  organizationId: string
): Promise<ApprovalRequest[]> {
  // Get user's role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile) return []

  // Get thresholds for user's role
  const { data: thresholds } = await supabase
    .from('approval_thresholds')
    .select('approval_level, min_amount, max_amount')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .or(`approver_role.eq.${profile.role},approver_id.eq.${userId}`)

  if (!thresholds?.length) return []

  // Get pending requests at appropriate levels
  const { data: requests } = await supabase
    .from('approval_requests')
    .select(`
      *,
      requester:profiles!approval_requests_requested_by_fkey(id, name),
      logs:approval_logs(*)
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  if (!requests?.length) return []

  // Filter based on thresholds and current level
  return requests.filter(req => {
    const applicable = thresholds.find(t =>
      t.approval_level === req.current_level &&
      t.min_amount <= req.amount &&
      (t.max_amount === null || req.amount <= t.max_amount)
    )
    return !!applicable
  })
}

// Check if user can approve a request
export async function canUserApprove(
  supabase: AnySupabaseClient,
  userId: string,
  request: ApprovalRequest
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', userId)
    .single()

  if (!profile || profile.organization_id !== request.organization_id) {
    return false
  }

  const { data: thresholds } = await supabase
    .from('approval_thresholds')
    .select('*')
    .eq('organization_id', request.organization_id)
    .eq('is_active', true)
    .eq('approval_level', request.current_level)
    .lte('min_amount', request.amount)

  if (!thresholds?.length) return false

  return thresholds.some(t =>
    (t.max_amount === null || request.amount <= t.max_amount) &&
    (t.approver_role === profile.role || t.approver_id === userId)
  )
}
