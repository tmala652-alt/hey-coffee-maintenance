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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-honey-500 to-honey-700 rounded-xl flex items-center justify-center shadow-lg shadow-honey-700/30">
              <Truck className="h-5 w-5 text-white" />
            </div>
            ผู้รับเหมา
          </h1>
          <p className="text-coffee-600 mt-1">{vendors?.length || 0} รายในระบบ</p>
        </div>
        <VendorForm />
      </div>

      {/* Vendors List */}
      {vendors && vendors.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vendors.map((vendor, index) => (
            <div
              key={vendor.id}
              className="card-hover p-6 space-y-4 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-honey-100 to-honey-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Building className="h-7 w-7 text-honey-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-coffee-900 text-lg">
                      {vendor.company_name}
                    </h3>
                    {vendor.contact_name && (
                      <p className="text-sm text-coffee-600 flex items-center gap-1.5 mt-1">
                        <User className="h-3.5 w-3.5" />
                        {vendor.contact_name}
                      </p>
                    )}
                  </div>
                </div>
                <VendorForm vendor={vendor} />
              </div>

              <div className="space-y-2.5 pt-2 border-t border-coffee-100">
                {vendor.phone && (
                  <div className="flex items-center gap-3 text-sm text-coffee-600 hover:text-coffee-800 transition-colors">
                    <div className="w-8 h-8 bg-coffee-50 rounded-lg flex items-center justify-center">
                      <Phone className="h-4 w-4 text-coffee-500" />
                    </div>
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-3 text-sm text-coffee-600 hover:text-coffee-800 transition-colors">
                    <div className="w-8 h-8 bg-coffee-50 rounded-lg flex items-center justify-center">
                      <Mail className="h-4 w-4 text-coffee-500" />
                    </div>
                    <span className="truncate">{vendor.email}</span>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start gap-3 text-sm text-coffee-600">
                    <div className="w-8 h-8 bg-coffee-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-coffee-500" />
                    </div>
                    <span className="line-clamp-2">{vendor.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-glass">
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
