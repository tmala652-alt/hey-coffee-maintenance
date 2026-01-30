'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Loader2, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, TablesUpdate } from '@/types/database.types'

interface BranchFormProps {
  branch?: Branch
}

export default function BranchForm({ branch }: BranchFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState({
    code: branch?.code || '',
    name: branch?.name || '',
    region: branch?.region || '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const payload: TablesUpdate<'branches'> = {
      code: form.code,
      name: form.name,
      region: form.region || null,
    }

    let result
    if (branch) {
      result = await supabase
        .from('branches')
        .update(payload as never)
        .eq('id', branch.id)
    } else {
      result = await supabase
        .from('branches')
        .insert(payload as never)
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!branch || !confirm('ยืนยันการลบสาขานี้?')) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const result = await supabase
      .from('branches')
      .delete()
      .eq('id', branch.id)

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
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
        className="bg-white rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-coffee-100">
          <h2 className="text-lg font-semibold text-coffee-900">
            {branch ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}
          </h2>
          <button onClick={() => setOpen(false)} className="text-coffee-400 hover:text-coffee-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-cherry-50 border border-cherry-200 rounded-lg flex items-center gap-2 text-cherry-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
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
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={branch ? 'btn-ghost btn-sm' : 'btn-primary cursor-pointer'}
      >
        {branch ? <Pencil className="h-4 w-4" /> : <><Plus className="h-5 w-5" /> เพิ่มสาขา</>}
      </button>

      {open && mounted && createPortal(modalContent, document.body)}
    </>
  )
}
