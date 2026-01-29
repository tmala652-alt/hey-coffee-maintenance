import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter, Wrench, Building2, Clock, User, ChevronRight, Calendar, ArrowRight, SlidersHorizontal, Tag } from 'lucide-react'
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 mb-1">งานแจ้งซ่อม</h1>
          <p className="text-coffee-600 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            {requests?.length || 0} รายการ
            {hasFilters && <span className="text-honey-600">(กรองแล้ว)</span>}
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

      {/* Filters */}
      <div className="card-glass p-5">
        <form className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-coffee-400" />
            <input
              type="text"
              name="search"
              defaultValue={params.search}
              placeholder="ค้นหางานแจ้งซ่อม..."
              className="input pl-12"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-400 pointer-events-none" />
              <select name="status" defaultValue={params.status} className="input w-full sm:w-44 pl-10 appearance-none cursor-pointer">
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
              <select name="priority" defaultValue={params.priority} className="input w-full sm:w-44 pl-10 appearance-none cursor-pointer">
                <option value="">ความสำคัญทั้งหมด</option>
                <option value="low">ต่ำ</option>
                <option value="medium">ปานกลาง</option>
                <option value="high">สูง</option>
                <option value="critical">เร่งด่วน</option>
              </select>
            </div>
            <button type="submit" className="btn-secondary">
              <Filter className="h-5 w-5" />
              กรอง
            </button>
          </div>
        </form>
      </div>

      {/* Requests List */}
      {requests && requests.length > 0 ? (
        <div className="card-glass overflow-hidden divide-y divide-coffee-100/50">
          {requests.map((request, index) => (
            <Link
              key={request.id}
              href={`/requests/${request.id}`}
              className="flex flex-col lg:flex-row lg:items-center gap-4 p-5 hover:bg-gradient-to-r hover:from-cream-50/50 hover:to-transparent transition-all duration-300 group"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start lg:items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-semibold text-coffee-900 group-hover:text-coffee-700 transition-colors">
                    {request.title}
                  </h3>
                  <PriorityBadge priority={request.priority} />
                  <StatusBadge status={request.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-coffee-500">
                  <span className="flex items-center gap-1.5 font-medium text-coffee-700">
                    <Building2 className="h-4 w-4" />
                    {(request.branch as { name: string; code: string } | null)?.name}
                  </span>
                  {request.category && (
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      {request.category}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {(request.created_by_profile as { name: string } | null)?.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(request.created_at!), {
                      addSuffix: true,
                      locale: th,
                    })}
                  </span>
                </div>
                {request.assigned_user && (
                  <p className="text-sm text-matcha-600 mt-2 flex items-center gap-1.5 bg-matcha-50 px-2 py-1 rounded-lg w-fit">
                    <Wrench className="h-3.5 w-3.5" />
                    ช่าง: {(request.assigned_user as { name: string } | null)?.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 lg:flex-shrink-0">
                {request.due_at && (
                  <div className="text-sm text-coffee-500 bg-cream-100 px-3 py-2 rounded-xl">
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
                <ChevronRight className="h-5 w-5 text-coffee-300 group-hover:text-coffee-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card-glass">
          <EmptyState
            icon={Wrench}
            title="ไม่พบงานแจ้งซ่อม"
            description={hasFilters
              ? "ลองปรับตัวกรองใหม่หรือค้นหาด้วยคำอื่น"
              : "ยังไม่มีงานแจ้งซ่อมในระบบ เริ่มต้นสร้างงานแรกของคุณ"}
            actionLabel={!isTechnician ? "แจ้งซ่อมใหม่" : undefined}
            actionHref={!isTechnician ? "/requests/new" : undefined}
          />
        </div>
      )}
    </div>
  )
}
