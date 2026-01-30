import { createClient } from '@/lib/supabase/client'
import type {
  MaintenanceRequest,
  Profile,
  TechnicianSkill,
  TechnicianAvailability,
  AssignmentRule,
} from '@/types/database.types'

export interface AssignmentCandidate {
  profileId: string
  name: string
  score: number
  factors: {
    skillMatch: number
    workload: number
    availability: number
  }
  skills: TechnicianSkill[]
  currentWorkload: number
  maxWorkload: number
}

export interface AssignmentResult {
  candidates: AssignmentCandidate[]
  recommendedId: string | null
  strategy: string
}

type ProfileWithRelations = Profile & {
  skills: TechnicianSkill[]
  availability: TechnicianAvailability[]
}

/**
 * Find the best technicians for a request
 */
export async function findBestTechnician(
  request: MaintenanceRequest
): Promise<AssignmentResult> {
  const supabase = createClient()

  // 1. Check assignment rules first
  const { data: rules } = await supabase
    .from('assignment_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false }) as { data: AssignmentRule[] | null }

  let strategy = 'skill_match' // Default strategy

  // Check if any rule matches
  for (const rule of rules || []) {
    if (matchesRule(request, rule as AssignmentRule)) {
      strategy = rule.assignment_strategy || 'skill_match'

      // If manual assignment to specific technician
      if (strategy === 'manual' && rule.target_technician_id) {
        const { data: tech } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', rule.target_technician_id)
          .single() as { data: Profile | null }

        if (tech) {
          return {
            candidates: [
              {
                profileId: tech.id,
                name: tech.name,
                score: 1,
                factors: { skillMatch: 1, workload: 1, availability: 1 },
                skills: [],
                currentWorkload: tech.current_workload || 0,
                maxWorkload: tech.max_workload || 10,
              },
            ],
            recommendedId: tech.id,
            strategy: 'manual',
          }
        }
      }
      break
    }
  }

  // 2. Get all available technicians
  const { data: technicians } = await supabase
    .from('profiles')
    .select(
      `
      *,
      skills:technician_skills(*),
      availability:technician_availability(*)
    `
    )
    .eq('role', 'technician')

  if (!technicians || technicians.length === 0) {
    return { candidates: [], recommendedId: null, strategy }
  }

  // 3. Score each technician
  const candidates: AssignmentCandidate[] = (technicians as ProfileWithRelations[])
    .filter((tech) => {
      // Filter out technicians at max workload
      const current = tech.current_workload || 0
      const max = tech.max_workload || 10
      return current < max
    })
    .map((tech) => {
      const factors = {
        skillMatch: calculateSkillMatch(tech.skills || [], request.category),
        workload: calculateWorkloadScore(
          tech.current_workload || 0,
          tech.max_workload || 10
        ),
        availability: checkAvailability(tech.availability || []),
      }

      // Calculate weighted score based on strategy
      const score = calculateScore(factors, strategy)

      return {
        profileId: tech.id,
        name: tech.name,
        score,
        factors,
        skills: tech.skills || [],
        currentWorkload: tech.current_workload || 0,
        maxWorkload: tech.max_workload || 10,
      }
    })
    .sort((a, b) => b.score - a.score)

  return {
    candidates,
    recommendedId: candidates.length > 0 ? candidates[0].profileId : null,
    strategy,
  }
}

/**
 * Check if a request matches an assignment rule
 */
function matchesRule(request: MaintenanceRequest, rule: AssignmentRule): boolean {
  const conditions = rule.conditions as {
    category?: string
    priority?: string
    branch_region?: string
  }

  if (!conditions) return true

  // Check category
  if (conditions.category && request.category !== conditions.category) {
    return false
  }

  // Check priority
  if (conditions.priority && request.priority !== conditions.priority) {
    return false
  }

  return true
}

/**
 * Calculate skill match score (0-1)
 */
function calculateSkillMatch(skills: TechnicianSkill[], category: string | null): number {
  if (!category) return 0.5 // Default score if no category

  const skill = skills.find((s) => s.category === category)
  if (!skill) return 0.2 // Base score for any technician

  // Normalize skill level (1-5) to 0-1
  return (skill.skill_level || 1) / 5
}

/**
 * Calculate workload score (0-1, higher is better/less loaded)
 */
function calculateWorkloadScore(current: number, max: number): number {
  if (max === 0) return 0
  return 1 - current / max
}

/**
 * Check availability for today (0 or 1)
 */
function checkAvailability(availability: TechnicianAvailability[]): number {
  const today = new Date().toISOString().split('T')[0]
  const todayAvailability = availability.find((a) => a.date === today)

  if (!todayAvailability) return 1 // Assume available if no record
  return todayAvailability.is_available ? 1 : 0
}

/**
 * Calculate weighted score based on strategy
 */
function calculateScore(
  factors: { skillMatch: number; workload: number; availability: number },
  strategy: string
): number {
  switch (strategy) {
    case 'skill_match':
      return factors.skillMatch * 0.5 + factors.workload * 0.3 + factors.availability * 0.2
    case 'least_loaded':
      return factors.workload * 0.6 + factors.skillMatch * 0.2 + factors.availability * 0.2
    case 'round_robin':
      return factors.availability * 0.5 + factors.workload * 0.5
    default:
      return factors.skillMatch * 0.4 + factors.workload * 0.4 + factors.availability * 0.2
  }
}

/**
 * Assign a technician to a request
 */
export async function assignTechnician(
  requestId: string,
  technicianId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // 1. Update the request
    const { error: updateError } = await supabase
      .from('maintenance_requests')
      .update({
        assigned_user_id: technicianId,
        status: 'assigned',
      } as never)
      .eq('id', requestId)

    if (updateError) {
      return { success: false, error: 'ไม่สามารถมอบหมายงานได้' }
    }

    // 2. Update technician workload
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_workload')
      .eq('id', technicianId)
      .single() as { data: { current_workload: number | null } | null }

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          current_workload: (profile.current_workload || 0) + 1,
        } as never)
        .eq('id', technicianId)
    }

    // 3. Create notification
    const { data: request } = await supabase
      .from('maintenance_requests')
      .select('title')
      .eq('id', requestId)
      .single() as { data: { title: string } | null }

    if (request) {
      await supabase.from('notifications').insert({
        user_id: technicianId,
        title: 'งานใหม่ได้รับมอบหมาย',
        message: `คุณได้รับมอบหมายงาน "${request.title}"`,
        type: 'assignment',
        request_id: requestId,
      } as never)
    }

    return { success: true }
  } catch (error) {
    console.error('Assign error:', error)
    return { success: false, error: 'เกิดข้อผิดพลาด' }
  }
}

/**
 * Get skill level label in Thai
 */
export function getSkillLevelLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'เริ่มต้น',
    2: 'พื้นฐาน',
    3: 'ปานกลาง',
    4: 'ชำนาญ',
    5: 'เชี่ยวชาญ',
  }
  return labels[level] || `ระดับ ${level}`
}

/**
 * Get strategy label in Thai
 */
export function getStrategyLabel(strategy: string): string {
  const labels: Record<string, string> = {
    round_robin: 'วนรอบ',
    least_loaded: 'งานน้อยที่สุด',
    skill_match: 'ทักษะตรงกัน',
    nearest: 'ใกล้ที่สุด',
    manual: 'กำหนดเอง',
  }
  return labels[strategy] || strategy
}
