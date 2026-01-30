import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter, Wrench, Building2, Clock, User, ChevronRight, Calendar, ArrowRight, SlidersHorizontal, Tag, AlertCircle, CheckCircle, ListTodo, PlayCircle } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import type { Profile, MaintenanceRequest } from '@/types/database.types'

type RequestWithRelations = MaintenanceRequest & {
  branch: { name: string; code: string } | null
  created_by_profile: { name: string } | null
  assigned_user: { name: string } | null
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; search?: string }>
}) {
  const params = await searchParams
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

  const isAdmin = profile?.role === 'admin'
  const isTechnician = profile?.role === 'technician'

  // Build query
  let query = supabase
    .from('maintenance_requests')
    .select(`
      *,
      branch:branches(name, code),
      created_by_profile:profiles!maintenance_requests_created_by_fkey(name),
      assigned_user:profiles!maintenance_requests_assigned_user_id_fkey(name)
    `)
    .order('created_at', { ascending: false })

  // Filter by role
  if (!isAdmin && !isTechnician && profile?.branch_id) {
    query = query.eq('branch_id', profile.branch_id)
  } else if (isTechnician) {
    query = query.eq('assigned_user_id', user.id)
  }

  // Apply filters
  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.priority) {
    query = query.eq('priority', params.priority)
  }
  if (params.search) {
    query = query.ilike('title', `%${params.search}%`)
  }

  const { data: requests } = await query as { data: RequestWithRelations[] | null }

  const hasFilters = params.search || params.status || params.priority

  // Stats
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(r => r.status === 'pending').length || 0,
    inProgress: requests?.filter(r => ['assigned', 'in_progress'].includes(r.status)).length || 0,
    completed: requests?.filter(r => r.status === 'completed').length || 0,
    critical: requests?.filter(r => r.priority === 'critical' || r.priority === 'high').length || 0
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 rounded-3xl p-6 lg:p-8 text-white shadow-2xl shadow-orange-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-float" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-float-delayed" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full blur-xl animate-breathe" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">งานแจ้งซ่อม</h1>
                <p className="text-orange-200 text-sm">
                  {requests?.length || 0} รายการ {hasFilters && <span className="text-yellow-300">(กรองแล้ว)</span>}
                </p>
              </div>
            </div>
          </div>

          {!isTechnician && (
            <Link
              href="/requests/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all border border-white/20 group"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              แจ้งซ่อมใหม่
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card group relative overflow-hidden hover-lift animate-slide-up stagger-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-coffee-500/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-coffee-100 to-coffee-200 group-hover:shadow-lg group-hover:shadow-coffee-300/50 transition-shadow">
              <ListTodo className="h-6 w-6 text-coffee-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900 animate-count-number">{stats.total}</p>
              <p className="text-sm text-coffee-500 font-medium">งานทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-amber-100 to-amber-200">
              <Clock className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-coffee-500 font-medium">รอดำเนินการ</p>
            </div>
          </div>
          {stats.pending > 0 && (
            <div className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          )}
        </div>

        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200">
              <PlayCircle className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-coffee-500 font-medium">กำลังดำเนินการ</p>
            </div>
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-emerald-100 to-emerald-200">
              <CheckCircle className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
              <p className="text-sm text-coffee-500 font-medium">เสร็จสิ้น</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-coffee-600">
            <Filter className="w-5 h-5" />
            <span className="font-medium">กรองข้อมูล</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400" />
              <input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="ค้นหางานแจ้งซ่อม..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 bg-white transition-all"
              />
            </div>
          </div>
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-400 pointer-events-none" />
            <select
              name="status"
              defaultValue={params.status}
              className="px-4 py-2.5 pl-10 border-2 border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 bg-white transition-all appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">สถานะทั้งหมด</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="assigned">มอบหมายแล้ว</option>
              <option value="in_progress">กำลังดำเนินการ</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-400 pointer-events-none" />
            <select
              name="priority"
              defaultValue={params.priority}
              className="px-4 py-2.5 pl-10 border-2 border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 bg-white transition-all appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">ความสำคัญทั้งหมด</option>
              <option value="low">ต่ำ</option>
              <option value="medium">ปานกลาง</option>
              <option value="high">สูง</option>
              <option value="critical">เร่งด่วน</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            <Search className="w-4 h-4" />
            ค้นหา
          </button>
          {hasFilters && (
            <Link href="/requests" className="btn-ghost text-sm">
              ล้างตัวกรอง
            </Link>
          )}
        </form>
      </div>

      {/* Requests List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-coffee-100 bg-gradient-to-r from-amber-50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-200 rounded-xl flex items-center justify-center">
                <Wrench className="h-5 w-5 text-orange-700" />
              </div>
              <div>
                <h2 className="font-bold text-coffee-900">รายการแจ้งซ่อม</h2>
                <p className="text-xs text-coffee-500">{requests?.length || 0} รายการ</p>
              </div>
            </div>
            {stats.critical > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200">
                <AlertCircle className="w-4 h-4" />
                {stats.critical} งานเร่งด่วน
              </div>
            )}
          </div>
        </div>

        {requests && requests.length > 0 ? (
          <div className="divide-y divide-coffee-100">
            {requests.map((request, index) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="block p-5 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-transparent transition-all duration-300 group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                      request.priority === 'critical' ? 'bg-gradient-to-br from-red-100 to-red-200' :
                      request.priority === 'high' ? 'bg-gradient-to-br from-orange-100 to-orange-200' :
                      'bg-gradient-to-br from-amber-100 to-amber-200'
                    }`}>
                      <Wrench className={`w-6 h-6 ${
                        request.priority === 'critical' ? 'text-red-600' :
                        request.priority === 'high' ? 'text-orange-600' :
                        'text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start lg:items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-coffee-900 group-hover:text-orange-700 transition-colors">
                          {request.title}
                        </h3>
                        <PriorityBadge priority={request.priority} />
                        <StatusBadge status={request.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-coffee-500">
                        <span className="flex items-center gap-1.5 font-medium text-coffee-700">
                          <Building2 className="h-3.5 w-3.5" />
                          {(request.branch as { name: string; code: string } | null)?.name}
                        </span>
                        {request.category && (
                          <>
                            <span className="text-coffee-300">•</span>
                            <span className="flex items-center gap-1.5">
                              <Tag className="h-3.5 w-3.5" />
                              {request.category}
                            </span>
                          </>
                        )}
                        <span className="text-coffee-300">•</span>
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {(request.created_by_profile as { name: string } | null)?.name}
                        </span>
                        <span className="text-coffee-300">•</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(request.created_at!), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </span>
                      </div>
                      {request.assigned_user && (
                        <p className="text-sm text-emerald-700 mt-2 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit border border-emerald-200">
                          <Wrench className="h-3.5 w-3.5" />
                          ช่าง: {(request.assigned_user as { name: string } | null)?.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 lg:flex-shrink-0">
                    {request.due_at && (
                      <div className="text-sm text-coffee-600 bg-coffee-50 px-3 py-2 rounded-xl border border-coffee-200">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-coffee-400" />
                          <span className="font-medium">
                            {new Date(request.due_at).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                    <ChevronRight className="h-5 w-5 text-coffee-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-10 h-10 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-coffee-900 mb-2">
              {hasFilters ? 'ไม่พบงานแจ้งซ่อม' : 'ยังไม่มีงานแจ้งซ่อม'}
            </h3>
            <p className="text-coffee-500 mb-6 max-w-sm mx-auto">
              {hasFilters
                ? 'ลองปรับตัวกรองใหม่หรือค้นหาด้วยคำอื่น'
                : 'ยังไม่มีงานแจ้งซ่อมในระบบ เริ่มต้นสร้างงานแรกของคุณ'}
            </p>
            {!isTechnician && (
              <Link
                href="/requests/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all group"
              >
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                แจ้งซ่อมใหม่
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
