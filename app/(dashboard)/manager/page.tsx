import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  ClipboardList,
  AlertTriangle,
  Clock,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import { SLACountdownCompact } from '@/components/sla/SLACountdown'
import { SLAProgressBar } from '@/components/sla/SLABadge'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
import type { Profile, MaintenanceRequest, SlaLog } from '@/types/database.types'

type RequestWithBranch = MaintenanceRequest & {
  branch: { name: string; code: string } | null
  assigned_user: { name: string } | null
}

export default async function ManagerDashboardPage() {
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

  // Manager and Admin can access this page
  if (profile?.role !== 'manager' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get all technicians
  const { data: technicians } = (await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'technician')
    .order('name')) as { data: Profile[] | null }

  // Get active requests
  const { data: activeRequests } = (await supabase
    .from('maintenance_requests')
    .select(`
      *,
      branch:branches(name, code),
      assigned_user:profiles!maintenance_requests_assigned_user_id_fkey(name)
    `)
    .in('status', ['pending', 'assigned', 'in_progress'])
    .order('created_at', { ascending: false })) as { data: RequestWithBranch[] | null }

  // Get SLA logs for compliance calculation
  const { data: slaLogs } = (await supabase
    .from('sla_logs')
    .select('*')
    .not('resolved_at', 'is', null)) as { data: SlaLog[] | null }

  // Calculate stats
  const totalTechnicians = technicians?.length || 0
  const activeJobs = activeRequests?.filter(
    (r) => r.status === 'in_progress' || r.status === 'assigned'
  ).length || 0
  const pendingApprovals = activeRequests?.filter(
    (r) => r.status === 'pending'
  ).length || 0

  // SLA at risk (warning, critical, or breached)
  const slaAtRisk = activeRequests?.filter((r) => {
    if (!r.due_at || !r.created_at) return false
    const now = Date.now()
    const created = new Date(r.created_at).getTime()
    const due = new Date(r.due_at).getTime()
    const elapsed = (now - created) / (due - created)
    return elapsed >= 0.75
  }).length || 0

  // SLA compliance
  const slaBreach = slaLogs?.filter((s) => s.breached).length || 0
  const slaTotal = slaLogs?.length || 0
  const slaCompliance = slaTotal > 0 ? ((slaTotal - slaBreach) / slaTotal) * 100 : 100

  // Technician workload
  const techWorkload = technicians?.map((tech) => {
    const assignedJobs = activeRequests?.filter(
      (r) => r.assigned_user_id === tech.id
    ).length || 0
    return { ...tech, assignedJobs }
  }).sort((a, b) => b.assignedJobs - a.assignedJobs) || []

  // SLA urgent requests (sorted by urgency)
  const urgentRequests = activeRequests
    ?.filter((r) => r.due_at && r.status !== 'completed')
    .sort((a, b) => {
      const aDue = new Date(a.due_at!).getTime()
      const bDue = new Date(b.due_at!).getTime()
      return aDue - bDue
    })
    .slice(0, 5) || []

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'สวัสดีตอนเช้า'
    if (hour < 17) return 'สวัสดีตอนบ่าย'
    return 'สวัสดีตอนเย็น'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coffee-900">
          {getGreeting()}, {profile?.name}
        </h1>
        <p className="text-coffee-600">ภาพรวมทีมและการจัดการงาน</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{totalTechnicians}</p>
              <p className="text-sm text-coffee-500">ช่างเทคนิค</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-honey-100 to-honey-200">
              <ClipboardList className="h-5 w-5 text-honey-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{activeJobs}</p>
              <p className="text-sm text-coffee-500">งานที่กำลังทำ</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-orange-100 to-orange-200">
              <Clock className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{pendingApprovals}</p>
              <p className="text-sm text-coffee-500">รอมอบหมาย</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-matcha-100 to-matcha-200">
              <Target className="h-5 w-5 text-matcha-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{slaCompliance.toFixed(1)}%</p>
              <p className="text-sm text-coffee-500">SLA Compliance</p>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Alert */}
      {slaAtRisk > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-cherry-50 border-2 border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-orange-700">
                มี {slaAtRisk} งานที่ใกล้หรือเกิน SLA
              </p>
              <p className="text-sm text-orange-600">ต้องดำเนินการโดยเร็ว</p>
            </div>
            <Link href="/requests?filter=sla_risk" className="btn-sm bg-orange-500 text-white hover:bg-orange-600">
              ดูรายละเอียด
            </Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Technician Workload */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-coffee-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              ภาระงานช่าง
            </h2>
          </div>
          <div className="space-y-3">
            {techWorkload.slice(0, 6).map((tech) => (
              <div key={tech.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {tech.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-coffee-900 truncate">
                    {tech.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-coffee-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, tech.assignedJobs * 20)}%` }}
                      />
                    </div>
                    <span className="text-xs text-coffee-500 w-12">
                      {tech.assignedJobs} งาน
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {techWorkload.length === 0 && (
              <p className="text-sm text-coffee-400 text-center py-4">
                ไม่มีช่างเทคนิคในระบบ
              </p>
            )}
          </div>
        </div>

        {/* SLA Monitor */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-coffee-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              SLA Monitor
            </h2>
            <Link href="/requests" className="text-sm text-coffee-500 hover:text-coffee-700 flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {urgentRequests.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="block p-3 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-coffee-900 line-clamp-1">
                    {request.title}
                  </p>
                  <PriorityBadge priority={request.priority} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-coffee-500">
                    {request.branch?.code} • {request.assigned_user?.name || 'ยังไม่มอบหมาย'}
                  </span>
                  <SLACountdownCompact
                    createdAt={request.created_at}
                    dueAt={request.due_at}
                    status={request.status}
                  />
                </div>
                <SLAProgressBar
                  createdAt={request.created_at}
                  dueAt={request.due_at}
                  status={request.status}
                  className="mt-2"
                />
              </Link>
            ))}
            {urgentRequests.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-matcha-400 mx-auto mb-2" />
                <p className="text-sm text-coffee-500">ไม่มีงานที่ต้องติดตาม SLA</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Assignments */}
      {pendingApprovals > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-coffee-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-honey-500" />
              รอมอบหมายงาน
            </h2>
            <Link href="/requests?status=pending" className="text-sm text-coffee-500 hover:text-coffee-700 flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRequests
              ?.filter((r) => r.status === 'pending')
              .slice(0, 6)
              .map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="p-4 rounded-xl border border-coffee-100 hover:border-coffee-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PriorityBadge priority={request.priority} />
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="font-medium text-coffee-900 line-clamp-1 mb-1">
                    {request.title}
                  </p>
                  <p className="text-xs text-coffee-500">
                    {request.branch?.name} • {request.category}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
