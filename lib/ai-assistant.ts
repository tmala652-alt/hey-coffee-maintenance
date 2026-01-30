import { createClient } from '@/lib/supabase/client'
import type { MaintenanceRequest, KnowledgeArticle, AIAnalysis } from '@/types/database.types'

export type AnalysisType =
  | 'request_summary'
  | 'root_cause'
  | 'solution_suggestion'
  | 'trend_analysis'
  | 'cost_prediction'
  | 'preventive_recommendation'

export interface AIAnalysisResult {
  success: boolean
  analysis?: {
    content: string
    confidence: number
    suggestions?: string[]
  }
  error?: string
}

export interface SmartSuggestions {
  relatedArticles: KnowledgeArticle[]
  suggestedActions: string[]
  estimatedTime: { min: number; max: number; average: number }
  estimatedCost: { min: number; max: number; average: number }
  similarIssues: { count: number; avgResolutionTime: number }
}

export interface TrendData {
  period: string
  categories: { name: string; count: number; percentage: number }[]
  topIssues: { title: string; count: number }[]
  avgResolutionTime: number
  totalRequests: number
  completedRequests: number
  slaBreaches: number
}

export interface AIRecommendation {
  id: string
  type: 'preventive_maintenance' | 'equipment_replacement' | 'technician_training' | 'process_improvement'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  estimatedImpact: {
    costSaving?: number
    timeSaving?: number
    preventedIssues?: number
  }
  relatedRequests: string[]
}

/**
 * Analyze a maintenance request using AI
 */
export async function analyzeRequest(
  request: MaintenanceRequest,
  analysisType: AnalysisType
): Promise<AIAnalysisResult> {
  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: request.id,
        analysis_type: analysisType,
        context: {
          title: request.title,
          description: request.description,
          category: request.category,
          priority: request.priority,
          branch_id: request.branch_id,
        },
      }),
    })

    if (!response.ok) {
      throw new Error('AI analysis failed')
    }

    const data = await response.json()
    return {
      success: true,
      analysis: {
        content: data.content,
        confidence: data.confidence || 0.8,
        suggestions: data.suggestions || [],
      },
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    return {
      success: false,
      error: 'ไม่สามารถวิเคราะห์ได้ในขณะนี้',
    }
  }
}

/**
 * Get smart suggestions based on request context
 */
export async function getSmartSuggestions(
  request: MaintenanceRequest
): Promise<SmartSuggestions> {
  const supabase = createClient()

  // 1. Find related KB articles by category
  const { data: articles } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('status', 'published')
    .contains('equipment_types', request.category ? [request.category] : [])
    .order('helpful_count', { ascending: false })
    .limit(5)

  // 2. Find similar completed requests for estimates
  const { data: similarRequests } = await supabase
    .from('maintenance_requests')
    .select('*, cost_logs(amount)')
    .eq('category', request.category || '')
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .limit(50) as { data: (MaintenanceRequest & { cost_logs?: { amount: number }[] })[] | null }

  // 3. Calculate time estimates from historical data
  const resolutionTimes = (similarRequests || [])
    .map((r) => {
      if (!r.completed_at || !r.created_at) return null
      const start = new Date(r.created_at).getTime()
      const end = new Date(r.completed_at).getTime()
      return Math.round((end - start) / (1000 * 60)) // minutes
    })
    .filter((t): t is number => t !== null && t > 0)

  // 4. Calculate cost estimates from historical data
  const costs = (similarRequests || [])
    .flatMap((r) => {
      const costLogs = r.cost_logs as { amount: number }[] | undefined
      return costLogs?.map((c) => Number(c.amount)) || []
    })
    .filter((c) => c > 0)

  // 5. Generate suggested actions based on category and priority
  const suggestedActions = generateSuggestedActions(request)

  return {
    relatedArticles: (articles || []) as KnowledgeArticle[],
    suggestedActions,
    estimatedTime: {
      min: resolutionTimes.length ? Math.min(...resolutionTimes) : 30,
      max: resolutionTimes.length ? Math.max(...resolutionTimes) : 240,
      average: resolutionTimes.length
        ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
        : 60,
    },
    estimatedCost: {
      min: costs.length ? Math.min(...costs) : 0,
      max: costs.length ? Math.max(...costs) : 0,
      average: costs.length ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : 0,
    },
    similarIssues: {
      count: similarRequests?.length || 0,
      avgResolutionTime: resolutionTimes.length
        ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
        : 0,
    },
  }
}

