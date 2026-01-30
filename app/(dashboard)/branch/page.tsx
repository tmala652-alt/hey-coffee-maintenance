import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Wrench,
  ArrowRight,
  Building2,
} from 'lucide-react'
import { SLACountdownCompact } from '@/components/sla/SLACountdown'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { th } from 'date-fns/locale'
import type { Profile, MaintenanceRequest, Branch } from '@/types/database.types'

type RequestWithBranch = MaintenanceRequest & {
  branch: Branch | null
  assigned_user: { name: string } | null
}

export default async function BranchDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = (await supabase
    .from('profiles')
    .select('*, branch:branches(*)')
    .eq('id', user.id)
    .single()) as { data: (Profile & { branch: Branch | null }) | null }

  // Only branch staff can access this page (admin/manager use their own dashboards)
  if (profile?.role !== 'branch') {
    redirect('/dashboard')
  }

  if (!profile.branch_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Building2 className="h-16 w-16 text-coffee-300 mb-4" />
        <h2 className="text-xl font-semibold text-coffee-700">ไม่พบสาขาที่เชื่อมโยง</h2>
        <p className="text-coffee-500">กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดสาขา</p>
      </div>
    )
  }

  // Get branch requests
  const { data: requests } = (await supabase
    .from('maintenance_requests')
    .select(`
      *,
      branch:branches(*),
      assigned_user:profiles!maintenance_requests_assigned_user_id_fkey(name)
    `)
    .eq('branch_id', profile.branch_id)
    .order('created_at', { ascending: false })) as { data: RequestWithBranch[] | null }

  // Calculate stats
  const activeRequests = requests?.filter(
    (r) => r.status !== 'completed' && r.status !== 'cancelled'
  ) || []

  const thisMonth = requests?.filter((r) => {
    const created = new Date(r.created_at!)
    const start = startOfMonth(new Date())
    const end = endOfMonth(new Date())
    return created >= start && created <= end
  }) || []

  const completedThisMonth = thisMonth.filter((r) => r.status === 'completed').length
  const totalThisMonth = thisMonth.length

  // Average resolution time (in hours)
  const completedWithSla = requests?.filter(
    (r) => r.status === 'completed' && r.created_at && r.sla_hours
  ) || []
  const avgResolutionTime =
    completedWithSla.length > 0
      ? completedWithSla.reduce((sum, r) => sum + (r.sla_hours || 0), 0) /
        completedWithSla.length
      : 0

  // Pending requests
  const pendingCount = requests?.filter((r) => r.status === 'pending').length || 0
  const inProgressCount = requests?.filter(
    (r) => r.status === 'in_progress' || r.status === 'assigned'
  ).length || 0

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'สวัสดีตอนเช้า'
    if (hour < 17) return 'สวัสดีตอนบ่าย'
    return 'สวัสดีตอนเย็น'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900">
            {getGreeting()}, {profile?.name}
          </h1>
          <p className="text-coffee-600 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {profile.branch?.name} ({profile.branch?.code})
          </p>
        </div>
        <Link href="/requests/new" className="btn-primary">
          <Plus className="h-5 w-5" />
          แจ้งซ่อมใหม่
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-coffee-100 to-coffee-200">
              <Wrench className="h-5 w-5 text-coffee-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{activeRequests.length}</p>
              <p className="text-sm text-coffee-500">งานที่ดำเนินการ</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-matcha-100 to-matcha-200">
              <CheckCircle className="h-5 w-5 text-matcha-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{completedThisMonth}</p>
              <p className="text-sm text-coffee-500">เสร็จเดือนนี้</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-honey-100 to-honey-200">
              <Clock className="h-5 w-5 text-honey-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{pendingCount}</p>
              <p className="text-sm text-coffee-500">รอดำเนินการ</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200">
              <TrendingUp className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">
                {avgResolutionTime.toFixed(1)} ชม.
              </p>
              <p className="text-sm text-coffee-500">เฉลี่ยแก้ไข</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Requests */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-coffee-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-coffee-500" />
            งานของสาขา
          </h2>
          <Link href="/requests" className="text-sm text-coffee-500 hover:text-coffee-700 flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {activeRequests.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-matcha-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-coffee-700 mb-2">ไม่มีงานค้าง</h3>
            <p className="text-coffee-500 mb-4">สาขาของคุณไม่มีงานซ่อมที่กำลังดำเนินการ</p>
            <Link href="/requests/new" className="btn-primary">
              <Plus className="h-5 w-5" />
              แจ้งซ่อมใหม่
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRequests.slice(0, 10).map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={request.priority} />
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="font-medium text-coffee-900 truncate">{request.title}</p>
                  <p className="text-sm text-coffee-500">
                    {request.category} •{' '}
                    {request.assigned_user?.name || 'ยังไม่มอบหมาย'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <SLACountdownCompact
                    createdAt={request.created_at}
                    dueAt={request.due_at}
                    status={request.status}
                  />
                  <span className="text-xs text-coffee-400">
                    {format(new Date(request.created_at!), 'd MMM', { locale: th })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Pending Alert */}
        {pendingCount > 0 && (
          <div className="card p-4 border-l-4 border-honey-500">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-honey-500" />
              <div>
                <p className="font-semibold text-coffee-900">
                  {pendingCount} งานรอดำเนินการ
                </p>
                <p className="text-sm text-coffee-500">รอการมอบหมายจากผู้ดูแล</p>
              </div>
            </div>
          </div>
        )}

        {/* In Progress */}
        {inProgressCount > 0 && (
          <div className="card p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-semibold text-coffee-900">
                  {inProgressCount} งานกำลังดำเนินการ
                </p>
                <p className="text-sm text-coffee-500">มีช่างกำลังดำเนินการแก้ไข</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
