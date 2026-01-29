'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, User, Bell, Save, Loader2, Building2, Phone, Mail, Check, UserCog } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Branch } from '@/types/database.types'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])

  const [form, setForm] = useState({
    name: '',
    phone: '',
    branch_id: '',
  })

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as { data: Profile | null }

      const { data: branchesData } = await supabase
        .from('branches')
        .select('*')
        .order('name') as { data: Branch[] | null }

      if (profileData) {
        setProfile(profileData)
        setForm({
          name: profileData.name || '',
          phone: profileData.phone || '',
          branch_id: profileData.branch_id || '',
        })
      }

      setBranches(branchesData || [])
      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    setSuccess(false)

    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        name: form.name,
        phone: form.phone,
        branch_id: form.branch_id || null,
      })
      .eq('id', profile.id)

    setSaving(false)

    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-coffee-500" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coffee-900 flex items-center gap-3">
          <UserCog className="h-7 w-7 text-coffee-600" />
          จัดการข้อมูล
        </h1>
        <p className="text-coffee-600 mt-1">จัดการข้อมูลส่วนตัวและบัญชีของคุณ</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-matcha-50 border border-matcha-200 rounded-xl p-4 flex items-center gap-3 animate-slide-down">
          <Check className="h-5 w-5 text-matcha-600" />
          <span className="text-matcha-700 font-medium">บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Profile & Account Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-coffee-100 rounded-xl flex items-center justify-center">
            <User className="h-5 w-5 text-coffee-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-coffee-900">ข้อมูลส่วนตัว</h2>
            <p className="text-sm text-coffee-500">แก้ไขข้อมูลโปรไฟล์ของคุณ</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-coffee-200 to-coffee-300 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-bold text-coffee-700">
                {form.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-coffee-900">{form.name || 'ไม่ระบุชื่อ'}</p>
              <p className="text-sm text-coffee-500 capitalize">{profile?.role}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label">
              <User className="h-4 w-4 inline mr-2" />
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="ชื่อของคุณ"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="label">
              <Phone className="h-4 w-4 inline mr-2" />
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              placeholder="0xx-xxx-xxxx"
            />
          </div>

          {/* Branch */}
          {profile?.role !== 'admin' && (
            <div>
              <label className="label">
                <Building2 className="h-4 w-4 inline mr-2" />
                สาขาที่สังกัด
              </label>
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                className="input"
              >
                <option value="">ไม่ระบุสาขา</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Account Info - Integrated */}
          <div className="pt-4 mt-4 border-t border-coffee-100">
            <p className="text-sm font-medium text-coffee-700 mb-3">ข้อมูลบัญชี</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 bg-cream-50 px-3 rounded-lg">
                <span className="text-coffee-500 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  อีเมล
                </span>
                <span className="text-coffee-900 font-medium">{profile?.email}</span>
              </div>
              <div className="flex justify-between py-2 bg-cream-50 px-3 rounded-lg">
                <span className="text-coffee-500">บทบาท</span>
                <span className="text-coffee-900 font-medium capitalize">{profile?.role}</span>
              </div>
              <div className="flex justify-between py-2 bg-cream-50 px-3 rounded-lg">
                <span className="text-coffee-500">สร้างบัญชีเมื่อ</span>
                <span className="text-coffee-900 font-medium">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-honey-100 rounded-xl flex items-center justify-center">
            <Bell className="h-5 w-5 text-honey-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-coffee-900">การแจ้งเตือน</h2>
            <p className="text-sm text-coffee-500">ตั้งค่าการรับการแจ้งเตือน</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-cream-50 rounded-xl cursor-pointer hover:bg-cream-100 transition-colors">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-coffee-500" />
              <div>
                <p className="font-medium text-coffee-900">แจ้งเตือนทางอีเมล</p>
                <p className="text-sm text-coffee-500">รับการแจ้งเตือนเมื่อมีการอัพเดทงาน</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications.email_notifications}
              onChange={(e) => setNotifications({ ...notifications, email_notifications: e.target.checked })}
              className="w-5 h-5 rounded border-coffee-300 text-coffee-600 focus:ring-coffee-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-cream-50 rounded-xl cursor-pointer hover:bg-cream-100 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-coffee-500" />
              <div>
                <p className="font-medium text-coffee-900">Push Notification</p>
                <p className="text-sm text-coffee-500">รับการแจ้งเตือนบนเบราว์เซอร์</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications.push_notifications}
              onChange={(e) => setNotifications({ ...notifications, push_notifications: e.target.checked })}
              className="w-5 h-5 rounded border-coffee-300 text-coffee-600 focus:ring-coffee-500"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-8"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              บันทึกการตั้งค่า
            </>
          )}
        </button>
      </div>
    </div>
  )
}
