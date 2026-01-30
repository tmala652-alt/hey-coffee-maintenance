import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  ChevronRight,
  Target,
  Users,
  Zap,
  Settings,
  FileText,
  Bell,
  Activity,
  Timer,
  Layers,
} from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
import { SLACountdownCompact } from '@/components/sla/SLACountdown'
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay, differenceInMinutes } from 'date-fns'
import { th } from 'date-fns/locale'
import type { Profile, Branch, MaintenanceRequest, SlaLog } from '@/types/database.types'

type ProfileWithBranch = Profile & { branch: Branch | null }
type RequestWithRelations = MaintenanceRequest & {
  branch: { name: string; code: string } | null
  created_by_profile: { name: string } | null
  assigned_user: { name: string } | null
}

function getCategoryLabel(category: string): string {
  const categories: Record<string, string> = {
    coffee_machine: 'เครื่องชงกาแฟ',
    grinder: 'เครื่องบดกาแฟ',
    refrigerator: 'ตู้เย็น/ตู้แช่',
    air_con: 'แอร์',
    electrical: 'ไฟฟ้า',
    plumbing: 'ประปา',
    other: 'อื่นๆ',
  }
  return categories[category] || category
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    coffee_machine: 'bg-amber-500',
    grinder: 'bg-orange-500',
    refrigerator: 'bg-sky-500',
    air_con: 'bg-blue-500',
    electrical: 'bg-yellow-500',
    plumbing: 'bg-cyan-500',
    other: 'bg-gray-500',
  }
  return colors[category] || 'bg-gray-500'
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, branch:branches(*)')
    .eq('id', user.id)
    .single() as { data: ProfileWithBranch | null }

  const isAdmin = profile?.role === 'admin'
  const isTechnician = profile?.role === 'technician'

  let requestsQuery = supabase
    .from('maintenance_requests')
    .select('*, branch:branches(name, code), created_by_profile:profiles!maintenance_requests_created_by_fkey(name), assigned_user:profiles!maintenance_requests_assigned_user_id_fkey(name)')
    .order('created_at', { ascending: false })

  if (!isAdmin && !isTechnician && profile?.branch_id) {
    requestsQuery = requestsQuery.eq('branch_id', profile.branch_id)
  } else if (isTechnician) {
    requestsQuery = requestsQuery.eq('assigned_user_id', user.id)
  }

  const { data: requests } = await requestsQuery as { data: RequestWithRelations[] | null }

  const todayStart = startOfDay(new Date()).toISOString()
  const todayEnd = endOfDay(new Date()).toISOString()
  const todayRequests = requests?.filter(r => r.created_at && r.created_at >= todayStart && r.created_at <= todayEnd) || []
  const todayCompleted = requests?.filter(r => r.completed_at && r.completed_at >= todayStart && r.completed_at <= todayEnd) || []

  let slaCompliance = 100
  let slaBreach = 0
  let slaAtRisk = 0
  let avgResponseTime = 0

  if (isAdmin) {
    const { data: slaLogs } = await supabase
      .from('sla_logs')
      .select('*')
      .not('resolved_at', 'is', null) as { data: SlaLog[] | null }

    slaBreach = slaLogs?.filter((s) => s.breached).length || 0
    const slaTotal = slaLogs?.length || 0
    slaCompliance = slaTotal > 0 ? ((slaTotal - slaBreach) / slaTotal) * 100 : 100

    slaAtRisk = requests?.filter((r) => {
      if (!r.due_at || !r.created_at || r.status === 'completed' || r.status === 'cancelled') return false
      const now = Date.now()
      const created = new Date(r.created_at).getTime()
      const due = new Date(r.due_at).getTime()
      const elapsed = (now - created) / (due - created)
      return elapsed >= 0.75
    }).length || 0

    const assignedRequests = requests?.filter(r => r.assigned_at && r.created_at) || []
    if (assignedRequests.length > 0) {
      const totalMinutes = assignedRequests.reduce((acc, r) => {
        return acc + differenceInMinutes(new Date(r.assigned_at!), new Date(r.created_at!))
      }, 0)
      avgResponseTime = Math.round(totalMinutes / assignedRequests.length)
    }
  }

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === 'pending').length || 0,
    inProgress: requests?.filter((r) => r.status === 'in_progress' || r.status === 'assigned').length || 0,
    completed: requests?.filter((r) => r.status === 'completed').length || 0,
    critical: requests?.filter((r) => r.priority === 'critical' && r.status !== 'completed').length || 0,
  }

  const categoryCount: Record<string, number> = {}
  requests?.forEach(r => {
    if (r.category) {
      categoryCount[r.category] = (categoryCount[r.category] || 0) + 1
    }
  })
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const weeklyData: { day: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dayStart = startOfDay(date).toISOString()
    const dayEnd = endOfDay(date).toISOString()
    const count = requests?.filter(r => r.created_at && r.created_at >= dayStart && r.created_at <= dayEnd).length || 0
    weeklyData.push({
      day: format(date, 'EEE', { locale: th }),
      count,
    })
  }
  const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count), 1)

  const thisWeekCount = weeklyData.slice(3).reduce((acc, d) => acc + d.count, 0)
  const lastWeekCount = weeklyData.slice(0, 4).reduce((acc, d) => acc + d.count, 0)
  const weekTrend = lastWeekCount > 0 ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100 : 0

  const recentRequests = requests?.slice(0, 5) || []

  const slaRiskRequests = isAdmin
    ? requests?.filter((r) => {
        if (!r.due_at || !r.created_at || r.status === 'completed' || r.status === 'cancelled') return false
        const now = Date.now()
        const created = new Date(r.created_at).getTime()
        const due = new Date(r.due_at).getTime()
        const elapsed = (now - created) / (due - created)
        return elapsed >= 0.75
      }).sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime()).slice(0, 5) || []
    : []

  const branchStats: { name: string; code: string; total: number; pending: number }[] = []
  if (isAdmin) {
    const branchCount: Record<string, { name: string; code: string; total: number; pending: number }> = {}
    requests?.forEach(r => {
      if (r.branch) {
        const key = r.branch.code
        if (!branchCount[key]) {
          branchCount[key] = { name: r.branch.name, code: r.branch.code, total: 0, pending: 0 }
        }
        branchCount[key].total++
        if (r.status === 'pending') branchCount[key].pending++
      }
    })
    branchStats.push(...Object.values(branchCount).sort((a, b) => b.total - a.total).slice(0, 5))
  }

  const today = new Date()
  const hour = today.getHours()
  let greeting = 'สวัสดี'
  if (hour >= 5 && hour < 12) {
    greeting = 'สวัสดีตอนเช้า'
  } else if (hour >= 12 && hour < 17) {
    greeting = 'สวัสดีตอนบ่าย'
  } else if (hour >= 17 && hour < 21) {
    greeting = 'สวัสดีตอนเย็น'
  } else {
    greeting = 'สวัสดีตอนค่ำ'
  }

  const quickActions = isAdmin ? [
    { href: '/requests', icon: FileText, label: 'งานทั้งหมด' },
    { href: '/admin/users', icon: Users, label: 'จัดการผู้ใช้' },
    { href: '/admin/branches', icon: Building2, label: 'จัดการสาขา' },
    { href: '/admin/equipment', icon: Settings, label: 'อุปกรณ์' },
  ] : isTechnician ? [
    { href: '/requests?status=assigned', icon: Wrench, label: 'งานของฉัน' },
    { href: '/requests?status=in_progress', icon: Activity, label: 'กำลังทำ' },
    { href: '/tech/knowledge', icon: FileText, label: 'คู่มือซ่อม' },
  ] : [
    { href: '/requests/new', icon: Plus, label: 'แจ้งซ่อมใหม่' },
    { href: '/requests', icon: FileText, label: 'งานของสาขา' },
    { href: '/requests?status=pending', icon: Clock, label: 'รอดำเนินการ' },
  ]

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Page Header - Clean Enterprise Style */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-coffee-900">
              {greeting}, {profile?.name?.split(' ')[0]}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-coffee-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(today, 'EEEE d MMMM yyyy', { locale: th })}
            </span>
            <span className="w-1 h-1 bg-coffee-300 rounded-full" />
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              {isAdmin ? 'Admin' : isTechnician ? 'Technician' : (profile?.branch as { name: string } | null)?.name || 'User'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Today's Summary */}
          <div className="flex items-center gap-4 bg-coffee-50 rounded-lg px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-honey-600" />
              <span className="text-sm text-coffee-600">วันนี้</span>
              <span className="font-semibold text-coffee-900">+{todayRequests.length}</span>
            </div>
            <div className="w-px h-4 bg-coffee-200" />
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-matcha-600" />
              <span className="text-sm text-coffee-600">เสร็จ</span>
              <span className="font-semibold text-coffee-900">{todayCompleted.length}</span>
            </div>
          </div>

          {/* CTA Button */}
          {!isTechnician && (
            <Link href="/requests/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              แจ้งซ่อมใหม่
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions - Clean Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 bg-white rounded-xl p-4 border border-coffee-100 hover:border-coffee-200 hover:bg-coffee-50/50 transition-colors"
          >
            <div className="w-10 h-10 bg-coffee-100 rounded-lg flex items-center justify-center group-hover:bg-coffee-200 transition-colors">
              <action.icon className="h-5 w-5 text-coffee-700" />
            </div>
            <span className="text-sm font-medium text-coffee-700">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Stats Cards - Clean Enterprise Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-coffee-100 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 text-coffee-600" />
            </div>
            <span className="text-sm text-coffee-500">งานทั้งหมด</span>
          </div>
          <p className="text-3xl font-semibold text-coffee-900">{stats.total}</p>
        </div>

        {/* Pending */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-honey-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-honey-600" />
            </div>
            <span className="text-sm text-coffee-500">รอดำเนินการ</span>
            {stats.pending > 0 && (
              <span className="w-2 h-2 bg-honey-500 rounded-full" />
            )}
          </div>
          <p className="text-3xl font-semibold text-coffee-900">{stats.pending}</p>
        </div>

        {/* In Progress */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-coffee-500">กำลังดำเนินการ</span>
          </div>
          <p className="text-3xl font-semibold text-coffee-900">{stats.inProgress}</p>
        </div>

        {/* Completed */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-matcha-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-matcha-600" />
            </div>
            <span className="text-sm text-coffee-500">เสร็จสิ้น</span>
          </div>
          <p className="text-3xl font-semibold text-coffee-900">{stats.completed}</p>
        </div>
      </div>

      {/* Admin Metrics - Clean Style */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SLA Compliance */}
          <div className="card p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-coffee-500">SLA Compliance</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${slaCompliance >= 90 ? 'bg-matcha-100 text-matcha-700' : slaCompliance >= 70 ? 'bg-honey-100 text-honey-700' : 'bg-cherry-100 text-cherry-700'}`}>
                {slaCompliance >= 90 ? 'ดีมาก' : slaCompliance >= 70 ? 'ปานกลาง' : 'ต้องปรับปรุง'}
              </span>
            </div>
            <p className="text-3xl font-semibold text-coffee-900">{slaCompliance.toFixed(0)}%</p>
          </div>

          {/* SLA At Risk */}
          <div className={`card p-5 border-l-4 ${slaAtRisk > 0 ? 'border-l-orange-500' : 'border-l-matcha-500'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-orange-600" />
                <span className="text-sm text-coffee-500">ใกล้เกิน SLA</span>
              </div>
              {slaAtRisk > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-100 text-orange-700">ต้องรีบ</span>
              )}
            </div>
            <p className="text-3xl font-semibold text-coffee-900">{slaAtRisk}</p>
          </div>

          {/* Avg Response Time */}
          <div className="card p-5 border-l-4 border-l-sky-500">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-sky-600" />
              <span className="text-sm text-coffee-500">เวลาตอบรับเฉลี่ย</span>
            </div>
            <p className="text-3xl font-semibold text-coffee-900">{avgResponseTime} <span className="text-lg font-normal text-coffee-500">นาที</span></p>
          </div>

          {/* Critical */}
          <div className={`card p-5 border-l-4 ${stats.critical > 0 ? 'border-l-cherry-500' : 'border-l-coffee-300'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-cherry-600" />
                <span className="text-sm text-coffee-500">งาน Critical</span>
              </div>
              {stats.critical > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-cherry-100 text-cherry-700">เร่งด่วน</span>
              )}
            </div>
            <p className="text-3xl font-semibold text-coffee-900">{stats.critical}</p>
          </div>
        </div>
      )}

      {/* SLA At Risk Alert - Clean Style */}
      {isAdmin && slaAtRisk > 0 && (
        <div className="card border-l-4 border-l-orange-500">
          <div className="p-4 border-b border-coffee-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-coffee-900">{slaAtRisk} งานใกล้เกิน SLA</p>
                  <p className="text-sm text-coffee-500">ต้องดำเนินการโดยเร็ว</p>
                </div>
              </div>
              <Link href="/requests?sla=at_risk" className="btn-secondary btn-sm">
                ดูทั้งหมด
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-coffee-100">
            {slaRiskRequests.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="flex items-center justify-between p-4 hover:bg-coffee-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PriorityBadge priority={request.priority} />
                  <span className="font-medium text-coffee-900 truncate">{request.title}</span>
                  <span className="text-sm text-coffee-500 hidden sm:inline">
                    {(request.branch as { name: string } | null)?.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <SLACountdownCompact
                    createdAt={request.created_at}
                    dueAt={request.due_at}
                    status={request.status}
                  />
                  <ChevronRight className="h-4 w-4 text-coffee-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Critical Alert for non-admin - Clean Style */}
      {stats.critical > 0 && !isAdmin && (
        <div className="card border-l-4 border-l-cherry-500 p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cherry-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-cherry-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-coffee-900">มี {stats.critical} งานเร่งด่วนที่ยังไม่เสร็จ</p>
              <p className="text-sm text-coffee-500">กรุณาดำเนินการโดยเร็วที่สุด</p>
            </div>
            <Link href="/requests?priority=critical" className="btn-danger btn-sm">
              ดูงานเร่งด่วน
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Requests */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-4 border-b border-coffee-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-coffee-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-coffee-600" />
              </div>
              <h2 className="font-semibold text-coffee-900">งานแจ้งซ่อมล่าสุด</h2>
            </div>
            <Link href="/requests" className="text-sm text-coffee-500 hover:text-coffee-700 font-medium flex items-center gap-1">
              ดูทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentRequests.length > 0 ? (
            <div className="divide-y divide-coffee-100">
              {recentRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-coffee-50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${request.priority === 'critical' ? 'bg-cherry-500' : request.priority === 'high' ? 'bg-orange-500' : 'bg-honey-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-coffee-900 truncate">{request.title}</p>
                      <PriorityBadge priority={request.priority} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-coffee-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {(request.branch as { name: string } | null)?.name}
                      </span>
                      <span className="w-1 h-1 bg-coffee-300 rounded-full" />
                      <span>
                        {formatDistanceToNow(new Date(request.created_at!), {
                          addSuffix: true,
                          locale: th,
                        })}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={request.status} />
                  <ChevronRight className="h-4 w-4 text-coffee-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-coffee-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-7 w-7 text-coffee-400" />
              </div>
              <p className="text-coffee-700 font-medium">ยังไม่มีงานแจ้งซ่อม</p>
              <p className="text-sm text-coffee-500 mt-1">เริ่มต้นสร้างงานแจ้งซ่อมแรกของคุณ</p>
              {!isTechnician && (
                <Link href="/requests/new" className="btn-primary btn-sm mt-4">
                  <Plus className="h-4 w-4" />
                  แจ้งซ่อมใหม่
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Weekly Trend */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-coffee-900">แนวโน้ม 7 วัน</h3>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${weekTrend >= 0 ? 'bg-cherry-100 text-cherry-700' : 'bg-matcha-100 text-matcha-700'}`}>
                {weekTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(weekTrend).toFixed(0)}%
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {weeklyData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-full rounded transition-colors ${i === weeklyData.length - 1 ? 'bg-coffee-600' : 'bg-coffee-200 hover:bg-coffee-300'}`}
                    style={{ height: `${Math.max((data.count / maxWeeklyCount) * 100, 8)}px` }}
                    title={`${data.count} งาน`}
                  />
                  <span className={`text-[10px] ${i === weeklyData.length - 1 ? 'text-coffee-700 font-medium' : 'text-coffee-400'}`}>{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          {topCategories.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-coffee-900 mb-4">หมวดหมู่งาน</h3>
              <div className="space-y-3">
                {topCategories.map(([category, count]) => {
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded ${getCategoryColor(category)}`} />
                          <span className="text-sm text-coffee-700">{getCategoryLabel(category)}</span>
                        </div>
                        <span className="text-sm font-medium text-coffee-900">{count}</span>
                      </div>
                      <div className="h-1.5 bg-coffee-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getCategoryColor(category)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Branch Performance (Admin) */}
          {isAdmin && branchStats.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-coffee-900">สาขา</h3>
                <Link href="/admin/branches" className="text-xs text-coffee-500 hover:text-coffee-700">
                  ดูทั้งหมด
                </Link>
              </div>
              <div className="space-y-2">
                {branchStats.map((branch) => (
                  <Link
                    key={branch.code}
                    href={`/requests?branch=${branch.code}`}
                    className="flex items-center gap-3 p-2.5 -mx-1 rounded-lg hover:bg-coffee-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-coffee-100 rounded-lg flex items-center justify-center text-xs font-medium text-coffee-700">
                      {branch.code.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-coffee-900 truncate">{branch.name}</p>
                      <p className="text-xs text-coffee-500">{branch.total} งาน</p>
                    </div>
                    {branch.pending > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-honey-100 text-honey-700 rounded">
                        {branch.pending} รอ
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Completion Rate Card */}
          {stats.total > 0 && (
            <div className="card p-5 bg-matcha-50 border-matcha-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-matcha-700 mb-1">อัตราสำเร็จ</p>
                  <p className="text-3xl font-semibold text-matcha-800">{completionRate.toFixed(0)}%</p>
                  <p className="text-xs text-matcha-600 mt-1">{stats.completed} จาก {stats.total} งาน</p>
                </div>

                {/* Progress Ring */}
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="transparent"
                      className="text-matcha-200"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="transparent"
                      strokeLinecap="round"
                      className="text-matcha-600"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 28}`,
                        strokeDashoffset: `${2 * Math.PI * 28 * (1 - (stats.completed / stats.total))}`,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-matcha-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
