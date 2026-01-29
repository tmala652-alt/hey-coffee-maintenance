import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Shield, Bell, Clock, Wrench, Building2, Users, Database, Globe } from 'lucide-react'
import type { Profile, Branch } from '@/types/database.types'

export default async function AdminSettingsPage() {
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

  // Get statistics
  const { count: branchCount } = await supabase
    .from('branches')
    .select('*', { count: 'exact', head: true })

  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: vendorCount } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: true })

  const { count: requestCount } = await supabase
    .from('maintenance_requests')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coffee-900 flex items-center gap-3">
          <Shield className="h-7 w-7 text-coffee-600" />
          ตั้งค่าระบบ
        </h1>
        <p className="text-coffee-600 mt-1">จัดการการตั้งค่าระบบและดูข้อมูลสรุป</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-coffee-100 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-coffee-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{branchCount || 0}</p>
              <p className="text-sm text-coffee-500">สาขา</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{userCount || 0}</p>
              <p className="text-sm text-coffee-500">ผู้ใช้งาน</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-honey-100 rounded-xl flex items-center justify-center">
              <Wrench className="h-6 w-6 text-honey-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{requestCount || 0}</p>
              <p className="text-sm text-coffee-500">งานแจ้งซ่อม</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-matcha-100 rounded-xl flex items-center justify-center">
              <Database className="h-6 w-6 text-matcha-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">{vendorCount || 0}</p>
              <p className="text-sm text-coffee-500">ผู้รับเหมา</p>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Settings */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-honey-100 rounded-xl flex items-center justify-center">
            <Clock className="h-5 w-5 text-honey-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-coffee-900">ตั้งค่า SLA</h2>
            <p className="text-sm text-coffee-500">กำหนดระยะเวลาดำเนินการตามความสำคัญ</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-coffee-500 pb-2 border-b border-coffee-100">
            <span>ความสำคัญ</span>
            <span>SLA เริ่มต้น</span>
            <span>คำอธิบาย</span>
            <span></span>
          </div>

          {[
            { priority: 'เร่งด่วนมาก (Critical)', sla: '4 ชั่วโมง', desc: 'ปัญหาที่ส่งผลกระทบร้ายแรง', color: 'cherry' },
            { priority: 'สูง (High)', sla: '8 ชั่วโมง', desc: 'ปัญหาสำคัญที่ต้องแก้ไขเร็ว', color: 'orange' },
            { priority: 'ปานกลาง (Medium)', sla: '24 ชั่วโมง', desc: 'ปัญหาทั่วไป', color: 'honey' },
            { priority: 'ต่ำ (Low)', sla: '48 ชั่วโมง', desc: 'ปัญหาไม่เร่งด่วน', color: 'matcha' },
          ].map((item, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 items-center py-3 border-b border-coffee-50">
              <span className="font-medium text-coffee-900">{item.priority}</span>
              <span className={`text-${item.color}-600 font-semibold`}>{item.sla}</span>
              <span className="text-coffee-500 text-sm">{item.desc}</span>
              <span className="text-right">
                <span className="text-xs text-coffee-400">ค่าเริ่มต้นระบบ</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-coffee-900">การแจ้งเตือน</h2>
            <p className="text-sm text-coffee-500">ตั้งค่าการแจ้งเตือนของระบบ</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-cream-50 rounded-xl cursor-pointer hover:bg-cream-100 transition-colors">
            <div>
              <p className="font-medium text-coffee-900">แจ้งเตือนงานใหม่</p>
              <p className="text-sm text-coffee-500">ส่งการแจ้งเตือนเมื่อมีงานแจ้งซ่อมใหม่</p>
            </div>
            <div className="w-12 h-6 bg-matcha-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </label>

          <label className="flex items-center justify-between p-4 bg-cream-50 rounded-xl cursor-pointer hover:bg-cream-100 transition-colors">
            <div>
              <p className="font-medium text-coffee-900">แจ้งเตือน SLA ใกล้ครบกำหนด</p>
              <p className="text-sm text-coffee-500">แจ้งเตือนเมื่อ SLA เหลือน้อยกว่า 20%</p>
            </div>
            <div className="w-12 h-6 bg-matcha-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </label>

          <label className="flex items-center justify-between p-4 bg-cream-50 rounded-xl cursor-pointer hover:bg-cream-100 transition-colors">
            <div>
              <p className="font-medium text-coffee-900">สรุปรายวัน</p>
              <p className="text-sm text-coffee-500">ส่งสรุปงานประจำวันทางอีเมล</p>
            </div>
            <div className="w-12 h-6 bg-coffee-200 rounded-full relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </label>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-coffee-100 rounded-xl flex items-center justify-center">
            <Globe className="h-5 w-5 text-coffee-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-coffee-900">การจัดการ</h2>
            <p className="text-sm text-coffee-500">ลิงก์ไปยังหน้าจัดการต่างๆ</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/admin/branches" className="p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors group">
            <Building2 className="h-8 w-8 text-coffee-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-coffee-900">จัดการสาขา</p>
            <p className="text-sm text-coffee-500">{branchCount || 0} สาขา</p>
          </a>

          <a href="/admin/users" className="p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors group">
            <Users className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-coffee-900">จัดการผู้ใช้</p>
            <p className="text-sm text-coffee-500">{userCount || 0} คน</p>
          </a>

          <a href="/admin/vendors" className="p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors group">
            <Database className="h-8 w-8 text-honey-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-coffee-900">ผู้รับเหมา</p>
            <p className="text-sm text-coffee-500">{vendorCount || 0} ราย</p>
          </a>

          <a href="/admin/reports" className="p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors group">
            <Wrench className="h-8 w-8 text-matcha-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-coffee-900">รายงาน</p>
            <p className="text-sm text-coffee-500">ดูสถิติ</p>
          </a>
        </div>
      </div>

      {/* System Info */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Settings className="h-5 w-5 text-purple-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-coffee-900">ข้อมูลระบบ</h2>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between py-2 border-b border-coffee-100">
            <span className="text-coffee-500">เวอร์ชัน</span>
            <span className="text-coffee-900 font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-coffee-100">
            <span className="text-coffee-500">สภาพแวดล้อม</span>
            <span className="text-coffee-900 font-medium">Production</span>
          </div>
          <div className="flex justify-between py-2 border-b border-coffee-100">
            <span className="text-coffee-500">ฐานข้อมูล</span>
            <span className="text-matcha-600 font-medium">เชื่อมต่อแล้ว</span>
          </div>
          <div className="flex justify-between py-2 border-b border-coffee-100">
            <span className="text-coffee-500">Storage</span>
            <span className="text-matcha-600 font-medium">พร้อมใช้งาน</span>
          </div>
        </div>
      </div>
    </div>
  )
}
