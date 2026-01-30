import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  Construction
} from 'lucide-react'
import type { Profile } from '@/types/database.types'

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coffee-900">รออนุมัติ</h1>
        <p className="text-coffee-500 text-sm mt-1">
          จัดการรายการที่รอการอนุมัติ
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-coffee-500">รอคุณอนุมัติ</p>
              <p className="text-2xl font-bold text-amber-600">0</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-coffee-100 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-coffee-600" />
            </div>
            <div>
              <p className="text-sm text-coffee-500">รอผู้อื่นอนุมัติ</p>
              <p className="text-2xl font-bold text-coffee-600">0</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-coffee-500">ดำเนินการแล้ว</p>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="card p-12 text-center">
        <Construction className="w-16 h-16 mx-auto mb-4 text-amber-400" />
        <h3 className="text-lg font-semibold text-coffee-900 mb-2">
          กำลังพัฒนา
        </h3>
        <p className="text-coffee-500">
          ระบบอนุมัติจะเปิดให้ใช้งานเร็วๆ นี้
        </p>
      </div>
    </div>
  )
}
