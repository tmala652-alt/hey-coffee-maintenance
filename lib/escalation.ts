import { SupabaseClient } from '@supabase/supabase-js'
import { calculateSLAStatus } from './sla'
import { notifySLAWarning } from './notifications'
import type { SLAStatus, EscalationRule, Profile } from '@/types/database.types'

export interface EscalationResult {
  requestId: string
  previousStatus: SLAStatus | null
  newStatus: SLAStatus
  escalationTriggered: boolean
  notificationsSent: number
}

/**
 * Check and escalate a single request based on SLA status
 */
export async function checkAndEscalate(
  supabase: SupabaseClient,
  request: {
    id: string
    title: string
    created_at: string | null
    due_at: string | null
    status: string
    sla_status: string | null
    assigned_user_id: string | null
    created_by: string
  }
): Promise<EscalationResult> {
  const newStatus = calculateSLAStatus(request.created_at, request.due_at, request.status)
  const previousStatus = request.sla_status as SLAStatus | null

  const result: EscalationResult = {
    requestId: request.id,
    previousStatus,
    newStatus,
    escalationTriggered: false,
    notificationsSent: 0,
  }

  // No change in status
  if (newStatus === previousStatus) {
    return result
  }

  // Update sla_status in database
  await supabase
    .from('maintenance_requests')
    .update({ sla_status: newStatus })
    .eq('id', request.id)

  // Check if we need to escalate
  if (shouldEscalate(previousStatus, newStatus)) {
    result.escalationTriggered = true
    result.notificationsSent = await triggerEscalation(
      supabase,
      request,
      newStatus
    )
  }

  return result
}

/**
 * Determine if escalation should be triggered
 */
function shouldEscalate(
  previousStatus: SLAStatus | null,
  newStatus: SLAStatus
): boolean {
  // Only escalate when crossing thresholds
  const thresholds: SLAStatus[] = ['warning', 'critical', 'breached']

  if (!thresholds.includes(newStatus)) {
    return false
  }

  // Always escalate if we're newly entering a threshold status
  if (previousStatus === 'on_track' || previousStatus === null) {
    return true
  }

  // Escalate when moving to a worse status
  const statusOrder: SLAStatus[] = ['on_track', 'warning', 'critical', 'breached']
  const prevIndex = statusOrder.indexOf(previousStatus)
  const newIndex = statusOrder.indexOf(newStatus)

  return newIndex > prevIndex
}

/**
 * Trigger escalation notifications
 */
async function triggerEscalation(
  supabase: SupabaseClient,
  request: {
    id: string
    title: string
    due_at: string | null
    assigned_user_id: string | null
    created_by: string
  },
  status: SLAStatus
): Promise<number> {
  // Get escalation rules
  const { data: rules } = await supabase
    .from('escalation_rules')
    .select('*')
    .eq('is_active', true)
    .order('threshold_percent', { ascending: true })

  if (!rules || rules.length === 0) {
    return 0
  }

  // Find matching rule
  const rule = findMatchingRule(rules, status)
  if (!rule) {
    return 0
  }

  // Get users to notify based on roles
  const usersToNotify = await getUsersToNotify(supabase, rule.notify_roles || [])

  // Also notify assigned user if exists
  if (request.assigned_user_id && !usersToNotify.includes(request.assigned_user_id)) {
    usersToNotify.push(request.assigned_user_id)
  }

  // Calculate hours remaining
  const hoursRemaining = request.due_at
    ? Math.max(0, Math.floor((new Date(request.due_at).getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0

  // Send notifications
  let notificationsSent = 0
  for (const userId of usersToNotify) {
    try {
      await notifySLAWarning(
        supabase,
        userId,
        request.title,
        request.id,
        hoursRemaining
      )
      notificationsSent++
    } catch (error) {
      console.error(`Failed to notify user ${userId}:`, error)
    }
  }

  return notificationsSent
}

/**
 * Find the matching escalation rule for a status
 */
function findMatchingRule(
  rules: EscalationRule[],
  status: SLAStatus
): EscalationRule | null {
  const thresholdMap: Record<SLAStatus, number> = {
    on_track: 0,
    warning: 75,
    critical: 90,
    breached: 100,
    completed: 0,
    no_sla: 0,
  }

  const threshold = thresholdMap[status]
  if (threshold === 0) return null

  return rules.find((r) => r.threshold_percent === threshold) || null
}

/**
 * Get users to notify based on roles
 */
async function getUsersToNotify(
  supabase: SupabaseClient,
  roles: string[]
): Promise<string[]> {
  if (roles.length === 0) return []

  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .in('role', roles)

  return users?.map((u) => u.id) || []
}

/**
 * Batch process all active requests for SLA monitoring
 * Called by Edge Function or cron job
 */
export async function processAllActiveRequests(
  supabase: SupabaseClient
): Promise<{
  processed: number
  escalated: number
  notificationsSent: number
}> {
  // Get all active requests with SLA
  const { data: requests, error } = await supabase
    .from('maintenance_requests')
    .select('id, title, created_at, due_at, status, sla_status, assigned_user_id, created_by')
    .in('status', ['pending', 'assigned', 'in_progress'])
    .not('due_at', 'is', null)

  if (error || !requests) {
    console.error('Failed to fetch active requests:', error)
    return { processed: 0, escalated: 0, notificationsSent: 0 }
  }

  let escalated = 0
  let notificationsSent = 0

  for (const request of requests) {
    const result = await checkAndEscalate(supabase, request)
    if (result.escalationTriggered) {
      escalated++
      notificationsSent += result.notificationsSent
    }
  }

  return {
    processed: requests.length,
    escalated,
    notificationsSent,
  }
}
