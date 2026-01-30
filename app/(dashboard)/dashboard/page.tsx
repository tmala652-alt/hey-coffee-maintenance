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
  Sparkles,
  Calendar,
  Building2,
  ChevronRight,
  Target,
  BarChart3,
  Users,
  Zap,
  Coffee,
  Settings,
  FileText,
  Bell,
  Star,
  Activity,
  PieChart,
  ArrowUpRight,
  Timer,
  Award,
  Flame,
  ThumbsUp,
} from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
import { SLACountdownCompact } from '@/components/sla/SLACountdown'
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay, isToday, differenceInMinutes } from 'date-fns'
import { th } from 'date-fns/locale'
import type { Profile, Branch, MaintenanceRequest, SlaLog } from '@/types/database.types'

type ProfileWithBranch = Profile & { branch: Branch | null }
type RequestWithRelations = MaintenanceRequest & {
  branch: { name: string; code: string } | null
  created_by_profile: { name: string } | null
  assigned_user: { name: string } | null
}

// Helper function to get category label
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

// Helper function to get category icon color
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

  // Build query based on role
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

  // Get today's requests
  const todayStart = startOfDay(new Date()).toISOString()
  const todayEnd = endOfDay(new Date()).toISOString()
  const todayRequests = requests?.filter(r => r.created_at && r.created_at >= todayStart && r.created_at <= todayEnd) || []
  const todayCompleted = requests?.filter(r => r.completed_at && r.completed_at >= todayStart && r.completed_at <= todayEnd) || []

  // Get SLA logs for compliance calculation (admin only)
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

    // Count requests at SLA risk
    slaAtRisk = requests?.filter((r) => {
      if (!r.due_at || !r.created_at || r.status === 'completed' || r.status === 'cancelled') return false
      const now = Date.now()
      const created = new Date(r.created_at).getTime()
      const due = new Date(r.due_at).getTime()
      const elapsed = (now - created) / (due - created)
      return elapsed >= 0.75
    }).length || 0

    // Calculate average response time (time to first assignment)
    const assignedRequests = requests?.filter(r => r.assigned_at && r.created_at) || []
    if (assignedRequests.length > 0) {
      const totalMinutes = assignedRequests.reduce((acc, r) => {
        return acc + differenceInMinutes(new Date(r.assigned_at!), new Date(r.created_at!))
      }, 0)
      avgResponseTime = Math.round(totalMinutes / assignedRequests.length)
    }
  }

  // Calculate stats
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === 'pending').length || 0,
    inProgress: requests?.filter((r) => r.status === 'in_progress' || r.status === 'assigned').length || 0,
    completed: requests?.filter((r) => r.status === 'completed').length || 0,
    critical: requests?.filter((r) => r.priority === 'critical' && r.status !== 'completed').length || 0,
  }

  // Calculate category distribution
  const categoryCount: Record<string, number> = {}
  requests?.forEach(r => {
    if (r.category) {
      categoryCount[r.category] = (categoryCount[r.category] || 0) + 1
    }
  })
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Get weekly data for trend
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

  // Calculate week over week trend
  const thisWeekCount = weeklyData.slice(3).reduce((acc, d) => acc + d.count, 0)
  const lastWeekCount = weeklyData.slice(0, 4).reduce((acc, d) => acc + d.count, 0)
  const weekTrend = lastWeekCount > 0 ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100 : 0

  const recentRequests = requests?.slice(0, 5) || []

  // Get requests at SLA risk for admin display
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

  // Get branch stats for admin
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

  // Get current date info
  const today = new Date()
  const hour = today.getHours()
  let greeting = 'สวัสดี'
  let greetingIcon = <Coffee className="h-5 w-5" />
  if (hour >= 5 && hour < 12) {
    greeting = 'สวัสดีตอนเช้า'
    greetingIcon = <Coffee className="h-5 w-5" />
  } else if (hour >= 12 && hour < 17) {
    greeting = 'สวัสดีตอนบ่าย'
    greetingIcon = <Sparkles className="h-5 w-5" />
  } else if (hour >= 17 && hour < 21) {
    greeting = 'สวัสดีตอนเย็น'
    greetingIcon = <Star className="h-5 w-5" />
  } else {
    greeting = 'สวัสดีตอนค่ำ'
    greetingIcon = <Star className="h-5 w-5" />
  }

  // Quick actions based on role
  const quickActions = isAdmin ? [
    { href: '/requests', icon: FileText, label: 'งานทั้งหมด', color: 'bg-coffee-500' },
    { href: '/admin/users', icon: Users, label: 'จัดการผู้ใช้', color: 'bg-blue-500' },
    { href: '/admin/branches', icon: Building2, label: 'จัดการสาขา', color: 'bg-matcha-500' },
    { href: '/admin/equipment', icon: Settings, label: 'อุปกรณ์', color: 'bg-orange-500' },
  ] : isTechnician ? [
    { href: '/requests?status=assigned', icon: Wrench, label: 'งานของฉัน', color: 'bg-blue-500' },
    { href: '/requests?status=in_progress', icon: Activity, label: 'กำลังทำ', color: 'bg-orange-500' },
    { href: '/tech/knowledge', icon: FileText, label: 'คู่มือซ่อม', color: 'bg-purple-500' },
  ] : [
    { href: '/requests/new', icon: Plus, label: 'แจ้งซ่อมใหม่', color: 'bg-matcha-500' },
    { href: '/requests', icon: FileText, label: 'งานของสาขา', color: 'bg-coffee-500' },
    { href: '/requests?status=pending', icon: Clock, label: 'รอดำเนินการ', color: 'bg-honey-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-coffee-800 via-coffee-700 to-coffee-900 rounded-3xl p-6 lg:p-8 text-white shadow-2xl shadow-coffee-900/30">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-honey-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-float" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-matcha-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-breathe" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-coffee-200 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{format(today, 'EEEE d MMMM yyyy', { locale: th })}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                {greetingIcon}
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">
                  {greeting}, {profile?.name?.split(' ')[0]}
                </h1>
                <p className="text-coffee-200 text-sm">
                  {isAdmin ? 'Admin Dashboard' : isTechnician ? 'Technician Dashboard' : `สาขา ${(profile?.branch as { name: string } | null)?.name || ''}`}
                </p>
              </div>
            </div>

            {/* Today Summary */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                <Bell className="h-4 w-4 text-honey-400" />
                <span className="text-sm">วันนี้ +{todayRequests.length} งาน</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-lg px-3 py-1.5">
                <CheckCircle className="h-4 w-4 text-matcha-400" />
                <span className="text-sm">เสร็จ {todayCompleted.length} งาน</span>
              </div>
            </div>
          </div>

          {!isTechnician && (
            <Link href="/requests/new" className="btn bg-white text-coffee-800 hover:bg-cream-50 shadow-xl group self-start lg:self-center">
              <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
              แจ้งซ่อมใหม่
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
        {quickActions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className={`quick-action relative overflow-hidden animate-scale-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-honey-100/0 via-honey-100/0 to-honey-100/0 group-hover:from-honey-100/50 group-hover:via-honey-100/30 group-hover:to-transparent transition-all duration-500 rounded-2xl" />
            <div className={`quick-action-icon ${action.color} text-white shadow-lg relative`}>
              <action.icon className="h-6 w-6 relative z-10" />
              {/* Icon glow */}
              <div className={`absolute inset-0 ${action.color} rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />
            </div>
            <span className="text-sm font-medium text-coffee-700 text-center group-hover:text-coffee-900 transition-colors relative z-10">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card group relative overflow-hidden animate-slide-up stagger-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-coffee-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-coffee-100 to-coffee-200">
              <Wrench className="h-6 w-6 text-coffee-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900 animate-count-up">{stats.total}</p>
              <p className="text-sm text-coffee-500 font-medium">งานทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden animate-slide-up stagger-2">
          <div className="absolute top-0 right-0 w-20 h-20 bg-honey-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-honey-100 to-honey-200">
              <Clock className="h-6 w-6 text-honey-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900 animate-count-up">{stats.pending}</p>
              <p className="text-sm text-coffee-500 font-medium">รอดำเนินการ</p>
            </div>
          </div>
          {stats.pending > 0 && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-honey-500 rounded-full animate-pulse" />
          )}
        </div>

        <div className="stat-card group relative overflow-hidden animate-slide-up stagger-3">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200">
              <Activity className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900 animate-count-up">{stats.inProgress}</p>
              <p className="text-sm text-coffee-500 font-medium">กำลังดำเนินการ</p>
            </div>
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden animate-slide-up stagger-4">
          <div className="absolute top-0 right-0 w-20 h-20 bg-matcha-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-matcha-100 to-matcha-200">
              <CheckCircle className="h-6 w-6 text-matcha-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900 animate-count-up">{stats.completed}</p>
              <p className="text-sm text-coffee-500 font-medium">เสร็จสิ้น</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Metrics Row */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${slaCompliance >= 90 ? 'bg-matcha-100 text-matcha-700' : slaCompliance >= 70 ? 'bg-honey-100 text-honey-700' : 'bg-cherry-100 text-cherry-700'}`}>
                {slaCompliance >= 90 ? 'ดีมาก' : slaCompliance >= 70 ? 'ปานกลาง' : 'ต้องปรับปรุง'}
              </span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{slaCompliance.toFixed(1)}%</p>
            <p className="text-sm text-purple-600">SLA Compliance</p>
          </div>

          <div className={`rounded-2xl p-4 border ${slaAtRisk > 0 ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200' : 'bg-gradient-to-br from-matcha-50 to-matcha-100 border-matcha-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <Timer className={`h-5 w-5 ${slaAtRisk > 0 ? 'text-orange-600' : 'text-matcha-600'}`} />
              {slaAtRisk > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-200 text-orange-700 animate-pulse">
                  ต้องรีบ!
                </span>
              )}
            </div>
            <p className={`text-3xl font-bold ${slaAtRisk > 0 ? 'text-orange-900' : 'text-matcha-900'}`}>{slaAtRisk}</p>
            <p className={`text-sm ${slaAtRisk > 0 ? 'text-orange-600' : 'text-matcha-600'}`}>ใกล้เกิน SLA</p>
          </div>

          <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl p-4 border border-sky-200">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-sky-600" />
            </div>
            <p className="text-3xl font-bold text-sky-900">{avgResponseTime}<span className="text-lg">นาที</span></p>
            <p className="text-sm text-sky-600">เวลาตอบรับเฉลี่ย</p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 border border-pink-200">
            <div className="flex items-center justify-between mb-2">
              <Flame className="h-5 w-5 text-pink-600" />
              {stats.critical > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cherry-200 text-cherry-700 animate-pulse">
                  เร่งด่วน
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-pink-900">{stats.critical}</p>
            <p className="text-sm text-pink-600">งาน Critical</p>
          </div>
        </div>
      )}

      {/* SLA At Risk Alert */}
      {isAdmin && slaAtRisk > 0 && (
        <div className="bg-gradient-to-r from-orange-50 via-orange-50 to-cherry-50 border-2 border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 animate-bounce">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-orange-700 text-lg">
                {slaAtRisk} งานที่ SLA ใกล้หรือเกินกำหนด
              </p>
              <p className="text-sm text-orange-600">ต้องดำเนินการโดยเร็ว</p>
            </div>
            <Link href="/requests?sla=at_risk" className="btn-danger btn-sm">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="space-y-2">
            {slaRiskRequests.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="flex items-center justify-between p-3 bg-white/80 rounded-lg hover:bg-white transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PriorityBadge priority={request.priority} />
                  <span className="font-medium text-coffee-900 truncate">{request.title}</span>
                  <span className="text-sm text-coffee-500 hidden sm:inline">
                    {(request.branch as { name: string } | null)?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <SLACountdownCompact
                    createdAt={request.created_at}
                    dueAt={request.due_at}
                    status={request.status}
                  />
                  <ChevronRight className="h-4 w-4 text-coffee-300 group-hover:text-coffee-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Critical Alert */}
      {stats.critical > 0 && !isAdmin && (
        <div className="bg-gradient-to-r from-cherry-50 to-cherry-100 border-2 border-cherry-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-cherry-500 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-cherry-700 text-lg">
              มี {stats.critical} งานเร่งด่วนที่ยังไม่เสร็จ
            </p>
            <p className="text-sm text-cherry-600">กรุณาดำเนินการโดยเร็วที่สุด</p>
          </div>
          <Link href="/requests?priority=critical" className="btn-danger w-full sm:w-auto">
            ดูงานเร่งด่วน
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Requests - 2 columns */}
        <div className="lg:col-span-2 card-glass overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-coffee-100/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-honey-100 to-honey-200 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-honey-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-coffee-900">งานแจ้งซ่อมล่าสุด</h2>
                <p className="text-xs text-coffee-500">อัพเดทล่าสุด</p>
              </div>
            </div>
            <Link href="/requests" className="btn-ghost btn-sm group">
              ดูทั้งหมด
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {recentRequests.length > 0 ? (
            <div className="divide-y divide-coffee-100/50">
              {recentRequests.map((request, index) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-cream-50/50 hover:to-transparent transition-all duration-300 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${request.priority === 'critical' ? 'bg-cherry-500 animate-pulse' : request.priority === 'high' ? 'bg-orange-500' : 'bg-honey-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-coffee-900 truncate group-hover:text-coffee-700 transition-colors">
                        {request.title}
                      </p>
                      <PriorityBadge priority={request.priority} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-coffee-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {(request.branch as { name: string } | null)?.name}
                      </span>
                      <span className="text-coffee-300">•</span>
                      <span>
                        {formatDistanceToNow(new Date(request.created_at!), {
                          addSuffix: true,
                          locale: th,
                        })}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={request.status} />
                  <ChevronRight className="h-5 w-5 text-coffee-300 group-hover:text-coffee-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-cream-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-8 w-8 text-coffee-300" />
              </div>
              <p className="text-coffee-500 font-medium">ยังไม่มีงานแจ้งซ่อม</p>
              <p className="text-sm text-coffee-400 mt-1">เริ่มต้นสร้างงานแจ้งซ่อมแรกของคุณ</p>
              {!isTechnician && (
                <Link href="/requests/new" className="btn-primary mt-4">
                  <Plus className="h-4 w-4" />
                  แจ้งซ่อมใหม่
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Weekly Trend */}
          <div className="card-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-coffee-600" />
                <h3 className="font-semibold text-coffee-900">แนวโน้มรายสัปดาห์</h3>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${weekTrend >= 0 ? 'bg-cherry-100 text-cherry-700' : 'bg-matcha-100 text-matcha-700'}`}>
                {weekTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(weekTrend).toFixed(0)}%
              </div>
            </div>
            <div className="flex items-end gap-1 h-24">
              {weeklyData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  <div className="relative w-full">
                    <div
                      className={`w-full rounded-t transition-all duration-500 cursor-pointer group-hover/bar:opacity-80 ${i === weeklyData.length - 1 ? 'bg-gradient-to-t from-coffee-600 to-coffee-400 shadow-lg shadow-coffee-400/30' : 'bg-coffee-200 group-hover/bar:bg-coffee-300'}`}
                      style={{ height: `${(data.count / maxWeeklyCount) * 100}%`, minHeight: data.count > 0 ? '8px' : '4px' }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-coffee-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {data.count} งาน
                    </div>
                  </div>
                  <span className={`text-[10px] transition-colors ${i === weeklyData.length - 1 ? 'text-coffee-600 font-medium' : 'text-coffee-400'}`}>{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          {topCategories.length > 0 && (
            <div className="card-glass p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-coffee-600" />
                <h3 className="font-semibold text-coffee-900">หมวดหมู่งาน</h3>
              </div>
              <div className="space-y-2">
                {topCategories.map(([category, count], index) => {
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                  return (
                    <div key={category} className="group">
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)} group-hover:scale-125 transition-transform`} />
                        <span className="flex-1 text-sm text-coffee-700 truncate group-hover:text-coffee-900 transition-colors">{getCategoryLabel(category)}</span>
                        <span className="text-sm font-medium text-coffee-900">{count}</span>
                      </div>
                      <div className="h-1.5 bg-coffee-100 rounded-full overflow-hidden ml-6">
                        <div
                          className={`h-full rounded-full ${getCategoryColor(category)} transition-all duration-700`}
                          style={{ width: `${percentage}%`, animationDelay: `${index * 0.1}s` }}
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
            <div className="card-glass p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-coffee-600" />
                  <h3 className="font-semibold text-coffee-900">สาขา</h3>
                </div>
                <Link href="/admin/branches" className="text-xs text-coffee-500 hover:text-coffee-700">
                  ดูทั้งหมด
                </Link>
              </div>
              <div className="space-y-2">
                {branchStats.map((branch, index) => (
                  <Link
                    key={branch.code}
                    href={`/requests?branch=${branch.code}`}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-coffee-50 transition-all group"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-lg flex items-center justify-center text-xs font-bold text-coffee-600 group-hover:scale-110 transition-transform">
                      {branch.code.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-coffee-900 truncate group-hover:text-coffee-700">{branch.name}</p>
                      <p className="text-xs text-coffee-500">{branch.total} งาน</p>
                    </div>
                    {branch.pending > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-honey-100 text-honey-700 rounded-full animate-pulse">
                        {branch.pending} รอ
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-coffee-300 group-hover:text-coffee-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Performance Badge with Circular Progress */}
          {stats.total > 0 && (
            <div className="bg-gradient-to-br from-matcha-50 via-matcha-100 to-emerald-50 rounded-2xl p-5 border border-matcha-200 animate-gradient">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-matcha-600 mb-1">อัตราสำเร็จ</p>
                  <p className="text-3xl font-bold text-matcha-800 animate-count-up">
                    {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-xs text-matcha-500 mt-1">{stats.completed} จาก {stats.total} งาน</p>
                </div>
                {/* Circular Progress Ring */}
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="transparent"
                      className="text-matcha-200"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="transparent"
                      strokeLinecap="round"
                      className="text-matcha-500"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 28}`,
                        strokeDashoffset: `${2 * Math.PI * 28 * (1 - (stats.completed / stats.total))}`,
                        transition: 'stroke-dashoffset 1s ease-out',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Award className="h-5 w-5 text-matcha-600" />
                  </div>
                </div>
              </div>
              {/* Motivational message */}
              {stats.completed / stats.total >= 0.8 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-matcha-700 bg-matcha-200/50 rounded-lg px-3 py-2">
                  <ThumbsUp className="h-4 w-4" />
                  <span>ยอดเยี่ยม! ทำได้ดีมาก</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
