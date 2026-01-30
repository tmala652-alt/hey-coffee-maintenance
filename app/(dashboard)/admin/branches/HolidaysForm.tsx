'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Loader2,
  X,
  AlertCircle,
  Check,
  Plus,
  Trash2,
  Repeat,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Holiday } from '@/types/database.types'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { clsx } from 'clsx'

interface HolidaysFormProps {
  branchId?: string // If null, applies to all branches
  branchName?: string
}

// Common Thai holidays
const COMMON_HOLIDAYS = [
  { date: '01-01', name: 'วันขึ้นปีใหม่', isRecurring: true },
  { date: '02-26', name: 'วันมาฆบูชา', isRecurring: false },
  { date: '04-06', name: 'วันจักรี', isRecurring: true },
  { date: '04-13', name: 'วันสงกรานต์', isRecurring: true },
  { date: '04-14', name: 'วันสงกรานต์', isRecurring: true },
  { date: '04-15', name: 'วันสงกรานต์', isRecurring: true },
  { date: '05-01', name: 'วันแรงงาน', isRecurring: true },
  { date: '05-04', name: 'วันฉัตรมงคล', isRecurring: true },
  { date: '05-24', name: 'วันวิสาขบูชา', isRecurring: false },
  { date: '06-03', name: 'วันเฉลิมพระชนมพรรษา สมเด็จพระราชินี', isRecurring: true },
  { date: '07-22', name: 'วันอาสาฬหบูชา', isRecurring: false },
  { date: '07-23', name: 'วันเข้าพรรษา', isRecurring: false },
  { date: '07-28', name: 'วันเฉลิมพระชนมพรรษา ร.10', isRecurring: true },
  { date: '08-12', name: 'วันแม่แห่งชาติ', isRecurring: true },
  { date: '10-13', name: 'วันคล้ายวันสวรรคต ร.9', isRecurring: true },
  { date: '10-23', name: 'วันปิยมหาราช', isRecurring: true },
  { date: '12-05', name: 'วันพ่อแห่งชาติ', isRecurring: true },
  { date: '12-10', name: 'วันรัฐธรรมนูญ', isRecurring: true },
  { date: '12-31', name: 'วันสิ้นปี', isRecurring: true },
]

