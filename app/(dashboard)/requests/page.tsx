import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter, Wrench, Building2, Clock, User, ChevronRight, Calendar, SlidersHorizontal, Tag, AlertCircle, CheckCircle, Activity } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-coffee-900">งานแจ้งซ่อม</h1>
          <p className="text-coffee-500 mt-1">
            {requests?.length || 0} รายการ {hasFilters && <span className="text-honey-600">(กรองแล้ว)</span>}
          </p>
        </div>

        {!isTechnician && (
          <Link href="/requests/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            แจ้งซ่อมใหม่
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-coffee-100 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 text-coffee-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-coffee-900">{stats.total}</p>
              <p className="text-sm text-coffee-500">งานทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-honey-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-honey-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-coffee-900">{stats.pending}</p>
              <p className="text-sm text-coffee-500">รอดำเนินการ</p>
            </div>
          </div>
          {stats.pending > 0 && (
            <div className="absolute top-3 right-3 w-2 h-2 bg-honey-500 rounded-full" />
          )}
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-coffee-900">{stats.inProgress}</p>
              <p className="text-sm text-coffee-500">กำลังดำเนินการ</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-matcha-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-matcha-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-coffee-900">{stats.completed}</p>
              <p className="text-sm text-coffee-500">เสร็จสิ้น</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-coffee-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">กรอง</span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400" />
              <input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="ค้นหางานแจ้งซ่อม..."
                className="input pl-10"
              />
            </div>
          </div>
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-400 pointer-events-none" />
            <select
              name="status"
              defaultValue={params.status}
              className="input pl-10 min-w-[150px]"
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
              className="input pl-10 min-w-[150px]"
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
            <Link href="/requests" className="btn-secondary text-sm">
              ล้างตัวกรอง
            </Link>
          )}
        </form>
      </div>

      {/* Requests List */}
      <div className="card">
        <div className="p-4 border-b border-coffee-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-coffee-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-coffee-600" />
              </div>
              <div>
                <h2 className="font-semibold text-coffee-900">รายการแจ้งซ่อม</h2>
                <p className="text-xs text-coffee-500">{requests?.length || 0} รายการ</p>
              </div>
            </div>
            {stats.critical > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cherry-50 text-cherry-700 rounded-lg text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                {stats.critical} งานเร่งด่วน
              </div>
            )}
          </div>
        </div>

        {requests && requests.length > 0 ? (
          <div className="divide-y divide-coffee-100">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="flex items-center gap-4 p-4 hover:bg-coffee-50 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  request.priority === 'critical' ? 'bg-cherry-500' :
                  request.priority === 'high' ? 'bg-orange-500' :
                  request.priority === 'medium' ? 'bg-honey-500' : 'bg-matcha-500'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-coffee-900">
                      {request.title}
                    </h3>
                    <PriorityBadge priority={request.priority} />
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-coffee-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {(request.branch as { name: string; code: string } | null)?.name}
                    </span>
                    {request.category && (
                      <>
                        <span className="w-1 h-1 bg-coffee-300 rounded-full" />
                        <span>{request.category}</span>
                      </>
                    )}
                    <span className="w-1 h-1 bg-coffee-300 rounded-full" />
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {(request.created_by_profile as { name: string } | null)?.name}
                    </span>
                    <span className="w-1 h-1 bg-coffee-300 rounded-full" />
                    <span>
                      {formatDistanceToNow(new Date(request.created_at!), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </span>
                  </div>
                  {request.assigned_user && (
                    <p className="text-xs text-matcha-700 mt-1.5 flex items-center gap-1">
                      <Wrench className="h-3 w-3" />
                      ช่าง: {(request.assigned_user as { name: string } | null)?.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {request.due_at && (
                    <div className="text-xs text-coffee-600 bg-coffee-50 px-2.5 py-1.5 rounded-lg hidden sm:flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-coffee-400" />
                      <span>
                        {new Date(request.due_at).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 text-coffee-400" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-coffee-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-7 h-7 text-coffee-400" />
            </div>
            <h3 className="font-semibold text-coffee-900 mb-1">
              {hasFilters ? 'ไม่พบงานแจ้งซ่อม' : 'ยังไม่มีงานแจ้งซ่อม'}
            </h3>
            <p className="text-sm text-coffee-500 mb-4">
              {hasFilters
                ? 'ลองปรับตัวกรองใหม่หรือค้นหาด้วยคำอื่น'
                : 'ยังไม่มีงานแจ้งซ่อมในระบบ'}
            </p>
            {!isTechnician && (
              <Link href="/requests/new" className="btn-primary btn-sm">
                <Plus className="w-4 h-4" />
                แจ้งซ่อมใหม่
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
