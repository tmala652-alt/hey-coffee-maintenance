import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, Building2, Wrench, AlertTriangle, Shield } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import EquipmentForm from './EquipmentForm'
import type { Equipment, Branch, Profile } from '@/types/database.types'

const categoryNames: Record<string, string> = {
  coffee_machine: 'เครื่องชงกาแฟ',
  grinder: 'เครื่องบดกาแฟ',
  refrigerator: 'ตู้เย็น/ตู้แช่',
  air_con: 'เครื่องปรับอากาศ',
  water_heater: 'เครื่องทำน้ำร้อน',
  pos: 'เครื่อง POS',
  printer: 'เครื่องพิมพ์',
  other: 'อื่นๆ',
}

const statusColors: Record<string, string> = {
  active: 'bg-matcha-100 text-matcha-700',
  under_repair: 'bg-honey-100 text-honey-700',
  retired: 'bg-coffee-100 text-coffee-500',
}

const statusNames: Record<string, string> = {
  active: 'ใช้งานปกติ',
  under_repair: 'กำลังซ่อม',
  retired: 'ปลดระวาง',
}

export default async function EquipmentPage() {
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

  const { data: equipment } = await supabase
    .from('equipment')
    .select('*, branches(name)')
    .order('branch_id')
    .order('category')
    .order('name') as { data: (Equipment & { branches: { name: string } | null })[] | null }

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('name') as { data: Branch[] | null }

  // Group by branch
  const groupedEquipment = equipment?.reduce((acc, eq) => {
    const branchName = eq.branches?.name || 'ไม่ระบุสาขา'
    if (!acc[branchName]) acc[branchName] = []
    acc[branchName].push(eq)
    return acc
  }, {} as Record<string, typeof equipment>)

  // Count stats
  const totalCount = equipment?.length || 0
  const activeCount = equipment?.filter((e) => e.status === 'active').length || 0
  const repairCount = equipment?.filter((e) => e.status === 'under_repair').length || 0
  const warrantyExpiring = equipment?.filter((e) => {
    if (!e.warranty_expiry) return false
    const expiry = new Date(e.warranty_expiry)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiry <= thirtyDaysFromNow && expiry >= new Date()
  }).length || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 flex items-center gap-3">
            <Package className="h-7 w-7 text-coffee-600" />
            จัดการอุปกรณ์
          </h1>
          <p className="text-coffee-600 mt-1">ทะเบียนอุปกรณ์และเครื่องจักรทุกสาขา</p>
        </div>
        <EquipmentForm branches={branches || []} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-coffee-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-coffee-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{totalCount}</p>
              <p className="text-sm text-coffee-500">อุปกรณ์ทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-matcha-100 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 text-matcha-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{activeCount}</p>
              <p className="text-sm text-coffee-500">ใช้งานปกติ</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-honey-100 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5 text-honey-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{repairCount}</p>
              <p className="text-sm text-coffee-500">กำลังซ่อม</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cherry-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-cherry-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{warrantyExpiring}</p>
              <p className="text-sm text-coffee-500">ประกันใกล้หมด</p>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      {equipment && equipment.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedEquipment || {}).map(([branchName, branchEquipment]) => (
            <div key={branchName} className="card overflow-hidden">
              <div className="bg-cream-50 px-5 py-3 border-b border-coffee-100">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-coffee-500" />
                  <h2 className="font-semibold text-coffee-900">{branchName}</h2>
                  <span className="px-2 py-0.5 bg-coffee-200 rounded-full text-xs font-medium text-coffee-700">
                    {branchEquipment?.length} รายการ
                  </span>
                </div>
              </div>

              <div className="divide-y divide-coffee-100">
                {branchEquipment?.map((eq) => (
                  <div key={eq.id} className="p-4 hover:bg-cream-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-coffee-900">{eq.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[eq.status || 'active']}`}>
                            {statusNames[eq.status || 'active']}
                          </span>
                        </div>
                        <div className="text-sm text-coffee-500 space-y-0.5">
                          <p>
                            <span className="text-coffee-400">ประเภท:</span>{' '}
                            {categoryNames[eq.category] || eq.category}
                          </p>
                          {eq.brand && (
                            <p>
                              <span className="text-coffee-400">ยี่ห้อ/รุ่น:</span>{' '}
                              {eq.brand} {eq.model}
                            </p>
                          )}
                          {eq.serial_number && (
                            <p>
                              <span className="text-coffee-400">S/N:</span>{' '}
                              <span className="font-mono">{eq.serial_number}</span>
                            </p>
                          )}
                          {eq.location && (
                            <p>
                              <span className="text-coffee-400">ตำแหน่ง:</span>{' '}
                              {eq.location}
                            </p>
                          )}
                          {eq.warranty_expiry && (
                            <p className={new Date(eq.warranty_expiry) < new Date() ? 'text-cherry-600' : ''}>
                              <span className="text-coffee-400">ประกันหมด:</span>{' '}
                              {new Date(eq.warranty_expiry).toLocaleDateString('th-TH')}
                              {new Date(eq.warranty_expiry) < new Date() && ' (หมดแล้ว)'}
                            </p>
                          )}
                        </div>
                      </div>
                      <EquipmentForm equipment={eq} branches={branches || []} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={Package}
            title="ยังไม่มีอุปกรณ์"
            description="เพิ่มอุปกรณ์เพื่อเริ่มติดตามการบำรุงรักษา"
          />
        </div>
      )}
    </div>
  )
}