/**
 * Generate suggested actions based on request context
 */
function generateSuggestedActions(request: MaintenanceRequest): string[] {
  const actions: string[] = []

  // Priority-based suggestions
  if (request.priority === 'critical' || request.priority === 'high') {
    actions.push('ตรวจสอบความปลอดภัยก่อนเริ่มงาน')
    actions.push('แจ้งสาขาถึงเวลาที่คาดว่าจะเสร็จ')
  }

  // Category-based suggestions
  const categoryActions: Record<string, string[]> = {
    เครื่องชงกาแฟ: [
      'ตรวจสอบการเชื่อมต่อไฟฟ้าและน้ำ',
      'ตรวจสอบแรงดันและอุณหภูมิ',
      'ล้างระบบก่อนทดสอบ',
    ],
    ระบบปรับอากาศ: [
      'ตรวจสอบตัวกรองอากาศ',
      'วัดอุณหภูมิก่อนและหลังซ่อม',
      'ตรวจสอบน้ำยาทำความเย็น',
    ],
    ระบบไฟฟ้า: [
      'ตัดไฟก่อนเริ่มงาน',
      'ใช้อุปกรณ์ป้องกันที่เหมาะสม',
      'ตรวจสอบกราวด์',
    ],
    ประปา: ['ปิดน้ำก่อนเริ่มงาน', 'ตรวจสอบการรั่วซึมหลังซ่อม', 'ทดสอบแรงดันน้ำ'],
  }

  const categoryKey = Object.keys(categoryActions).find(
    (key) => request.category?.includes(key)
  )
  if (categoryKey) {
    actions.push(...categoryActions[categoryKey])
  }

  // Default actions
  if (actions.length === 0) {
    actions.push('ตรวจสอบอุปกรณ์ที่เกี่ยวข้อง')
    actions.push('ถ่ายรูปก่อน-หลังการซ่อม')
    actions.push('บันทึกรายละเอียดการแก้ไข')
  }

  return actions.slice(0, 5)
}

/**
 * Get trend analysis data
 */
export async function getTrendAnalysis(
  period: 'week' | 'month' | 'quarter' = 'month'
): Promise<TrendData> {
  const supabase = createClient()

  // Calculate date range
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  // Fetch requests in period
  const { data: requests } = await supabase
    .from('maintenance_requests')
    .select('*')
    .gte('created_at', startDate.toISOString()) as { data: MaintenanceRequest[] | null }

  if (!requests || requests.length === 0) {
    return {
      period,
      categories: [],
      topIssues: [],
      avgResolutionTime: 0,
      totalRequests: 0,
      completedRequests: 0,
      slaBreaches: 0,
    }
  }

  // Count by category
  const categoryCounts: Record<string, number> = {}
  const titleCounts: Record<string, number> = {}
  let completedCount = 0
  let slaBreachCount = 0
  const resolutionTimes: number[] = []

  for (const req of requests) {
    // Category count
    const cat = req.category || 'อื่นๆ'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1

    // Title count (for top issues)
    const title = req.title?.slice(0, 50) || 'ไม่ระบุ'
    titleCounts[title] = (titleCounts[title] || 0) + 1

    // Completed count and resolution time
    if (req.status === 'completed') {
      completedCount++
      if (req.completed_at && req.created_at) {
        const resTime =
          (new Date(req.completed_at).getTime() - new Date(req.created_at).getTime()) /
          (1000 * 60)
        resolutionTimes.push(resTime)
      }
    }

    // SLA breach
    if (req.due_at && new Date(req.due_at) < now && req.status !== 'completed') {
      slaBreachCount++
    }
  }

  // Convert to sorted arrays
  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / requests.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const topIssues = Object.entries(titleCounts)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    period,
    categories,
    topIssues,
    avgResolutionTime: resolutionTimes.length
      ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
      : 0,
    totalRequests: requests.length,
    completedRequests: completedCount,
    slaBreaches: slaBreachCount,
  }
}

