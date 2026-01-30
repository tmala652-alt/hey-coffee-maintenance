import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Truck, Phone, Mail, MapPin, User, Building } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import VendorForm from './VendorForm'
import type { Profile, Vendor } from '@/types/database.types'

export default async function VendorsPage() {
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

  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .order('company_name') as { data: Vendor[] | null }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-coffee-900">ผู้รับเหมา</h1>
          <p className="text-coffee-500 mt-1">{vendors?.length || 0} รายในระบบ</p>
        </div>
        <VendorForm />
      </div>

      {/* Vendors List */}
      {vendors && vendors.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-honey-100 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-honey-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-coffee-900">{vendor.company_name}</h3>
                    {vendor.contact_name && (
                      <p className="text-sm text-coffee-500 flex items-center gap-1.5 mt-0.5">
                        <User className="h-3.5 w-3.5" />
                        {vendor.contact_name}
                      </p>
                    )}
                  </div>
                </div>
                <VendorForm vendor={vendor} />
              </div>

              <div className="space-y-2 pt-3 border-t border-coffee-100">
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-sm text-coffee-600">
                    <Phone className="h-4 w-4 text-coffee-400" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-sm text-coffee-600">
                    <Mail className="h-4 w-4 text-coffee-400" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start gap-2 text-sm text-coffee-600">
                    <MapPin className="h-4 w-4 text-coffee-400 mt-0.5" />
                    <span className="line-clamp-2">{vendor.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={Truck}
            title="ยังไม่มีผู้รับเหมา"
            description="เพิ่มผู้รับเหมาเพื่อมอบหมายงานซ่อมภายนอก"
          />
        </div>
      )}
    </div>
  )
}
