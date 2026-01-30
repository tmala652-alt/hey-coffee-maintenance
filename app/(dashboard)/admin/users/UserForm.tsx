'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Pencil, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Branch, RoleEnum } from '@/types/database.types'

interface UserFormProps {
  user: Profile
  branches: Branch[]
}

const roleOptions: { value: RoleEnum; label: string }[] = [
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
  { value: 'manager', label: 'ผู้จัดการ' },
  { value: 'technician', label: 'ช่างเทคนิค' },
  { value: 'branch', label: 'พนักงานสาขา' },
  { value: 'vendor', label: 'ผู้รับเหมา' },
]

export default function UserForm({ user, branches }: UserFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    branch_id: user.branch_id || '',
    phone: user.phone || '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        name: form.name,
        role: form.role,
        branch_id: form.branch_id || null,
        phone: form.phone || null,
      })
      .eq('id', user.id)

    if (error) {
      console.error('Update error:', error)
      alert('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-coffee-100">
          <h2 className="text-lg font-semibold text-coffee-900">แก้ไขผู้ใช้: {user.name}</h2>
          <button onClick={() => setOpen(false)} className="text-coffee-400 hover:text-coffee-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1">ชื่อ *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1">บทบาท *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as RoleEnum })}
              className="w-full px-3 py-2 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
              required
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1">สาขา</label>
            <select
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
              className="w-full px-3 py-2 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
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
            <label className="block text-sm font-medium text-coffee-700 mb-1">เบอร์โทร</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2 border border-coffee-200 text-coffee-700 rounded-lg hover:bg-coffee-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-coffee-800 text-white rounded-lg hover:bg-coffee-900 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-coffee-500 hover:text-coffee-700 p-1">
        <Pencil className="h-4 w-4" />
      </button>

      {open && mounted && createPortal(modalContent, document.body)}
    </>
  )
}
