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
  Sparkles,
  Calendar,
  Building2,
  ChevronRight,
} from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
import { formatDistanceToNow, format } from 'date-fns'
import { th } from 'date-fns/locale'
import type { Profile, Branch, MaintenanceRequest } from '@/types/database.types'

type ProfileWithBranch = Profile & { branch: Branch | null }
type RequestWithRelations = MaintenanceRequest & {
  branch: { name: string } | null
  created_by_profile: { name: string } | null
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
    .select('*, branch:branches(name), created_by_profile:profiles!maintenance_requests_created_by_fkey(name)')
    .order('created_at', { ascending: false })

  if (!isAdmin && !isTechnician && profile?.branch_id) {
    requestsQuery = requestsQuery.eq('branch_id', profile.branch_id)
  } else if (isTechnician) {
    requestsQuery = requestsQuery.eq('assigned_user_id', user.id)
  }

  const { data: requests } = await requestsQuery as { data: RequestWithRelations[] | null }

  // Calculate stats
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === 'pending').length || 0,
    inProgress: requests?.filter((r) => r.status === 'in_progress' || r.status === 'assigned').length || 0,
    completed: requests?.filter((r) => r.status === 'completed').length || 0,
    critical: requests?.filter((r) => r.priority === 'critical' && r.status !== 'completed').length || 0,
  }

  const recentRequests = requests?.slice(0, 5) || []

  // Get current date info
  const today = new Date()
  const greeting = today.getHours() < 12 ? 'สวัสดีตอนเช้า' : today.getHours() < 18 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-coffee-500 mb-2">
            <Calendar className="h-4 w-4" />
            <span>{format(today, 'EEEE d MMMM yyyy', { locale: th })}</span>
          </div>
          <h1 className="text-3xl font-bold text-coffee-900 mb-1">
            {greeting}, {profile?.name?.split(' ')[0]}
          </h1>
          <p className="text-coffee-600 flex items-center gap-2">
            {isAdmin ? (
              <>
                <Sparkles className="h-4 w-4 text-honey-500" />
                ภาพรวมงานแจ้งซ่อมทั้งหมดในระบบ
              </>
            ) : isTechnician ? (
              <>
                <Wrench className="h-4 w-4 text-blue-500" />
                งานที่ได้รับมอบหมายให้คุณ
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 text-matcha-500" />
                สาขา {(profile?.branch as { name: string } | null)?.name || ''}
              </>
            )}
          </p>
        </div>
        {!isTechnician && (
          <Link href="/requests/new" className="btn-primary group self-start lg:self-center">
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            แจ้งซ่อมใหม่
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="stat-card group">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-coffee-100 to-coffee-200">
              <Wrench className="h-6 w-6 text-coffee-700" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-coffee-900">{stats.total}</p>
              <p className="text-sm text-coffee-500 font-medium">งานทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-honey-100 to-honey-200">
              <Clock className="h-6 w-6 text-honey-700" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-coffee-900">{stats.pending}</p>
              <p className="text-sm text-coffee-500 font-medium">รอดำเนินการ</p>
            </div>
          </div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200">
              <TrendingUp className="h-6 w-6 text-blue-700" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-coffee-900">{stats.inProgress}</p>
              <p className="text-sm text-coffee-500 font-medium">กำลังดำเนินการ</p>
            </div>
          </div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-matcha-100 to-matcha-200">
              <CheckCircle className="h-6 w-6 text-matcha-700" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-coffee-900">{stats.completed}</p>
              <p className="text-sm text-coffee-500 font-medium">เสร็จสิ้น</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alert */}
      {stats.critical > 0 && (
        <div className="bg-gradient-to-r from-cherry-50 to-cherry-100 border-2 border-cherry-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-slide-down">
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

      {/* Recent Requests */}
      <div className="card-glass overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-coffee-100/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-honey-100 to-honey-200 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-honey-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-coffee-900">งานแจ้งซ่อมล่าสุด</h2>
              <p className="text-sm text-coffee-500">อัพเดทล่าสุด</p>
            </div>
          </div>
          <Link href="/requests" className="btn-ghost group">
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
                className="flex items-center gap-4 p-5 hover:bg-gradient-to-r hover:from-cream-50/50 hover:to-transparent transition-all duration-300 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-2 h-2 rounded-full bg-honey-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="font-semibold text-coffee-900 truncate group-hover:text-coffee-700 transition-colors">
                      {request.title}
                    </p>
                    <PriorityBadge priority={request.priority} />
                  </div>
                  <div className="flex items-center gap-3 text-sm text-coffee-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {(request.branch as { name: string } | null)?.name}
                    </span>
                    <span className="text-coffee-300">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
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
    </div>
  )
}
