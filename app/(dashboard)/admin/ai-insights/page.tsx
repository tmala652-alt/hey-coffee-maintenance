import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Wrench,
  Lightbulb,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import type { Profile, AIAnalysis, AIRecommendation } from '@/types/database.types'
import TrendSection from './TrendSection'
import RecommendationsSection from './RecommendationsSection'

export default async function AdminAIInsightsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = (await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()) as { data: Profile | null }

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch recent AI analyses
  const { data: recentAnalyses } = await supabase
    .from('ai_analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10) as { data: AIAnalysis[] | null }

  // Fetch stats
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: totalRequests } = await supabase
    .from('maintenance_requests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  const { count: completedRequests } = await supabase
    .from('maintenance_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const { count: slaBreaches } = await supabase
    .from('maintenance_requests')
    .select('*', { count: 'exact', head: true })
    .lt('due_at', new Date().toISOString())
    .neq('status', 'completed')

  const { count: aiAnalysesCount } = await supabase
    .from('ai_analyses')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  const completionRate = totalRequests ? Math.round(((completedRequests || 0) / totalRequests) * 100) : 0
  const breachRate = totalRequests ? Math.round(((slaBreaches || 0) / totalRequests) * 100) : 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-700/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          AI Insights
        </h1>
        <p className="text-coffee-600 mt-1">
          วิเคราะห์แนวโน้มและคำแนะนำจาก AI
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-sky-100 to-sky-200">
              <Wrench className="h-6 w-6 text-sky-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{totalRequests || 0}</p>
              <p className="text-sm text-coffee-500">งานใน 30 วัน</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-matcha-100 to-matcha-200">
              <CheckCircle className="h-6 w-6 text-matcha-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{completionRate}%</p>
              <p className="text-sm text-coffee-500">อัตราสำเร็จ</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-cherry-100 to-cherry-200">
              <AlertTriangle className="h-6 w-6 text-cherry-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{breachRate}%</p>
              <p className="text-sm text-coffee-500">เลย SLA</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-purple-100 to-purple-200">
              <Sparkles className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{aiAnalysesCount || 0}</p>
              <p className="text-sm text-coffee-500">AI วิเคราะห์</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trend Analysis - Takes 2 columns */}
        <div className="lg:col-span-2">
          <TrendSection />
        </div>

        {/* Recommendations */}
        <div>
          <RecommendationsSection />
        </div>
      </div>

      {/* Recent AI Analyses */}
      {recentAnalyses && recentAnalyses.length > 0 && (
        <div className="card-glass overflow-hidden">
          <div className="p-4 border-b border-coffee-100">
            <h2 className="text-lg font-semibold text-coffee-900 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-honey-500" />
              การวิเคราะห์ล่าสุด
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-coffee-100 bg-cream-50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-coffee-600">
                    ประเภท
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-coffee-600">
                    งาน
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-coffee-600">
                    ความมั่นใจ
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-coffee-600">
                    วันที่
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {(recentAnalyses as AIAnalysis[]).map((analysis) => {
                  const typeLabels: Record<string, { label: string; color: string }> = {
                    request_summary: { label: 'สรุปงาน', color: 'bg-sky-100 text-sky-700' },
                    root_cause: { label: 'สาเหตุ', color: 'bg-orange-100 text-orange-700' },
                    solution_suggestion: { label: 'วิธีแก้ไข', color: 'bg-matcha-100 text-matcha-700' },
                    cost_prediction: { label: 'ค่าใช้จ่าย', color: 'bg-honey-100 text-honey-700' },
                    trend_analysis: { label: 'แนวโน้ม', color: 'bg-purple-100 text-purple-700' },
                    preventive_recommendation: { label: 'ป้องกัน', color: 'bg-teal-100 text-teal-700' },
                  }
                  const typeInfo = typeLabels[analysis.analysis_type] || { label: analysis.analysis_type, color: 'bg-coffee-100 text-coffee-700' }

                  return (
                    <tr key={analysis.id} className="hover:bg-cream-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-coffee-700 font-mono">
                          {analysis.request_id?.slice(0, 8) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${
                          (analysis.confidence_score || 0) >= 0.8 ? 'text-matcha-600' :
                          (analysis.confidence_score || 0) >= 0.6 ? 'text-honey-600' :
                          'text-cherry-600'
                        }`}>
                          {Math.round((analysis.confidence_score || 0) * 100)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-coffee-500">
                          {analysis.created_at && format(new Date(analysis.created_at), 'd MMM HH:mm', { locale: th })}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!recentAnalyses || recentAnalyses.length === 0) && (
        <div className="card-glass">
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-coffee-900 mb-2">ยังไม่มีการวิเคราะห์</h3>
            <p className="text-coffee-500 max-w-sm mx-auto">
              AI จะเริ่มวิเคราะห์เมื่อมีการใช้งานฟีเจอร์วิเคราะห์ในหน้างาน
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
