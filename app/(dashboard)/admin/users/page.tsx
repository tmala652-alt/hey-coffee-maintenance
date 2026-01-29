import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Shield, Wrench, Building2, Phone, Truck, Crown, Store, HardHat, ChevronRight } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import UserForm from './UserForm'
import type { Profile, Branch, RoleEnum } from '@/types/database.types'

type ProfileWithBranch = Profile & { branch: { name: string } | null }

const roleConfig: Record<RoleEnum, { label: string; icon: typeof Shield; color: string; gradient: string }> = {
  admin: { label: 'ผู้ดูแลระบบ', icon: Crown, color: 'bg-cherry-500/20 text-cherry-600', gradient: 'from-cherry-100 to-cherry-200' },
  branch: { label: 'พนักงานสาขา', icon: Store, color: 'bg-coffee-100 text-coffee-700', gradient: 'from-coffee-100 to-coffee-200' },
  technician: { label: 'ช่างเทคนิค', icon: HardHat, color: 'bg-matcha-500/20 text-matcha-600', gradient: 'from-matcha-100 to-matcha-200' },
  vendor: { label: 'ผู้รับเหมา', icon: Truck, color: 'bg-honey-500/20 text-honey-600', gradient: 'from-honey-100 to-honey-200' },
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
    .select('*, branch:branches(name)')
    .order('role')
    .order('name') as { data: ProfileWithBranch[] | null }

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('name') as { data: Branch[] | null }

  // Group users by role
  const groupedUsers = users?.reduce((acc, u) => {
    if (!acc[u.role]) acc[u.role] = []
    acc[u.role].push(u)
    return acc
  }, {} as Record<RoleEnum, ProfileWithBranch[]>)

  const roleOrder: RoleEnum[] = ['admin', 'technician', 'branch', 'vendor']

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-700/30">
              <Users className="h-5 w-5 text-white" />
            </div>
            จัดการผู้ใช้
          </h1>
          <p className="text-coffee-600 mt-1">{users?.length || 0} คนในระบบ</p>
        </div>

        {/* Role Summary */}
        <div className="flex flex-wrap gap-3">
          {roleOrder.map((role) => {
            const config = roleConfig[role]
            const count = groupedUsers?.[role]?.length || 0
            if (count === 0) return null
            return (
              <div key={role} className={`px-4 py-2 rounded-xl bg-gradient-to-r ${config.gradient} flex items-center gap-2`}>
                <config.icon className="h-4 w-4" />
                <span className="font-semibold">{count}</span>
                <span className="text-sm opacity-80">{config.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Users List by Role */}
      {users && users.length > 0 ? (
        <div className="space-y-8">
          {roleOrder.map((role, roleIndex) => {
            const roleUsers = groupedUsers?.[role]
            if (!roleUsers || roleUsers.length === 0) return null

            const config = roleConfig[role]
            const Icon = config.icon

            return (
              <div key={role} className="animate-slide-up" style={{ animationDelay: `${roleIndex * 100}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-coffee-900">{config.label}</h2>
                  <span className="px-3 py-1 bg-coffee-100 rounded-full text-sm font-medium text-coffee-600">
                    {roleUsers.length} คน
                  </span>
                </div>

                <div className="card-glass overflow-hidden divide-y divide-coffee-100/50">
                  {roleUsers.map((u, index) => (
                    <div
                      key={u.id}
                      className="flex flex-col lg:flex-row lg:items-center gap-4 p-5 hover:bg-gradient-to-r hover:from-cream-50/50 hover:to-transparent transition-all duration-300 group"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-coffee-900 text-lg">{u.name}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-coffee-500 mt-1">
                            {u.branch && (
                              <span className="flex items-center gap-1.5 bg-coffee-100 px-2 py-0.5 rounded-lg">
                                <Building2 className="h-3.5 w-3.5" />
                                {(u.branch as { name: string }).name}
                              </span>
                            )}
                            {u.phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                {u.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <UserForm user={u} branches={branches || []} />
                        <ChevronRight className="h-5 w-5 text-coffee-300 group-hover:text-coffee-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card-glass">
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
