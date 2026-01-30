'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Loader2, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Equipment, Branch } from '@/types/database.types'

interface EquipmentFormProps {
  equipment?: Equipment
  branches: Branch[]
}

const categories = [
  { value: 'coffee_machine', label: 'เครื่องชงกาแฟ' },
  { value: 'grinder', label: 'เครื่องบดกาแฟ' },
  { value: 'refrigerator', label: 'ตู้เย็น/ตู้แช่' },
  { value: 'air_con', label: 'เครื่องปรับอากาศ' },
  { value: 'water_heater', label: 'เครื่องทำน้ำร้อน' },
  { value: 'pos', label: 'เครื่อง POS' },
  { value: 'printer', label: 'เครื่องพิมพ์' },
  { value: 'other', label: 'อื่นๆ' },
]

const locations = [
  'เคาน์เตอร์บาร์',
  'ห้องครัว',
  'หน้าร้าน',
  'ห้องเก็บของ',
  'ด้านหลังร้าน',
]

export default function EquipmentForm({ equipment, branches }: EquipmentFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState({
    branch_id: equipment?.branch_id || '',
    name: equipment?.name || '',
    category: equipment?.category || '',
    brand: equipment?.brand || '',
    model: equipment?.model || '',
    serial_number: equipment?.serial_number || '',
    purchase_date: equipment?.purchase_date || '',
    warranty_expiry: equipment?.warranty_expiry || '',
    location: equipment?.location || '',
    status: equipment?.status || 'active',
    notes: equipment?.notes || '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const payload = {
      branch_id: form.branch_id,
      name: form.name,
      category: form.category,
      brand: form.brand || null,
      model: form.model || null,
      serial_number: form.serial_number || null,
      purchase_date: form.purchase_date || null,
      warranty_expiry: form.warranty_expiry || null,
      location: form.location || null,
      status: form.status,
      notes: form.notes || null,
    }

    let result
    if (equipment) {
      result = await supabase
        .from('equipment')
        .update(payload as never)
        .eq('id', equipment.id)
    } else {
      result = await supabase
        .from('equipment')
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
    if (!equipment || !confirm('ยืนยันการลบอุปกรณ์นี้?')) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const result = await supabase
      .from('equipment')
      .delete()
      .eq('id', equipment.id)

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
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-coffee-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-coffee-900">
            {equipment ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}
          </h2>
          <button onClick={() => setOpen(false)} className="text-coffee-400 hover:text-coffee-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-cherry-50 border border-cherry-200 rounded-lg flex items-center gap-2 text-cherry-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">สาขา *</label>
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                className="input"
                required
              >
                <option value="">-- เลือกสาขา --</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">ชื่ออุปกรณ์ *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="เช่น เครื่องชงกาแฟ #1"
                required
              />
            </div>

            <div>
              <label className="label">ประเภท *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input"
                required
              >
                <option value="">-- เลือกประเภท --</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">ตำแหน่ง</label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="input"
              >
                <option value="">-- เลือกตำแหน่ง --</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">ยี่ห้อ</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="input"
                placeholder="เช่น La Marzocco"
              />
            </div>

            <div>
              <label className="label">รุ่น</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="input"
                placeholder="เช่น Linea Mini"
              />
            </div>

            <div className="col-span-2">
              <label className="label">Serial Number</label>
              <input
                type="text"
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                className="input font-mono"
                placeholder="หมายเลขเครื่อง"
              />
            </div>

            <div>
              <label className="label">วันที่ซื้อ</label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">หมดประกัน</label>
              <input
                type="date"
                value={form.warranty_expiry}
                onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })}
                className="input"
              />
            </div>

            {equipment && (
              <div className="col-span-2">
                <label className="label">สถานะ</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input"
                >
                  <option value="active">ใช้งานปกติ</option>
                  <option value="under_repair">กำลังซ่อม</option>
                  <option value="retired">ปลดระวาง</option>
                </select>
              </div>
            )}

            <div className="col-span-2">
              <label className="label">หมายเหตุ</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input"
                rows={2}
                placeholder="รายละเอียดเพิ่มเติม..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {equipment && (
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
        className={equipment ? 'btn-ghost btn-sm' : 'btn-primary'}
      >
        {equipment ? <Pencil className="h-4 w-4" /> : <><Plus className="h-5 w-5" /> เพิ่มอุปกรณ์</>}
      </button>

      {open && mounted && createPortal(modalContent, document.body)}
    </>
  )
}
