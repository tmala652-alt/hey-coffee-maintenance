import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, MapPin, Store, Hash, Globe } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import BranchForm from './BranchForm'
import type { Branch, Profile } from '@/types/database.types'

const regionColors: Record<string, string> = {
  'กรุงเทพและปริมณฑล': 'from-honey-100 to-honey-200 text-honey-700 border-honey-300',
  'ภาคกลาง': 'from-matcha-100 to-matcha-200 text-matcha-700 border-matcha-300',
  'ภาคเหนือ': 'from-blue-100 to-blue-200 text-blue-700 border-blue-300',
  'ภาคตะวันออกเฉียงเหนือ': 'from-purple-100 to-purple-200 text-purple-700 border-purple-300',
  'ภาคตะวันออก': 'from-orange-100 to-orange-200 text-orange-700 border-orange-300',
  'ภาคใต้': 'from-cyan-100 to-cyan-200 text-cyan-700 border-cyan-300',
  'อื่นๆ': 'from-coffee-100 to-coffee-200 text-coffee-700 border-coffee-300',
}

export default async function BranchesPage() {
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

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .order('region')
    .order('name') as { data: Branch[] | null }

  // Group by region
  const groupedBranches = branches?.reduce((acc, branch) => {
    const region = branch.region || 'อื่นๆ'
    if (!acc[region]) acc[region] = []
    acc[region].push(branch)
    return acc
  }, {} as Record<string, Branch[]>)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-coffee-600 to-coffee-800 rounded-xl flex items-center justify-center shadow-lg shadow-coffee-700/30">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            จัดการสาขา
          </h1>
          <p className="text-coffee-600 mt-1 flex items-center gap-2">
            <Store className="h-4 w-4" />
            {branches?.length || 0} สาขาทั้งหมด
          </p>
        </div>
        <BranchForm />
      </div>

      {/* Branches List */}
      {branches && branches.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedBranches || {}).map(([region, regionBranches], regionIndex) => (
            <div key={region} className="animate-slide-up" style={{ animationDelay: `${regionIndex * 100}ms` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${regionColors[region] || regionColors['อื่นๆ']}`}>
                  <Globe className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-coffee-900">{region}</h2>
                <span className="px-3 py-1 bg-coffee-100 rounded-full text-sm font-medium text-coffee-600">
                  {regionBranches?.length} สาขา
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regionBranches?.map((branch, index) => (
                  <div
                    key={branch.id}
                    className="card-hover p-5 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Building2 className="h-7 w-7 text-coffee-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-coffee-900 truncate text-lg">
                          {branch.name}
                        </h3>
                        <p className="text-sm text-coffee-500 flex items-center gap-1.5 mt-1">
                          <Hash className="h-3.5 w-3.5" />
                          รหัส: <span className="font-mono font-medium">{branch.code}</span>
                        </p>
                      </div>
                      <BranchForm branch={branch} />
                    </div>
                  </div>
                ))}
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
    </div>
  )
}
