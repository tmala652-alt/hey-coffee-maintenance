'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Loader2, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { MaintenanceSchedule, Branch, Profile, Vendor } from '@/types/database.types'

interface ScheduleFormProps {
  schedule?: MaintenanceSchedule
  branches: Branch[]
  technicians: Profile[]
  vendors: Vendor[]
}

const categories = [
  { value: 'coffee_machine', label: 'เครื่องชงกาแฟ' },
  { value: 'grinder', label: 'เครื่องบดกาแฟ' },
  { value: 'refrigerator', label: 'ตู้เย็น/ตู้แช่' },
  { value: 'air_con', label: 'เครื่องปรับอากาศ' },
  { value: 'general', label: 'ทั่วไป' },
  { value: 'cleaning', label: 'ทำความสะอาด' },
  { value: 'inspection', label: 'ตรวจสอบ' },
]

const frequencies = [
  { value: 7, label: 'ทุกสัปดาห์ (7 วัน)' },
  { value: 14, label: 'ทุก 2 สัปดาห์ (14 วัน)' },
  { value: 30, label: 'ทุกเดือน (30 วัน)' },
  { value: 60, label: 'ทุก 2 เดือน (60 วัน)' },
  { value: 90, label: 'ทุกไตรมาส (90 วัน)' },
  { value: 180, label: 'ทุก 6 เดือน (180 วัน)' },
  { value: 365, label: 'ทุกปี (365 วัน)' },
]

export default function ScheduleForm({ schedule, branches, technicians, vendors }: ScheduleFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assignType, setAssignType] = useState<'technician' | 'vendor'>(
    schedule?.assigned_vendor_id ? 'vendor' : 'technician'
  )

  const getDefaultNextDue = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
  }

  const [form, setForm] = useState({
    name: schedule?.name || '',
    description: schedule?.description || '',
    category: schedule?.category || '',
    frequency_days: schedule?.frequency_days || 30,
    branch_id: schedule?.branch_id || '',
    assigned_user_id: schedule?.assigned_user_id || '',
    assigned_vendor_id: schedule?.assigned_vendor_id || '',
    priority: schedule?.priority || 'medium',
    next_due_at: schedule?.next_due_at?.split('T')[0] || getDefaultNextDue(),
    is_active: schedule?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const payload = {
      name: form.name,
      description: form.description || null,
      category: form.category,
      frequency_days: form.frequency_days,
      branch_id: form.branch_id || null,
      assigned_user_id: assignType === 'technician' ? form.assigned_user_id || null : null,
      assigned_vendor_id: assignType === 'vendor' ? form.assigned_vendor_id || null : null,
      priority: form.priority,
      next_due_at: form.next_due_at,
      is_active: form.is_active,
    }

    let result
    if (schedule) {
      result = await supabase
        .from('maintenance_schedules')
        .update(payload)
        .eq('id', schedule.id)
    } else {
      result = await supabase
        .from('maintenance_schedules')
        .insert(payload)
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
    if (!schedule || !confirm('ยืนยันการลบตารางนี้?')) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const result = await supabase
      .from('maintenance_schedules')
      .delete()
      .eq('id', schedule.id)

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={schedule ? 'btn-ghost btn-sm' : 'btn-primary'}
      >
        {schedule ? <Pencil className="h-4 w-4" /> : <><Plus className="h-5 w-5" /> เพิ่มตาราง</>}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-coffee-100 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-coffee-900">
                {schedule ? 'แก้ไขตารางบำรุงรักษา' : 'เพิ่มตารางใหม่'}
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

              <div>
                <label className="label">ชื่องาน *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="เช่น ล้างแอร์ประจำเดือน"
                  required
                />
              </div>

              <div>
                <label className="label">รายละเอียด</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="รายละเอียดงานที่ต้องทำ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">ประเภท *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">-- เลือก --</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">ความถี่ *</label>
                  <select
                    value={form.frequency_days}
                    onChange={(e) => setForm({ ...form, frequency_days: parseInt(e.target.value) })}
                    className="input"
                    required
                  >
                    {frequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">สาขา (เว้นว่างหาก = ทุกสาขา)</label>
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  className="input"
                >
                  <option value="">ทุกสาขา</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">มอบหมายให้</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={assignType === 'technician'}
                      onChange={() => setAssignType('technician')}
                      className="text-coffee-600"
                    />
                    <span className="text-sm text-coffee-700">ช่างเทคนิค</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={assignType === 'vendor'}
                      onChange={() => setAssignType('vendor')}
                      className="text-coffee-600"
                    />
                    <span className="text-sm text-coffee-700">ผู้รับเหมา</span>
                  </label>
                </div>
                {assignType === 'technician' ? (
                  <select
                    value={form.assigned_user_id}
                    onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}
                    className="input"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={form.assigned_vendor_id}
                    onChange={(e) => setForm({ ...form, assigned_vendor_id: e.target.value })}
                    className="input"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.company_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">ความสำคัญ</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="input"
                  >
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">สูง</option>
                    <option value="critical">เร่งด่วน</option>
                  </select>
                </div>

                <div>
                  <label className="label">ครั้งถัดไป *</label>
                  <input
                    type="date"
                    value={form.next_due_at}
                    onChange={(e) => setForm({ ...form, next_due_at: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              {schedule && (
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-coffee-300 text-coffee-600"
                    />
                    <span className="text-sm text-coffee-700">เปิดใช้งาน</span>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {schedule && (
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