export default function HolidaysForm({ branchId, branchName }: HolidaysFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', isRecurring: false })
  const [mounted, setMounted] = useState(false)

  // For portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch existing holidays
  useEffect(() => {
    if (!open) return

    const fetchHolidays = async () => {
      setFetching(true)
      const supabase = createClient()

      let query = supabase
        .from('holidays')
        .select('*')
        .order('date')

      if (branchId) {
        query = query.eq('branch_id', branchId)
      } else {
        query = query.is('branch_id', null)
      }

      const { data } = await query
      setHolidays(data || [])
      setFetching(false)
    }

    fetchHolidays()
  }, [open, branchId])

  const addHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      setError('กรุณากรอกวันที่และชื่อวันหยุด')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('holidays')
      .insert({
        branch_id: branchId || null,
        date: newHoliday.date,
        name: newHoliday.name,
        is_recurring: newHoliday.isRecurring,
      } as never)
      .select()
      .single()

    if (insertError) {
      setError('ไม่สามารถเพิ่มวันหยุดได้')
      setLoading(false)
      return
    }

    setHolidays((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
    setNewHoliday({ date: '', name: '', isRecurring: false })
    setLoading(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  const removeHoliday = async (holidayId: string) => {
    if (!confirm('ยืนยันการลบวันหยุดนี้?')) return

    const supabase = createClient()
    await supabase.from('holidays').delete().eq('id', holidayId)
    setHolidays((prev) => prev.filter((h) => h.id !== holidayId))
  }

  const addCommonHoliday = async (holiday: typeof COMMON_HOLIDAYS[0]) => {
    const year = new Date().getFullYear()
    const date = `${year}-${holiday.date}`

    // Check if already exists
    if (holidays.some((h) => h.date === date)) {
      setError('วันหยุดนี้มีอยู่แล้ว')
      return
    }

    setNewHoliday({
      date,
      name: holiday.name,
      isRecurring: holiday.isRecurring,
    })
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
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-coffee-100 bg-gradient-to-r from-honey-50 to-cream-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-honey-500 to-honey-700 rounded-xl flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-coffee-900">วันหยุด</h2>
              <p className="text-sm text-coffee-500">
                {branchName || 'ทุกสาขา (ทั้งองค์กร)'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-coffee-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-cherry-50 border border-cherry-200 rounded-lg flex items-center gap-2 text-cherry-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-matcha-50 border border-matcha-200 rounded-lg flex items-center gap-2 text-matcha-700 text-sm">
              <Check className="h-4 w-4 flex-shrink-0" />
              เพิ่มวันหยุดเรียบร้อยแล้ว
            </div>
          )}

          {/* Add new holiday */}
          <div className="mb-6 p-4 bg-cream-50 rounded-xl border border-coffee-100">
            <h3 className="font-medium text-coffee-800 mb-3">เพิ่มวันหยุดใหม่</h3>

            {/* Quick add common holidays */}
            <div className="mb-3">
              <p className="text-xs text-coffee-500 mb-2">เพิ่มจากวันหยุดทั่วไป:</p>
              <div className="flex flex-wrap gap-1">
                {COMMON_HOLIDAYS.slice(0, 8).map((h) => (
                  <button
                    key={h.date}
                    type="button"
                    onClick={() => addCommonHoliday(h)}
                    className="px-2 py-1 text-xs bg-white border border-coffee-200 rounded hover:bg-coffee-50 transition-colors"
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-coffee-600 mb-1 block">วันที่</label>
                <input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                />
              </div>
              <div>
                <label className="text-xs text-coffee-600 mb-1 block">ชื่อวันหยุด</label>
                <input
                  type="text"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  placeholder="เช่น วันปิดบัญชี"
                  className="w-full px-3 py-2 text-sm border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newHoliday.isRecurring}
                  onChange={(e) =>
                    setNewHoliday({ ...newHoliday, isRecurring: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-coffee-300 text-honey-600 focus:ring-honey-500"
                />
                <span className="text-sm text-coffee-600 flex items-center gap-1">
                  <Repeat className="h-3.5 w-3.5" />
                  เกิดซ้ำทุกปี
                </span>
              </label>

              <button
                type="button"
                onClick={addHoliday}
                disabled={loading || !newHoliday.date || !newHoliday.name}
                className="flex items-center gap-2 px-4 py-2 bg-honey-500 text-white rounded-lg hover:bg-honey-600 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                เพิ่ม
              </button>
            </div>
          </div>

          {/* Holiday list */}
          <div>
            <h3 className="font-medium text-coffee-800 mb-3">
              วันหยุดที่กำหนด ({holidays.length})
            </h3>

            {fetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-coffee-400 animate-spin" />
              </div>
            ) : holidays.length === 0 ? (
              <div className="text-center py-8 text-coffee-400">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">ยังไม่มีวันหยุดที่กำหนด</p>
              </div>
            ) : (
              <div className="space-y-2">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3 bg-white border border-coffee-100 rounded-lg hover:border-coffee-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-honey-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-honey-700">
                          {format(parseISO(holiday.date), 'd', { locale: th })}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-coffee-800">{holiday.name}</p>
                        <p className="text-xs text-coffee-500">
                          {format(parseISO(holiday.date), 'd MMMM yyyy', { locale: th })}
                          {holiday.is_recurring && (
                            <span className="ml-2 inline-flex items-center gap-1 text-honey-600">
                              <Repeat className="h-3 w-3" />
                              ทุกปี
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHoliday(holiday.id)}
                      className="p-2 text-coffee-400 hover:text-cherry-600 hover:bg-cherry-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
            <p className="text-xs text-sky-700">
              <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
              วันหยุดจะไม่นับรวมในการคำนวณ SLA เมื่อใช้โหมด "เวลาทำการ"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-coffee-100 bg-cream-50">
          <button type="button" onClick={() => setOpen(false)} className="btn-primary flex-1">
            <Check className="h-5 w-5" />
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-honey-100 text-honey-700 rounded-lg hover:bg-honey-200 transition-colors"
      >
        <Calendar className="h-4 w-4" />
        จัดการวันหยุด
      </button>

      {open && mounted && createPortal(modalContent, document.body)}
    </>
  )
}
