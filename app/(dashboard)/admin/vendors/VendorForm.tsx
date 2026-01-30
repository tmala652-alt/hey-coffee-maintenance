'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Vendor } from '@/types/database.types'

interface VendorFormProps {
  vendor?: Vendor
}

export default function VendorForm({ vendor }: VendorFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState({
    company_name: vendor?.company_name || '',
    contact_name: vendor?.contact_name || '',
    phone: vendor?.phone || '',
    email: vendor?.email || '',
    address: vendor?.address || '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    if (vendor) {
      await (supabase.from('vendors') as ReturnType<typeof supabase.from>).update(form).eq('id', vendor.id)
    } else {
      await (supabase.from('vendors') as ReturnType<typeof supabase.from>).insert(form)
    }

    setOpen(false)
    if (!vendor) {
      setForm({
        company_name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
      })
    }
    router.refresh()
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!vendor || !confirm('ยืนยันการลบผู้รับเหมานี้?')) return
    setLoading(true)

    const supabase = createClient()
    await (supabase.from('vendors') as ReturnType<typeof supabase.from>).delete().eq('id', vendor.id)

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
        className="bg-white rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-coffee-100">
          <h2 className="text-lg font-semibold text-coffee-900">
            {vendor ? 'แก้ไขผู้รับเหมา' : 'เพิ่มผู้รับเหมาใหม่'}
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-coffee-400 hover:text-coffee-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">ชื่อบริษัท *</label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) =>
                setForm({ ...form, company_name: e.target.value })
              }
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">ชื่อผู้ติดต่อ</label>
            <input
              type="text"
              value={form.contact_name}
              onChange={(e) =>
                setForm({ ...form, contact_name: e.target.value })
              }
              className="input"
            />
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

          <div>
            <label className="label">อีเมล</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">ที่อยู่</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            {vendor && (
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
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'บันทึก'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={vendor ? 'btn-ghost btn-sm' : 'btn-primary'}
      >
        {vendor ? (
          <Pencil className="h-4 w-4" />
        ) : (
          <>
            <Plus className="h-5 w-5" /> เพิ่มผู้รับเหมา
          </>
        )}
      </button>

      {open && mounted && createPortal(modalContent, document.body)}
    </>
  )
}
