import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Store, Hash, Globe, Clock, MapPin } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import BranchForm from './BranchForm'
import WorkingHoursForm from './WorkingHoursForm'
import HolidaysForm from './HolidaysForm'
import type { Branch, Profile, BranchWorkingHours } from '@/types/database.types'

const regionColors: Record<string, string> = {
  กรุงเทพฯ: 'bg-honey-500',
  กรุงเทพและปริมณฑล: 'bg-honey-500',
  ภาคกลาง: 'bg-matcha-500',
  ภาคเหนือ: 'bg-blue-500',
  ภาคตะวันออกเฉียงเหนือ: 'bg-purple-500',
  ภาคตะวันออก: 'bg-orange-500',
  ภาคใต้: 'bg-cyan-500',
  อื่นๆ: 'bg-coffee-500',
}

type BranchWithHours = Branch & {
  working_hours?: BranchWorkingHours[]
}

function formatWorkingHours(hours: BranchWorkingHours[] | undefined): string {
  if (!hours || hours.length === 0) return ''

  const openDays = hours.filter((h) => !h.is_closed)
  if (openDays.length === 0) return 'ปิดทุกวัน'

  // Check if all open days have same hours
  const firstOpen = openDays[0]
  const allSame = openDays.every(
    (h) => h.open_time === firstOpen.open_time && h.close_time === firstOpen.close_time
  )

  if (allSame && firstOpen.open_time && firstOpen.close_time) {
    const openTime = firstOpen.open_time.slice(0, 5)
    const closeTime = firstOpen.close_time.slice(0, 5)
    return `${openTime}-${closeTime}`
  }

  return `${openDays.length} วัน/สัปดาห์`
}

function getOpenDaysCount(hours: BranchWorkingHours[] | undefined): number {
  if (!hours) return 0
  return hours.filter((h) => !h.is_closed).length
}

export default async function BranchesPage() {
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

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch branches with working hours
  const { data: branches } = (await supabase
    .from('branches')
    .select(
      `
      *,
      working_hours:branch_working_hours(*)
    `
    )
    .order('region')
    .order('name')) as { data: BranchWithHours[] | null }

  // Group by region
  const groupedBranches = branches?.reduce(
    (acc, branch) => {
      const region = branch.region || 'อื่นๆ'
      if (!acc[region]) acc[region] = []
      acc[region].push(branch)
      return acc
    },
    {} as Record<string, BranchWithHours[]>
  )

  // Count stats
  const totalBranches = branches?.length || 0
  const branchesWithHours = branches?.filter((b) => b.working_hours && b.working_hours.length > 0).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-coffee-900">จัดการสาขา</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-coffee-500">
            <span className="flex items-center gap-1.5">
              <Store className="h-4 w-4" />
              {totalBranches} สาขา
            </span>
            <span className="w-1 h-1 bg-coffee-300 rounded-full" />
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              ตั้งเวลาแล้ว {branchesWithHours}/{totalBranches}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HolidaysForm />
          <BranchForm />
        </div>
      </div>

      {/* Branches List */}
      {branches && branches.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedBranches || {}).map(([region, regionBranches]) => (
            <div key={region} className="card overflow-hidden">
              {/* Region Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-coffee-50/50 border-b border-coffee-100">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${regionColors[region] || regionColors['อื่นๆ']}`}
                />
                <h2 className="font-medium text-coffee-800">{region}</h2>
                <span className="text-xs text-coffee-500 bg-coffee-100 px-2 py-0.5 rounded">
                  {regionBranches?.length}
                </span>
              </div>

              {/* Branches Table */}
              <div className="divide-y divide-coffee-100">
                {regionBranches?.map((branch) => {
                  const hoursText = formatWorkingHours(branch.working_hours)
                  const hasHours = branch.working_hours && branch.working_hours.length > 0
                  const openDays = getOpenDaysCount(branch.working_hours)

                  return (
                    <div
                      key={branch.id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-coffee-50/50 transition-colors"
                    >
                      {/* Branch Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-coffee-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-coffee-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-coffee-900 truncate">{branch.name}</h3>
                          <p className="text-xs text-coffee-500 font-mono">{branch.code}</p>
                        </div>
                      </div>

                      {/* Working Hours */}
                      <div className="hidden sm:flex items-center gap-2 w-36">
                        {hasHours ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${openDays > 0 ? 'bg-matcha-500' : 'bg-coffee-300'}`}
                            />
                            <span className="text-sm text-coffee-700">{hoursText}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-coffee-400">ยังไม่ตั้งเวลา</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <WorkingHoursForm branch={branch} />
                        <BranchForm branch={branch} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={Building2}
            title="ยังไม่มีสาขา"
            description="เพิ่มสาขาแรกเพื่อเริ่มต้นใช้งานระบบ"
          />
        </div>
      )}

      {/* Quick Stats */}
      {branches && branches.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(groupedBranches || {}).slice(0, 4).map(([region, regionBranches]) => (
            <div key={region} className="card p-3">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2 h-2 rounded-full ${regionColors[region] || regionColors['อื่นๆ']}`}
                />
                <span className="text-xs text-coffee-500 truncate">{region}</span>
              </div>
              <p className="text-xl font-semibold text-coffee-900">{regionBranches?.length}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
