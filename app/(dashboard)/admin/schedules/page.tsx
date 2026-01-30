import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, RefreshCw, Building2, Clock, Play, Pause } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import ScheduleForm from './ScheduleForm'
import type { MaintenanceSchedule, Branch, Profile, Vendor } from '@/types/database.types'

const frequencyLabels: Record<number, string> = {
  7: 'ทุกสัปดาห์',
  14: 'ทุก 2 สัปดาห์',
  30: 'ทุกเดือน',
  60: 'ทุก 2 เดือน',
  90: 'ทุกไตรมาส',
  180: 'ทุก 6 เดือน',
  365: 'ทุกปี',
}

const categoryNames: Record<string, string> = {
  coffee_machine: 'เครื่องชงกาแฟ',
  grinder: 'เครื่องบดกาแฟ',
  refrigerator: 'ตู้เย็น/ตู้แช่',
  air_con: 'เครื่องปรับอากาศ',
  water_heater: 'เครื่องทำน้ำร้อน',
  general: 'ทั่วไป',
  cleaning: 'ทำความสะอาด',
  inspection: 'ตรวจสอบ',
}

export default async function SchedulesPage() {
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

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: schedules } = await supabase
    .from('maintenance_schedules')
    .select('*, branches(name), profiles!assigned_user_id(name), vendors!assigned_vendor_id(company_name)')
    .order('next_due_at') as { data: (MaintenanceSchedule & {
      branches: { name: string } | null
      profiles: { name: string } | null
      vendors: { company_name: string } | null
    })[] | null }

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('name') as { data: Branch[] | null }

  const { data: technicians } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'technician')
    .order('name') as { data: Profile[] | null }

  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .order('company_name') as { data: Vendor[] | null }

  const activeCount = schedules?.filter((s) => s.is_active).length || 0
  const pausedCount = schedules?.filter((s) => !s.is_active).length || 0
  const dueThisWeek = schedules?.filter((s) => {
    if (!s.is_active) return false
    const dueDate = new Date(s.next_due_at)
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return dueDate <= weekFromNow
  }).length || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 flex items-center gap-3">
            <Calendar className="h-7 w-7 text-coffee-600" />
            ตารางบำรุงรักษา
          </h1>
          <p className="text-coffee-600 mt-1">กำหนดการบำรุงรักษาตามรอบเวลา</p>
        </div>
        <ScheduleForm
          branches={branches || []}
          technicians={technicians || []}
          vendors={vendors || []}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-matcha-100 rounded-lg flex items-center justify-center">
              <Play className="h-5 w-5 text-matcha-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{activeCount}</p>
              <p className="text-sm text-coffee-500">กำลังทำงาน</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-honey-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-honey-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{dueThisWeek}</p>
              <p className="text-sm text-coffee-500">ครบกำหนดสัปดาห์นี้</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-coffee-100 rounded-lg flex items-center justify-center">
              <Pause className="h-5 w-5 text-coffee-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{pausedCount}</p>
              <p className="text-sm text-coffee-500">หยุดชั่วคราว</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      {schedules && schedules.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cream-50 border-b border-coffee-100">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-coffee-700">ชื่องาน</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-coffee-700">ประเภท</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-coffee-700">ความถี่</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-coffee-700">สาขา</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-coffee-700">มอบหมาย</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-coffee-700">ครั้งถัดไป</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-coffee-700">สถานะ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-100">
                {schedules.map((schedule) => {
                  const isOverdue = new Date(schedule.next_due_at) < new Date() && schedule.is_active
                  const isDueSoon = !isOverdue && new Date(schedule.next_due_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && schedule.is_active

                  return (
                    <tr key={schedule.id} className="hover:bg-cream-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-coffee-900">{schedule.name}</p>
                          {schedule.description && (
                            <p className="text-xs text-coffee-500 mt-0.5">{schedule.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-coffee-600">
                        {categoryNames[schedule.category] || schedule.category}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-coffee-600">
                          <RefreshCw className="h-3.5 w-3.5" />
                          {frequencyLabels[schedule.frequency_days] || `ทุก ${schedule.frequency_days} วัน`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-coffee-600">
                        {schedule.branches?.name || 'ทุกสาขา'}
                      </td>
                      <td className="px-4 py-3 text-sm text-coffee-600">
                        {schedule.profiles?.name || schedule.vendors?.company_name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          isOverdue ? 'text-cherry-600' : isDueSoon ? 'text-honey-600' : 'text-coffee-600'
                        }`}>
                          {new Date(schedule.next_due_at).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {isOverdue && ' (เลยกำหนด)'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          schedule.is_active
                            ? 'bg-matcha-100 text-matcha-700'
                            : 'bg-coffee-100 text-coffee-500'
                        }`}>
                          {schedule.is_active ? 'ทำงาน' : 'หยุด'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ScheduleForm
                          schedule={schedule}
                          branches={branches || []}
                          technicians={technicians || []}
                          vendors={vendors || []}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={Calendar}
            title="ยังไม่มีตารางบำรุงรักษา"
            description="เพิ่มตารางเพื่อสร้างงานซ่อมบำรุงอัตโนมัติตามรอบเวลา"
          />
        </div>
      )}
    </div>
  )
}
