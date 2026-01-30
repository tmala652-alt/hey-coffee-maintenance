'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Pencil, Loader2, X, Shield, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Branch, RoleEnum } from '@/types/database.types'

interface Permission {
  id: string
  code: string
  name: string
  description: string | null
  category: string
}

interface UserPermission {
  permission_id: string
}

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

const categoryLabels: Record<string, string> = {
  requests: 'งานแจ้งซ่อม',
  users: 'ผู้ใช้งาน',
  admin: 'การจัดการ',
  reports: 'รายงาน',
  finance: 'การเงิน',
}

export default function UserForm({ user, branches }: UserFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'info' | 'permissions'>('info')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    branch_id: user.branch_id || '',
    phone: user.phone || '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      loadPermissions()
    }
  }, [open])

  const loadPermissions = async () => {
    const supabase = createClient()

    const [permRes, userPermRes] = await Promise.all([
      supabase.from('permissions').select('*').order('category').order('name'),
      supabase.from('user_permissions').select('permission_id').eq('user_id', user.id)
    ])

    if (permRes.data) setPermissions(permRes.data)
    if (userPermRes.data) setUserPermissions(userPermRes.data.map(up => up.permission_id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        name: form.name,
        role: form.role as RoleEnum,
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

  const togglePermission = async (permissionId: string) => {
    const supabase = createClient()
    const hasPermission = userPermissions.includes(permissionId)

    if (hasPermission) {
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', user.id)
        .eq('permission_id', permissionId)

      setUserPermissions(prev => prev.filter(id => id !== permissionId))
    } else {
      await supabase
        .from('user_permissions')
        .insert({ user_id: user.id, permission_id: permissionId })

      setUserPermissions(prev => [...prev, permissionId])
    }
  }

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-coffee-100">
          <h2 className="text-lg font-semibold text-coffee-900">แก้ไขผู้ใช้: {user.name}</h2>
          <button onClick={() => setOpen(false)} className="text-coffee-400 hover:text-coffee-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-coffee-100">
          <button
            onClick={() => setTab('info')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'info'
                ? 'text-coffee-900 border-b-2 border-coffee-900'
                : 'text-coffee-500 hover:text-coffee-700'
            }`}
          >
            ข้อมูลทั่วไป
          </button>
          <button
            onClick={() => setTab('permissions')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              tab === 'permissions'
                ? 'text-coffee-900 border-b-2 border-coffee-900'
                : 'text-coffee-500 hover:text-coffee-700'
            }`}
          >
            <Shield className="h-4 w-4" />
            สิทธิ์การใช้งาน
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'info' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
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
          ) : (
            <div className="space-y-6">
              {user.role === 'admin' ? (
                <div className="text-center py-8 text-coffee-500">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-purple-500" />
                  <p className="font-medium text-coffee-700">ผู้ดูแลระบบมีสิทธิ์ทั้งหมด</p>
                  <p className="text-sm">ไม่จำเป็นต้องกำหนดสิทธิ์เพิ่มเติม</p>
                </div>
              ) : (
                Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-coffee-700 mb-2">
                      {categoryLabels[category] || category}
                    </h4>
                    <div className="space-y-1">
                      {perms.map((perm) => {
                        const isGranted = userPermissions.includes(perm.id)
                        return (
                          <button
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                              isGranted
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-coffee-50 border border-transparent hover:border-coffee-200'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center ${
                                isGranted ? 'bg-green-500' : 'bg-coffee-200'
                              }`}
                            >
                              {isGranted && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isGranted ? 'text-green-700' : 'text-coffee-700'}`}>
                                {perm.name}
                              </p>
                              {perm.description && (
                                <p className="text-xs text-coffee-500 truncate">{perm.description}</p>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
