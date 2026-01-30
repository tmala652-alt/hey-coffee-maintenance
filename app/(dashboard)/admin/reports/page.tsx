import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Banknote,
  Building2,
  PieChart,
  Target,
  Tag,
  ArrowDown,
  Minus,
  ArrowUp,
  Clock,
} from 'lucide-react'
import type { Profile, MaintenanceRequest, SlaLog } from '@/types/database.types'
import ExportButton from './ExportButton'

type RequestWithBranch = MaintenanceRequest & { branch: { name: string } | null }

export default async function ReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get all requests
  const { data: requests } = await supabase
    .from('maintenance_requests')
    .select('*, branch:branches(name)') as { data: RequestWithBranch[] | null }

  // Get SLA logs
  const { data: slaLogs } = await supabase
    .from('sla_logs')
    .select('*')
    .not('resolved_at', 'is', null) as { data: SlaLog[] | null }

  // Calculate stats
  const totalRequests = requests?.length || 0
  const completedRequests = requests?.filter((r) => r.status === 'completed').length || 0
  const pendingRequests = requests?.filter((r) => r.status === 'pending').length || 0
  const inProgressRequests = requests?.filter((r) => r.status === 'in_progress' || r.status === 'assigned').length || 0

  const totalCost = requests?.reduce((sum, r) => sum + (Number(r.actual_cost) || 0), 0) || 0

  const slaBreach = slaLogs?.filter((s) => s.breached).length || 0
  const slaTotal = slaLogs?.length || 0
  const slaCompliance = slaTotal > 0 ? ((slaTotal - slaBreach) / slaTotal * 100).toFixed(1) : '100'

  // By priority
  const byPriority = {
    low: requests?.filter((r) => r.priority === 'low').length || 0,
    medium: requests?.filter((r) => r.priority === 'medium').length || 0,
    high: requests?.filter((r) => r.priority === 'high').length || 0,
    critical: requests?.filter((r) => r.priority === 'critical').length || 0,
  }

  // By category
  const byCategory = requests?.reduce((acc, r) => {
    const cat = r.category || 'อื่นๆ'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // By branch
  const byBranch = requests?.reduce((acc, r) => {
    const branch = (r.branch as { name: string } | null)?.name || 'ไม่ระบุ'
    acc[branch] = (acc[branch] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const sortedBranches = Object.entries(byBranch).sort((a, b) => b[1] - a[1])

  const priorityConfig = [
    { key: 'low', label: 'ต่ำ', icon: ArrowDown, color: 'from-matcha-100 to-matcha-200 text-matcha-700', bgColor: 'bg-matcha-500' },
    { key: 'medium', label: 'ปานกลาง', icon: Minus, color: 'from-honey-100 to-honey-200 text-honey-700', bgColor: 'bg-honey-500' },
    { key: 'high', label: 'สูง', icon: ArrowUp, color: 'from-orange-100 to-orange-200 text-orange-700', bgColor: 'bg-orange-500' },
    { key: 'critical', label: 'เร่งด่วน', icon: AlertTriangle, color: 'from-cherry-100 to-cherry-200 text-cherry-700', bgColor: 'bg-cherry-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-coffee-900">รายงาน</h1>
          <p className="text-coffee-500 mt-1">ภาพรวมงานแจ้งซ่อมทั้งหมดในระบบ</p>
        </div>
        <ExportButton />
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-coffee-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-coffee-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-coffee-900">{totalRequests}</p>
              <p className="text-sm text-coffee-500">งานทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-matcha-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-matcha-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-coffee-900">{completedRequests}</p>
              <p className="text-sm text-coffee-500">เสร็จสิ้น</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-honey-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-honey-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-coffee-900">{slaCompliance}%</p>
              <p className="text-sm text-coffee-500">SLA Compliance</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Banknote className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-coffee-900">{totalCost.toLocaleString()}</p>
              <p className="text-sm text-coffee-500">ค่าใช้จ่าย (บาท)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="card p-5">
        <h2 className="font-semibold text-coffee-900 mb-4">แยกตามความสำคัญ</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {priorityConfig.map((priority) => {
            const Icon = priority.icon
            const count = byPriority[priority.key as keyof typeof byPriority]
            const percentage = totalRequests > 0 ? ((count / totalRequests) * 100).toFixed(0) : 0
            return (
              <div key={priority.key} className={`p-4 rounded-lg ${priority.color.replace('from-', 'bg-').split(' ')[0]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{priority.label}</span>
                </div>
                <p className="text-2xl font-semibold">{count}</p>
                <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                  <div className={`h-full ${priority.bgColor} rounded-full`} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* By Category */}
        <div className="card p-5">
          <h2 className="font-semibold text-coffee-900 mb-4">แยกตามประเภท</h2>
          <div className="space-y-3">
            {sortedCategories.slice(0, 8).map(([category, count]) => {
              const percentage = totalRequests > 0 ? (count / totalRequests) * 100 : 0
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-coffee-700">{category}</span>
                    <span className="text-sm font-medium text-coffee-900">{count}</span>
                  </div>
                  <div className="h-2 bg-coffee-100 rounded-full overflow-hidden">
                    <div className="h-full bg-coffee-500 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Branch */}
        <div className="card p-5">
          <h2 className="font-semibold text-coffee-900 mb-4">แยกตามสาขา</h2>
          <div className="space-y-3">
            {sortedBranches.slice(0, 8).map(([branch, count]) => {
              const percentage = totalRequests > 0 ? (count / totalRequests) * 100 : 0
              return (
                <div key={branch}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-coffee-700">{branch}</span>
                    <span className="text-sm font-medium text-coffee-900">{count}</span>
                  </div>
                  <div className="h-2 bg-honey-100 rounded-full overflow-hidden">
                    <div className="h-full bg-honey-500 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="card p-5">
        <h2 className="font-semibold text-coffee-900 mb-4">สรุปสถานะงาน</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-coffee-50 rounded-lg">
            <p className="text-2xl font-semibold text-coffee-700">{pendingRequests}</p>
            <p className="text-sm text-coffee-500 mt-1">รอดำเนินการ</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-semibold text-blue-700">{inProgressRequests}</p>
            <p className="text-sm text-blue-600 mt-1">กำลังดำเนินการ</p>
          </div>
          <div className="text-center p-4 bg-matcha-100 rounded-lg">
            <p className="text-2xl font-semibold text-matcha-700">{completedRequests}</p>
            <p className="text-sm text-matcha-600 mt-1">เสร็จสิ้น</p>
          </div>
        </div>
      </div>

      {/* SLA Alert */}
      {slaBreach > 0 && (
        <div className="card border-l-4 border-l-cherry-500 p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cherry-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-cherry-600" />
            </div>
            <div>
              <p className="font-semibold text-coffee-900">มี {slaBreach} งานที่เกิน SLA</p>
              <p className="text-sm text-coffee-500">
                จาก {slaTotal} งานที่เสร็จสิ้นแล้ว ({((slaBreach/slaTotal)*100).toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
