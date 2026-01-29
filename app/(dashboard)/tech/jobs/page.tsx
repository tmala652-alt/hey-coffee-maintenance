import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Wrench, Clock, CheckCircle, Briefcase, Building2, Tag, Calendar, ChevronRight, Sparkles, Play } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import type { Profile, MaintenanceRequest } from '@/types/database.types'

type JobWithBranch = MaintenanceRequest & {
  branch: { name: string; code: string } | null
}

export default async function TechJobsPage() {
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

  if (profile?.role !== 'technician') {
    redirect('/dashboard')
  }

  const { data: jobs } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      branch:branches(name, code)
    `)
    .eq('assigned_user_id', user.id)
    .in('status', ['assigned', 'in_progress'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true }) as { data: JobWithBranch[] | null }

  const assignedJobs = jobs?.filter((j) => j.status === 'assigned') || []
  const inProgressJobs = jobs?.filter((j) => j.status === 'in_progress') || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-matcha-500 to-matcha-700 rounded-xl flex items-center justify-center shadow-lg shadow-matcha-700/30">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          งานของฉัน
        </h1>
        <p className="text-coffee-600 mt-1">
          {jobs?.length || 0} งานที่ต้องดำเนินการ
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:gap-6">
        <div className="stat-card group">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-honey-100 to-honey-200">
              <Clock className="h-6 w-6 text-honey-700" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-coffee-900">{assignedJobs.length}</p>
              <p className="text-sm text-coffee-500 font-medium">รอเริ่มงาน</p>
            </div>
          </div>
        </div>

        <div className="stat-card group">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200">
              <Wrench className="h-6 w-6 text-blue-700" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold text-coffee-900">{inProgressJobs.length}</p>
              <p className="text-sm text-coffee-500 font-medium">กำลังดำเนินการ</p>
            </div>
          </div>
        </div>
      </div>

      {/* In Progress */}
      {inProgressJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
              <Wrench className="h-5 w-5 text-blue-700" />
            </div>
            <h2 className="text-xl font-bold text-coffee-900">กำลังดำเนินการ</h2>
            <span className="px-3 py-1 bg-blue-100 rounded-full text-sm font-medium text-blue-700">
              {inProgressJobs.length} งาน
            </span>
          </div>
          <div className="card-glass overflow-hidden divide-y divide-coffee-100/50">
            {inProgressJobs.map((job, index) => (
              <Link
                key={job.id}
                href={`/requests/${job.id}`}
                className="flex flex-col lg:flex-row lg:items-center gap-4 p-5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-300 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-1.5 text-blue-600 lg:hidden">
                  <Play className="h-4 w-4" />
                  <span className="text-xs font-semibold">กำลังดำเนินการ</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start lg:items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-coffee-900 group-hover:text-coffee-700 transition-colors text-lg">
                      {job.title}
                    </h3>
                    <PriorityBadge priority={job.priority} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-coffee-500">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      {(job.branch as { name: string; code: string } | null)?.name}
                    </span>
                    {job.category && (
                      <span className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        {job.category}
                      </span>
                    )}
                  </div>
                  {job.due_at && (
                    <p className="text-sm text-honey-600 mt-2 flex items-center gap-1.5 bg-honey-50 px-2 py-1 rounded-lg w-fit">
                      <Calendar className="h-3.5 w-3.5" />
                      กำหนด: {new Date(job.due_at).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={job.status} />
                  <ChevronRight className="h-5 w-5 text-coffee-300 group-hover:text-coffee-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Assigned */}
      {assignedJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-honey-100 to-honey-200">
              <Clock className="h-5 w-5 text-honey-700" />
            </div>
            <h2 className="text-xl font-bold text-coffee-900">รอเริ่มงาน</h2>
            <span className="px-3 py-1 bg-honey-100 rounded-full text-sm font-medium text-honey-700">
              {assignedJobs.length} งาน
            </span>
          </div>
          <div className="card-glass overflow-hidden divide-y divide-coffee-100/50">
            {assignedJobs.map((job, index) => (
              <Link
                key={job.id}
                href={`/requests/${job.id}`}
                className="flex flex-col lg:flex-row lg:items-center gap-4 p-5 hover:bg-gradient-to-r hover:from-honey-50/50 hover:to-transparent transition-all duration-300 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start lg:items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-coffee-900 group-hover:text-coffee-700 transition-colors text-lg">
                      {job.title}
                    </h3>
                    <PriorityBadge priority={job.priority} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-coffee-500">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      {(job.branch as { name: string; code: string } | null)?.name}
                    </span>
                    {job.category && (
                      <span className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        {job.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      แจ้งเมื่อ {formatDistanceToNow(new Date(job.created_at!), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={job.status} />
                  <ChevronRight className="h-5 w-5 text-coffee-300 group-hover:text-coffee-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!jobs || jobs.length === 0) && (
        <div className="card-glass">
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-matcha-100 to-matcha-200 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce-soft">
              <Sparkles className="h-10 w-10 text-matcha-600" />
            </div>
            <h3 className="text-xl font-bold text-coffee-900 mb-2">ไม่มีงานค้าง</h3>
            <p className="text-coffee-500 max-w-sm mx-auto">
              คุณไม่มีงานที่ต้องดำเนินการในขณะนี้ ดีมาก!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