/**
 * Get AI recommendations
 */
export async function getAIRecommendations(): Promise<AIRecommendation[]> {
  const supabase = createClient()

  // Fetch recent trend data
  const trendData = await getTrendAnalysis('month')

  // Generate recommendations based on trends
  const recommendations: AIRecommendation[] = []

  // High volume category recommendation
  if (trendData.categories.length > 0) {
    const topCategory = trendData.categories[0]
    if (topCategory.percentage > 30) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        type: 'preventive_maintenance',
        title: `ตรวจสอบเชิงป้องกัน: ${topCategory.name}`,
        description: `พบปัญหา${topCategory.name}บ่อยที่สุด (${topCategory.count} ครั้ง, ${topCategory.percentage}%) แนะนำให้ทำการตรวจสอบเชิงป้องกันเพื่อลดการเกิดปัญหาซ้ำ`,
        priority: topCategory.percentage > 40 ? 'high' : 'medium',
        estimatedImpact: {
          preventedIssues: Math.round(topCategory.count * 0.3),
          costSaving: Math.round(topCategory.count * 500 * 0.3),
        },
        relatedRequests: [],
      })
    }
  }

  // SLA breach recommendation
  if (trendData.slaBreaches > 0 && trendData.totalRequests > 0) {
    const breachRate = (trendData.slaBreaches / trendData.totalRequests) * 100
    if (breachRate > 10) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        type: 'process_improvement',
        title: 'ปรับปรุงกระบวนการจัดการงาน',
        description: `อัตราการเลย SLA อยู่ที่ ${Math.round(breachRate)}% แนะนำให้ทบทวนการจัดสรรทรัพยากรและกระบวนการทำงาน`,
        priority: breachRate > 20 ? 'high' : 'medium',
        estimatedImpact: {
          preventedIssues: trendData.slaBreaches,
        },
        relatedRequests: [],
      })
    }
  }

  // Resolution time recommendation
  if (trendData.avgResolutionTime > 240) {
    // > 4 hours
    recommendations.push({
      id: `rec-${Date.now()}-3`,
      type: 'technician_training',
      title: 'พัฒนาทักษะช่าง',
      description: `เวลาเฉลี่ยในการแก้ไขปัญหาอยู่ที่ ${Math.round(trendData.avgResolutionTime / 60)} ชั่วโมง แนะนำให้จัดอบรมเพิ่มทักษะเพื่อลดเวลา`,
      priority: 'medium',
      estimatedImpact: {
        timeSaving: Math.round(trendData.avgResolutionTime * 0.2),
      },
      relatedRequests: [],
    })
  }

  return recommendations
}

/**
 * Get analysis type label in Thai
 */
export function getAnalysisTypeLabel(type: AnalysisType): string {
  const labels: Record<AnalysisType, string> = {
    request_summary: 'สรุปงาน',
    root_cause: 'วิเคราะห์สาเหตุ',
    solution_suggestion: 'แนะนำวิธีแก้ไข',
    trend_analysis: 'วิเคราะห์แนวโน้ม',
    cost_prediction: 'คาดการณ์ค่าใช้จ่าย',
    preventive_recommendation: 'คำแนะนำเชิงป้องกัน',
  }
  return labels[type] || type
}

/**
 * Get recommendation type label in Thai
 */
export function getRecommendationTypeLabel(
  type: AIRecommendation['type']
): { label: string; color: string } {
  const labels: Record<AIRecommendation['type'], { label: string; color: string }> = {
    preventive_maintenance: { label: 'การบำรุงรักษาเชิงป้องกัน', color: 'matcha' },
    equipment_replacement: { label: 'เปลี่ยนอุปกรณ์', color: 'honey' },
    technician_training: { label: 'พัฒนาทักษะ', color: 'sky' },
    process_improvement: { label: 'ปรับปรุงกระบวนการ', color: 'purple' },
  }
  return labels[type] || { label: type, color: 'coffee' }
}
