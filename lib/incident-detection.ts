import { createClient } from '@/lib/supabase/client'
import { subDays } from 'date-fns'
import type { MaintenanceRequest, Incident } from '@/types/database.types'

export interface DetectionResult {
  isRepeat: boolean
  confidence: number
  relatedRequests: RelatedRequest[]
  suggestedIncident?: Incident
  pattern: {
    branch: boolean
    category: boolean
    equipment: boolean
    timeframe: boolean
  }
}

export interface RelatedRequest {
  id: string
  title: string
  status: string
  created_at: string
  score: number
}

/**
 * Detect if a request is a repeat/related issue
 */
export async function detectIncident(
  request: MaintenanceRequest
): Promise<DetectionResult> {
  const supabase = createClient()

  // Find similar requests in last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  type SimilarRequest = { id: string; title: string; description: string | null; branch_id: string; category: string | null; equipment_id: string | null; created_at: string; status: string; issue_signature: string | null }
  const { data: similarRequests } = await supabase
    .from('maintenance_requests')
    .select('id, title, description, branch_id, category, equipment_id, created_at, status, issue_signature')
    .eq('branch_id', request.branch_id)
    .eq('category', request.category || '')
    .gte('created_at', thirtyDaysAgo)
    .neq('id', request.id)
    .order('created_at', { ascending: false })
    .limit(20) as { data: SimilarRequest[] | null }

  if (!similarRequests?.length) {
    return {
      isRepeat: false,
      confidence: 0,
      relatedRequests: [],
      pattern: { branch: false, category: false, equipment: false, timeframe: false },
    }
  }

  // Calculate similarity scores
  const scoredRequests = similarRequests
    .map((req) => ({
      id: req.id,
      title: req.title,
      status: req.status,
      created_at: req.created_at!,
      score: calculateSimilarity(request, req),
    }))
    .filter((r) => r.score > 0.5)
    .sort((a, b) => b.score - a.score)

  // Check for pattern
  const pattern = {
    branch: scoredRequests.length >= 2,
    category: true,
    equipment:
      request.equipment_id !== null &&
      similarRequests.some((r) => r.equipment_id === request.equipment_id),
    timeframe: scoredRequests.length >= 3,
  }

  const isRepeat = scoredRequests.length >= 2
  const confidence = Math.min(scoredRequests.length * 0.25, 1)

  // Check if existing incident
  let suggestedIncident: Incident | undefined
  if (isRepeat && scoredRequests.length > 0) {
    const relatedIds = scoredRequests.map((r) => r.id)

    const { data: existingIncidentLink } = await supabase
      .from('incident_requests')
      .select('incident_id')
      .in('request_id', relatedIds)
      .limit(1)
      .single() as { data: { incident_id: string } | null }

    if (existingIncidentLink) {
      const { data: incident } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', existingIncidentLink.incident_id)
        .single() as { data: Incident | null }

      if (incident) {
        suggestedIncident = incident
      }
    }
  }

  return {
    isRepeat,
    confidence,
    relatedRequests: scoredRequests.slice(0, 5),
    suggestedIncident,
    pattern,
  }
}

/**
 * Calculate similarity between two requests
 */
function calculateSimilarity(a: MaintenanceRequest, b: any): number {
  let score = 0

  // Same branch: +0.3
  if (a.branch_id === b.branch_id) score += 0.3

  // Same category: +0.3
  if (a.category === b.category) score += 0.3

  // Same equipment: +0.25
  if (a.equipment_id && a.equipment_id === b.equipment_id) score += 0.25

  // Text similarity: +0.15
  const titleSim = calculateTextSimilarity(a.title, b.title)
  score += titleSim * 0.15

  return score
}

/**
 * Simple text similarity using word overlap
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0

  const words1 = new Set(
    text1
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  )
  const words2 = new Set(
    text2
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  )

  if (words1.size === 0 || words2.size === 0) return 0

  let overlap = 0
  words1.forEach((w) => {
    if (words2.has(w)) overlap++
  })

  return overlap / Math.max(words1.size, words2.size)
}

/**
 * Create a new incident from a request
 */
export async function createIncident(
  title: string,
  description: string,
  requestIds: string[],
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<{ incident: Incident | null; error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { incident: null, error: 'ไม่พบผู้ใช้' }
  }

  // Create incident
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .insert({
      title,
      description,
      severity,
      status: 'open',
      created_by: user.id,
    } as never)
    .select()
    .single() as { data: Incident | null; error: unknown }

  if (incidentError || !incident) {
    return { incident: null, error: 'ไม่สามารถสร้าง Incident ได้' }
  }

  // Link requests to incident
  if (requestIds.length > 0) {
    const links = requestIds.map((requestId) => ({
      incident_id: incident.id,
      request_id: requestId,
      linked_by: user.id,
    }))

    await supabase.from('incident_requests').insert(links as never)

    // Update requests with incident_id
    await supabase
      .from('maintenance_requests')
      .update({ incident_id: incident.id } as never)
      .in('id', requestIds)
  }

  return { incident }
}

/**
 * Link a request to an existing incident
 */
export async function linkRequestToIncident(
  requestId: string,
  incidentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'ไม่พบผู้ใช้' }
  }

  // Create link
  const { error: linkError } = await supabase.from('incident_requests').insert({
    incident_id: incidentId,
    request_id: requestId,
    linked_by: user.id,
  } as never)

  if (linkError) {
    if ((linkError as { code: string }).code === '23505') {
      return { success: false, error: 'งานนี้เชื่อมโยงกับ Incident นี้อยู่แล้ว' }
    }
    return { success: false, error: 'ไม่สามารถเชื่อมโยงได้' }
  }

  // Update request
  await supabase
    .from('maintenance_requests')
    .update({ incident_id: incidentId } as never)
    .eq('id', requestId)

  return { success: true }
}

/**
 * Get all requests linked to an incident
 */
export async function getIncidentRequests(
  incidentId: string
): Promise<MaintenanceRequest[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('incident_requests')
    .select(
      `
      request:maintenance_requests(
        *,
        branch:branches(name, code)
      )
    `
    )
    .eq('incident_id', incidentId)

  if (!data) return []

  return data.map((d: any) => d.request) as MaintenanceRequest[]
}

/**
 * Generate issue signature for a request
 */
export function generateIssueSignature(request: MaintenanceRequest): string {
  const parts = [
    request.branch_id,
    request.category || 'unknown',
    request.equipment_id || 'no-equipment',
  ]
  return parts.join('|')
}

/**
 * Get incident severity label in Thai
 */
export function getIncidentSeverityLabel(
  severity: 'low' | 'medium' | 'high' | 'critical'
): string {
  const labels = {
    low: 'ต่ำ',
    medium: 'ปานกลาง',
    high: 'สูง',
    critical: 'วิกฤต',
  }
  return labels[severity] || severity
}

/**
 * Get incident status label in Thai
 */
export function getIncidentStatusLabel(
  status: 'open' | 'investigating' | 'resolved' | 'closed'
): string {
  const labels = {
    open: 'เปิด',
    investigating: 'กำลังตรวจสอบ',
    resolved: 'แก้ไขแล้ว',
    closed: 'ปิด',
  }
  return labels[status] || status
}
