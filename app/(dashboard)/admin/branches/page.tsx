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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-700/30 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-emerald-700/40 group-hover:scale-105">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-coffee-900">จัดการสาขา</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-coffee-500">
              <span className="flex items-center gap-1.5 bg-coffee-50 px-2 py-0.5 rounded-lg">
                <Store className="h-4 w-4 text-coffee-600" />
                <span className="font-medium text-coffee-700">{totalBranches}</span> สาขา
              </span>
              <span className="flex items-center gap-1.5 bg-matcha-50 px-2 py-0.5 rounded-lg">
                <Clock className="h-4 w-4 text-matcha-600" />
                ตั้งเวลาแล้ว <span className="font-medium text-matcha-700">{branchesWithHours}/{totalBranches}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HolidaysForm />
          <BranchForm />
        </div>
      </div>

      {/* Branches List */}
      {branches && branches.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedBranches || {}).map(([region, regionBranches]) => (
            <div key={region} className="card-glass overflow-hidden">
              {/* Region Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-cream-50 border-b border-coffee-100">
                <div
                  className={`w-3 h-3 rounded-full ${regionColors[region] || regionColors['อื่นๆ']}`}
                />
                <h2 className="font-semibold text-coffee-800">{region}</h2>
                <span className="text-xs text-coffee-500 bg-coffee-100 px-2 py-0.5 rounded-full">
                  {regionBranches?.length}
                </span>
              </div>

              {/* Branches Table */}
              <div className="divide-y divide-coffee-100">
                {regionBranches?.map((branch, index) => {
                  const hoursText = formatWorkingHours(branch.working_hours)
                  const hasHours = branch.working_hours && branch.working_hours.length > 0
                  const openDays = getOpenDaysCount(branch.working_hours)

                  return (
                    <div
                      key={branch.id}
                      className="flex items-center gap-4 px-4 py-4 hover:bg-gradient-to-r hover:from-cream-50 hover:to-transparent transition-all duration-300 group"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* Branch Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-coffee-300/30 transition-all duration-300">
                          <Building2 className="h-6 w-6 text-coffee-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-coffee-900 truncate group-hover:text-coffee-700 transition-colors">{branch.name}</h3>
                          <p className="text-xs text-coffee-500 font-mono bg-coffee-50 px-1.5 py-0.5 rounded inline-block">{branch.code}</p>
                        </div>
                      </div>

                      {/* Working Hours */}
                      <div className="hidden sm:flex items-center gap-2 w-44">
                        {hasHours ? (
                          <div className="flex items-center gap-2 bg-matcha-50 px-3 py-1.5 rounded-lg border border-matcha-200">
                            <div
                              className={`w-2 h-2 rounded-full ${openDays > 0 ? 'bg-matcha-500 animate-pulse' : 'bg-coffee-300'}`}
                            />
                            <span className="text-sm text-matcha-700 font-medium">{hoursText}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-coffee-400 bg-coffee-50 px-3 py-1.5 rounded-lg border border-coffee-100">ยังไม่ตั้งเวลา</span>
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
        <div className="card-glass">
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
            <div key={region} className="bg-white rounded-xl border border-coffee-100 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2 h-2 rounded-full ${regionColors[region] || regionColors['อื่นๆ']}`}
                />
                <span className="text-xs text-coffee-500 truncate">{region}</span>
              </div>
              <p className="text-xl font-bold text-coffee-800">{regionBranches?.length}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
