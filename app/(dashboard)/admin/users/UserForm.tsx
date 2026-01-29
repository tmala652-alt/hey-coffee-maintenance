'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Branch, RoleEnum } from '@/types/database.types'

interface UserFormProps {
  user: Profile
  branches: Branch[]
}

export default function UserForm({ user, branches }: UserFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    branch_id: user.branch_id || '',
    phone: user.phone || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    await (supabase
      .from('profiles') as ReturnType<typeof supabase.from>)
      .update({
        name: form.name,
        role: form.role,
        branch_id: form.branch_id || null,
        phone: form.phone || null,
      })
      .eq('id', user.id)

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost btn-sm">
        <Pencil className="h-4 w-4" />
        แก้ไข
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-coffee-100">
              <h2 className="text-lg font-semibold text-coffee-900">แก้ไขผู้ใช้</h2>
              <button onClick={() => setOpen(false)} className="text-coffee-400 hover:text-coffee-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">ชื่อ *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">บทบาท *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as RoleEnum })}
                  className="input"
                  required
                >
                  <option value="branch">สาขา</option>
                  <option value="admin">Admin</option>
                  <option value="technician">ช่าง</option>
                  <option value="vendor">ผู้รับเหมา</option>
                </select>
              </div>

              <div>
                <label className="label">สาขา</label>
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  className="input"
                >
                  <option value="">ไม่ระบุ</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">เบอร์โทร</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary flex-1"
                >
                  ยกเลิก
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
