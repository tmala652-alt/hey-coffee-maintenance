import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Building2, Phone, Crown, Store, HardHat, Truck, Briefcase } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import UserForm from './UserForm'
import type { Profile, Branch, RoleEnum } from '@/types/database.types'

type ProfileWithBranch = Profile & { branch: { name: string } | null }

const roleConfig: Record<RoleEnum, { label: string; icon: typeof Crown; color: string }> = {
  admin: { label: 'ผู้ดูแลระบบ', icon: Crown, color: 'text-purple-600 bg-purple-50' },
  manager: { label: 'ผู้จัดการ', icon: Briefcase, color: 'text-indigo-600 bg-indigo-50' },
  branch: { label: 'พนักงานสาขา', icon: Store, color: 'text-blue-600 bg-blue-50' },
  technician: { label: 'ช่างเทคนิค', icon: HardHat, color: 'text-orange-600 bg-orange-50' },
  vendor: { label: 'ผู้รับเหมา', icon: Truck, color: 'text-emerald-600 bg-emerald-50' },
}

export default async function UsersPage() {
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

  const { data: users } = await supabase
    .from('profiles')
    .select('*, branch:branches!profiles_branch_id_fkey(name)')
    .order('role')
    .order('name') as { data: ProfileWithBranch[] | null }

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('name') as { data: Branch[] | null }

  const roleOrder: RoleEnum[] = ['admin', 'manager', 'technician', 'branch', 'vendor']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-coffee-900">จัดการผู้ใช้</h1>
          <p className="text-coffee-500 text-sm mt-1">{users?.length || 0} คนในระบบ</p>
        </div>
      </div>

      {/* Users Table */}
      {users && users.length > 0 ? (
        <div className="bg-white rounded-xl border border-coffee-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-coffee-100 bg-coffee-50/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-coffee-600">ชื่อ</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-coffee-600 hidden sm:table-cell">บทบาท</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-coffee-600 hidden md:table-cell">สาขา</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-coffee-600 hidden lg:table-cell">โทรศัพท์</th>
                <th className="py-3 px-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-50">
              {roleOrder.flatMap((role) =>
                users
                  .filter((u) => u.role === role)
                  .map((u) => {
                    const config = roleConfig[u.role as RoleEnum]
                    const Icon = config?.icon || Store
                    return (
                      <tr key={u.id} className="hover:bg-cream-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config?.color || 'bg-coffee-50 text-coffee-600'}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-coffee-900">{u.name}</p>
                              <p className="text-xs text-coffee-400 sm:hidden">{config?.label}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${config?.color || 'bg-coffee-50 text-coffee-600'}`}>
                            {config?.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          {u.branch ? (
                            <span className="flex items-center gap-1.5 text-sm text-coffee-600">
                              <Building2 className="h-3.5 w-3.5 text-coffee-400" />
                              {(u.branch as { name: string }).name}
                            </span>
                          ) : (
                            <span className="text-coffee-300 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          {u.phone ? (
                            <span className="flex items-center gap-1.5 text-sm text-coffee-600">
                              <Phone className="h-3.5 w-3.5 text-coffee-400" />
                              {u.phone}
                            </span>
                          ) : (
                            <span className="text-coffee-300 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <UserForm user={u} branches={branches || []} />
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-coffee-100 p-8">
          <EmptyState
            icon={Users}
            title="ยังไม่มีผู้ใช้"
            description="ผู้ใช้จะปรากฏเมื่อมีการลงทะเบียน"
          />
        </div>
      )}
    </div>
  )
}
