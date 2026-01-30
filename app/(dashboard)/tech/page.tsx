import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Coffee,
} from 'lucide-react'
import QuickActionCard from '@/components/tech/QuickActionCard'
import MobileBottomNav from '@/components/tech/MobileBottomNav'
import NotificationBell from '@/components/ui/NotificationBell'
import type { Profile, MaintenanceRequest } from '@/types/database.types'

type RequestWithBranch = MaintenanceRequest & {
  branch: { name: string; code: string } | null
}

export default async function TechDashboardPage() {
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

  if (profile?.role !== 'technician') {
    redirect('/dashboard')
  }

  // Get technician's jobs
  const { data: jobs } = (await supabase
    .from('maintenance_requests')
    .select('*, branch:branches(name, code)')
    .eq('assigned_user_id', user.id)
    .in('status', ['assigned', 'in_progress'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })) as { data: RequestWithBranch[] | null }

  // Get completed jobs count (this month)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: completedCount } = await supabase
    .from('maintenance_requests')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_user_id', user.id)
    .eq('status', 'completed')
    .gte('created_at', startOfMonth.toISOString())

  // Split jobs by status
  const assignedJobs = jobs?.filter((j) => j.status === 'assigned') || []
  const inProgressJobs = jobs?.filter((j) => j.status === 'in_progress') || []

  // Count urgent jobs (SLA at risk)
  const urgentJobs = jobs?.filter((j) => {
    if (!j.due_at || !j.created_at) return false
    const now = Date.now()
    const created = new Date(j.created_at).getTime()
    const due = new Date(j.due_at).getTime()
    const elapsed = (now - created) / (due - created)
    return elapsed >= 0.75
  }).length || 0

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'สวัสดีตอนเช้า'
    if (hour < 17) return 'สวัสดีตอนบ่าย'
    return 'สวัสดีตอนเย็น'
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-coffee-100 lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-coffee-700 rounded-lg flex items-center justify-center">
              <Coffee className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-coffee-900">Hey! Coffee</span>
          </div>
          <NotificationBell userId={user.id} />
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-coffee-900">
            {getGreeting()}, {profile?.name?.split(' ')[0]}
          </h1>
          <p className="text-coffee-600">
            วันนี้มี {(jobs?.length || 0)} งานที่ต้องทำ
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-honey-50 rounded-xl p-3 text-center">
            <Clock className="h-5 w-5 text-honey-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-honey-700">{assignedJobs.length}</p>
            <p className="text-xs text-honey-600">รอเริ่ม</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <Briefcase className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-700">{inProgressJobs.length}</p>
            <p className="text-xs text-blue-600">กำลังทำ</p>
          </div>
          <div className="bg-matcha-50 rounded-xl p-3 text-center">
            <CheckCircle className="h-5 w-5 text-matcha-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-matcha-700">{completedCount || 0}</p>
            <p className="text-xs text-matcha-600">เสร็จเดือนนี้</p>
          </div>
        </div>

        {/* Urgent Alert */}
        {urgentJobs > 0 && (
          <div className="bg-cherry-50 border border-cherry-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cherry-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-cherry-700">
                  {urgentJobs} งานใกล้ครบ SLA
                </p>
                <p className="text-sm text-cherry-600">ต้องเร่งดำเนินการ</p>
              </div>
            </div>
          </div>
        )}

        {/* In Progress Jobs */}
        {inProgressJobs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-coffee-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                กำลังดำเนินการ
              </h2>
              <span className="text-sm text-coffee-500">{inProgressJobs.length} งาน</span>
            </div>
            <div className="space-y-3">
              {inProgressJobs.map((job) => (
                <QuickActionCard key={job.id} request={job} />
              ))}
            </div>
          </div>
        )}

        {/* Assigned Jobs */}
        {assignedJobs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-coffee-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-honey-500 rounded-full" />
                รอเริ่มงาน
              </h2>
              <span className="text-sm text-coffee-500">{assignedJobs.length} งาน</span>
            </div>
            <div className="space-y-3">
              {assignedJobs.map((job) => (
                <QuickActionCard key={job.id} request={job} />
              ))}
            </div>
          </div>
        )}

        {/* No Jobs */}
        {(jobs?.length || 0) === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-matcha-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-coffee-700 mb-2">ไม่มีงานค้าง</h3>
            <p className="text-coffee-500">
              คุณไม่มีงานที่ต้องทำในขณะนี้
            </p>
          </div>
        )}

        {/* View All Link */}
        {(jobs?.length || 0) > 0 && (
          <Link
            href="/tech/jobs"
            className="flex items-center justify-center gap-2 py-3 text-coffee-600 hover:text-coffee-800 transition-colors"
          >
            ดูงานทั้งหมด
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
