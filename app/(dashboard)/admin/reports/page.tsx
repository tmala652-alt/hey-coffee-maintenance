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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-700/30">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          รายงาน
        </h1>
        <p className="text-coffee-600 mt-1">ภาพรวมงานแจ้งซ่อมทั้งหมดในระบบ</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="stat-card group">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-coffee-100 to-coffee-200">
              <BarChart3 className="h-6 w-6 text-coffee-700" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-coffee-900">{totalRequests}</p>
              <p className="text-sm text-coffee-500 font-medium">งานทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-matcha-100 to-matcha-200">
              <CheckCircle className="h-6 w-6 text-matcha-700" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-coffee-900">{completedRequests}</p>
              <p className="text-sm text-coffee-500 font-medium">เสร็จสิ้น</p>
            </div>
          </div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-honey-100 to-honey-200">
              <Target className="h-6 w-6 text-honey-700" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-coffee-900">{slaCompliance}%</p>
              <p className="text-sm text-coffee-500 font-medium">SLA Compliance</p>
            </div>
          </div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200">
              <Banknote className="h-6 w-6 text-blue-700" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-coffee-900">
                {totalCost.toLocaleString()}
              </p>
              <p className="text-sm text-coffee-500 font-medium">ค่าใช้จ่าย (บาท)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="card-glass p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
            <PieChart className="h-5 w-5 text-orange-700" />
          </div>
          <h2 className="text-xl font-bold text-coffee-900">แยกตามความสำคัญ</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {priorityConfig.map((priority) => {
            const Icon = priority.icon
            const count = byPriority[priority.key as keyof typeof byPriority]
            const percentage = totalRequests > 0 ? ((count / totalRequests) * 100).toFixed(0) : 0
            return (
              <div
                key={priority.key}
                className={`relative p-5 rounded-2xl bg-gradient-to-br ${priority.color} overflow-hidden group hover:shadow-lg transition-all duration-300`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <Icon className="h-6 w-6 mb-3 opacity-80" />
                  <p className="text-4xl font-bold mb-1">{count}</p>
                  <p className="text-sm font-medium opacity-80">{priority.label}</p>
                  <div className="mt-3 h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <div className={`h-full ${priority.bgColor} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Category */}
        <div className="card-glass p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-xl flex items-center justify-center">
              <Tag className="h-5 w-5 text-coffee-700" />
            </div>
            <h2 className="text-xl font-bold text-coffee-900">แยกตามประเภท</h2>
          </div>
          <div className="space-y-4">
            {sortedCategories.slice(0, 8).map(([category, count], index) => {
              const percentage = totalRequests > 0 ? (count / totalRequests) * 100 : 0
              return (
                <div key={category} className="group" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-coffee-700">{category}</span>
                    <span className="text-sm font-bold text-coffee-900 bg-coffee-100 px-2 py-0.5 rounded-lg">{count}</span>
                  </div>
                  <div className="h-3 bg-cream-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-coffee-400 to-coffee-600 rounded-full transition-all duration-500 group-hover:from-coffee-500 group-hover:to-coffee-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Branch */}
        <div className="card-glass p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-honey-100 to-honey-200 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-honey-700" />
            </div>
            <h2 className="text-xl font-bold text-coffee-900">แยกตามสาขา</h2>
          </div>
          <div className="space-y-4">
            {sortedBranches.slice(0, 8).map(([branch, count], index) => {
              const percentage = totalRequests > 0 ? (count / totalRequests) * 100 : 0
              return (
                <div key={branch} className="group" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-coffee-700">{branch}</span>
                    <span className="text-sm font-bold text-coffee-900 bg-honey-100 px-2 py-0.5 rounded-lg">{count}</span>
                  </div>
                  <div className="h-3 bg-cream-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-honey-400 to-honey-600 rounded-full transition-all duration-500 group-hover:from-honey-500 group-hover:to-honey-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="card-glass p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
            <Clock className="h-5 w-5 text-blue-700" />
          </div>
          <h2 className="text-xl font-bold text-coffee-900">สรุปสถานะงาน</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-5 bg-gradient-to-br from-cream-100 to-cream-200 rounded-2xl">
            <p className="text-3xl font-bold text-coffee-700">{pendingRequests}</p>
            <p className="text-sm font-medium text-coffee-600 mt-1">รอดำเนินการ</p>
          </div>
          <div className="text-center p-5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl">
            <p className="text-3xl font-bold text-blue-700">{inProgressRequests}</p>
            <p className="text-sm font-medium text-blue-600 mt-1">กำลังดำเนินการ</p>
          </div>
          <div className="text-center p-5 bg-gradient-to-br from-matcha-100 to-matcha-200 rounded-2xl">
            <p className="text-3xl font-bold text-matcha-700">{completedRequests}</p>
            <p className="text-sm font-medium text-matcha-600 mt-1">เสร็จสิ้น</p>
          </div>
        </div>
      </div>

      {/* SLA Alert */}
      {slaBreach > 0 && (
        <div className="bg-gradient-to-r from-cherry-50 to-cherry-100 border-2 border-cherry-200 rounded-2xl p-6 animate-slide-down">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-cherry-500 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-cherry-700 text-lg">
                มี {slaBreach} งานที่เกิน SLA
              </p>
              <p className="text-sm text-cherry-600">
                จาก {slaTotal} งานที่เสร็จสิ้นแล้ว ({((slaBreach/slaTotal)*100).toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
