import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Building2,
  Plus,
  ChevronRight,
  Users,
  MapPin,
  Settings,
  MoreHorizontal,
} from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import type { Profile, Organization, Company, Brand } from '@/types/database.types'
import OrganizationTree from './OrganizationTree'

type CompanyWithBrands = Company & {
  brands: Brand[]
  _count?: { branches: number }
}

type OrganizationWithCompanies = Organization & {
  companies: CompanyWithBrands[]
  _count?: { users: number }
}

export default async function AdminOrganizationsPage() {
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

  // Fetch organizations with companies and brands
  const { data: organizations } = await supabase
    .from('organizations')
    .select('*')
    .order('name') as { data: Organization[] | null }

  // Enrich with companies and brands
  const enrichedOrganizations: OrganizationWithCompanies[] = await Promise.all(
    (organizations || []).map(async (org) => {
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .eq('organization_id', org.id)
        .order('name') as { data: Company[] | null }

      const companiesWithBrands = await Promise.all(
        (companies || []).map(async (company) => {
          const { data: brands } = await supabase
            .from('brands')
            .select('*')
            .eq('company_id', company.id)
            .order('name') as { data: Brand[] | null }

          const { count: branchCount } = await supabase
            .from('branches')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', company.id)

          return {
            ...company,
            brands: brands || [],
            _count: { branches: branchCount || 0 },
          }
        })
      )

      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)

      return {
        ...org,
        companies: companiesWithBrands,
        _count: { users: userCount || 0 },
      }
    })
  )

  // Stats
  const totalOrganizations = organizations?.length || 0
  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
  const { count: totalBrands } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-700/30">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            จัดการองค์กร
          </h1>
          <p className="text-coffee-600 mt-1">
            จัดการโครงสร้างองค์กร บริษัท และแบรนด์
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="h-5 w-5" />
          สร้างองค์กรใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-purple-100 to-purple-200">
              <Building2 className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{totalOrganizations}</p>
              <p className="text-sm text-coffee-500">องค์กร</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-sky-100 to-sky-200">
              <Building2 className="h-6 w-6 text-sky-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{totalCompanies || 0}</p>
              <p className="text-sm text-coffee-500">บริษัท</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-honey-100 to-honey-200">
              <MapPin className="h-6 w-6 text-honey-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{totalBrands || 0}</p>
              <p className="text-sm text-coffee-500">แบรนด์</p>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations Tree */}
      <div className="card-glass overflow-hidden">
        <div className="p-4 border-b border-coffee-100">
          <h2 className="text-lg font-semibold text-coffee-900">โครงสร้างองค์กร</h2>
          <p className="text-sm text-coffee-500">องค์กร → บริษัท → แบรนด์ → สาขา</p>
        </div>

        <div className="p-4">
          {enrichedOrganizations.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-coffee-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-coffee-400" />
              </div>
              <h3 className="text-lg font-semibold text-coffee-900 mb-2">ยังไม่มีองค์กร</h3>
              <p className="text-coffee-500">คลิก "สร้างองค์กรใหม่" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <OrganizationTree organizations={enrichedOrganizations} />
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="card p-6 bg-gradient-to-br from-purple-50 to-sky-50 border-purple-200">
        <h3 className="font-semibold text-coffee-900 mb-2">
          💡 เกี่ยวกับโครงสร้าง Multi-Tenant
        </h3>
        <div className="text-sm text-coffee-600 space-y-2">
          <p>
            <strong>องค์กร (Organization)</strong> - ระดับสูงสุด เช่น บริษัทแม่หรือกลุ่มธุรกิจ
          </p>
          <p>
            <strong>บริษัท (Company)</strong> - บริษัทย่อยภายใต้องค์กร
          </p>
          <p>
            <strong>แบรนด์ (Brand)</strong> - แบรนด์หรือเครือข่ายร้านภายใต้บริษัท
          </p>
          <p>
            <strong>สาขา (Branch)</strong> - สาขาของแต่ละแบรนด์
          </p>
        </div>
      </div>
    </div>
  )
}
