'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/database.types'

interface BranchFormProps {
  branch?: Branch
}

export default function BranchForm({ branch }: BranchFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    code: branch?.code || '',
    name: branch?.name || '',
    region: branch?.region || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const payload = {
      code: form.code,
      name: form.name,
      region: form.region || null,
    }

    if (branch) {
      await (supabase
        .from('branches') as ReturnType<typeof supabase.from>)
        .update(payload)
        .eq('id', branch.id)
    } else {
      await (supabase
        .from('branches') as ReturnType<typeof supabase.from>)
        .insert(payload)
    }

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!branch || !confirm('ยืนยันการลบสาขานี้?')) return
    setLoading(true)

    const supabase = createClient()
    await (supabase
      .from('branches') as ReturnType<typeof supabase.from>)
      .delete()
      .eq('id', branch.id)

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={branch ? 'btn-ghost btn-sm' : 'btn-primary'}
      >
        {branch ? <Pencil className="h-4 w-4" /> : <><Plus className="h-5 w-5" /> เพิ่มสาขา</>}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-coffee-100">
              <h2 className="text-lg font-semibold text-coffee-900">
                {branch ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-coffee-400 hover:text-coffee-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">รหัสสาขา *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="input"
                  placeholder="เช่น BKK01"
                  required
                />
              </div>

              <div>
                <label className="label">ชื่อสาขา *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="เช่น Hey! Coffee สยามพารากอน"
                  required
                />
              </div>

              <div>
                <label className="label">ภูมิภาค</label>
                <input
                  type="text"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="input"
                  placeholder="เช่น กรุงเทพฯ"
                />
              </div>

              <div className="flex gap-3 pt-4">
                {branch && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="btn-danger"
                  >
                    ลบ
                  </button>
                )}
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
