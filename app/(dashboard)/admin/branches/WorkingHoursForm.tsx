'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Clock, Loader2, X, AlertCircle, Check, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/database.types'
import { clsx } from 'clsx'

interface WorkingHoursFormProps {
  branch: Branch
}

interface DaySchedule {
  dayOfWeek: number
  dayName: string
  dayNameShort: string
  openTime: string
  closeTime: string
  isClosed: boolean
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 0, dayName: 'อาทิตย์', dayNameShort: 'อา.', openTime: '10:00', closeTime: '20:00', isClosed: true },
  { dayOfWeek: 1, dayName: 'จันทร์', dayNameShort: 'จ.', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 2, dayName: 'อังคาร', dayNameShort: 'อ.', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 3, dayName: 'พุธ', dayNameShort: 'พ.', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 4, dayName: 'พฤหัสบดี', dayNameShort: 'พฤ.', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 5, dayName: 'ศุกร์', dayNameShort: 'ศ.', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 6, dayName: 'เสาร์', dayNameShort: 'ส.', openTime: '10:00', closeTime: '20:00', isClosed: true },
]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const minutes = i % 2 === 0 ? '00' : '30'
  return `${hours.toString().padStart(2, '0')}:${minutes}`
})

export default function WorkingHoursForm({ branch }: WorkingHoursFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [mounted, setMounted] = useState(false)

  // For portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch existing working hours
  useEffect(() => {
    if (!open) return

    const fetchWorkingHours = async () => {
      setFetching(true)
      const supabase = createClient()

      const { data: workingHours } = await supabase
        .from('branch_working_hours')
        .select('*')
        .eq('branch_id', branch.id)
        .order('day_of_week') as { data: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }[] | null }

      if (workingHours && workingHours.length > 0) {
        const merged = DEFAULT_SCHEDULE.map((day) => {
          const existing = workingHours.find((wh) => wh.day_of_week === day.dayOfWeek)
          if (existing) {
            return {
              ...day,
              openTime: existing.open_time?.slice(0, 5) || day.openTime,
              closeTime: existing.close_time?.slice(0, 5) || day.closeTime,
              isClosed: existing.is_closed || false,
            }
          }
          return day
        })
        setSchedule(merged)
      } else {
        setSchedule(DEFAULT_SCHEDULE)
      }
      setFetching(false)
    }

    fetchWorkingHours()
  }, [open, branch.id])

  const updateDay = (dayOfWeek: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((prev) =>
      prev.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    // Delete existing records
    await supabase.from('branch_working_hours').delete().eq('branch_id', branch.id)

    // Insert new records
    const records = schedule.map((day) => ({
      branch_id: branch.id,
      day_of_week: day.dayOfWeek,
      open_time: day.openTime,
      close_time: day.closeTime,
      is_closed: day.isClosed,
    }))

    const { error: insertError } = await supabase.from('branch_working_hours').insert(records as never)

    if (insertError) {
      setError('ไม่สามารถบันทึกเวลาทำการได้')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      setOpen(false)
      router.refresh()
    }, 1000)
  }

  const applyPreset = (preset: 'weekday' | 'everyday' | 'cafe') => {
    switch (preset) {
      case 'weekday':
        setSchedule(
          DEFAULT_SCHEDULE.map((day) => ({
            ...day,
            openTime: '09:00',
            closeTime: '18:00',
            isClosed: day.dayOfWeek === 0 || day.dayOfWeek === 6,
          }))
        )
        break
      case 'everyday':
        setSchedule(
          DEFAULT_SCHEDULE.map((day) => ({
            ...day,
            openTime: '08:00',
            closeTime: '20:00',
            isClosed: false,
          }))
        )
        break
      case 'cafe':
        setSchedule(
          DEFAULT_SCHEDULE.map((day) => ({
            ...day,
            openTime: '07:00',
            closeTime: '21:00',
            isClosed: false,
          }))
        )
        break
    }
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
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-coffee-100 bg-coffee-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-coffee-600 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-coffee-900">เวลาทำการ</h2>
              <p className="text-xs text-coffee-500">{branch.name}</p>
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
        <form onSubmit={handleSubmit}>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="mb-3 p-2 bg-cherry-50 border border-cherry-200 rounded-lg flex items-center gap-2 text-cherry-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-3 p-2 bg-matcha-50 border border-matcha-200 rounded-lg flex items-center gap-2 text-matcha-700 text-sm">
                <Check className="h-4 w-4 flex-shrink-0" />
                บันทึกเรียบร้อยแล้ว
              </div>
            )}

            {/* Presets */}
            <div className="mb-4">
              <p className="text-xs text-coffee-500 mb-2">เลือกรูปแบบ:</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('weekday')}
                  className="flex-1 px-2 py-1.5 text-xs bg-coffee-100 text-coffee-700 rounded-lg hover:bg-coffee-200"
                >
                  จ.-ศ.
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('everyday')}
                  className="flex-1 px-2 py-1.5 text-xs bg-coffee-100 text-coffee-700 rounded-lg hover:bg-coffee-200"
                >
                  ทุกวัน
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('cafe')}
                  className="flex-1 px-2 py-1.5 text-xs bg-coffee-100 text-coffee-700 rounded-lg hover:bg-coffee-200"
                >
                  คาเฟ่
                </button>
              </div>
            </div>

            {fetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-coffee-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {schedule.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className={clsx(
                      'flex items-center gap-2 p-2 rounded-lg border transition-colors',
                      day.isClosed
                        ? 'bg-coffee-50 border-coffee-200'
                        : 'bg-matcha-50 border-matcha-200'
                    )}
                  >
                    {/* Day name */}
                    <span
                      className={clsx(
                        'w-16 text-sm font-medium',
                        day.isClosed ? 'text-coffee-400' : 'text-coffee-700'
                      )}
                    >
                      {day.dayName}
                    </span>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => updateDay(day.dayOfWeek, 'isClosed', !day.isClosed)}
                      className={clsx(
                        'w-10 h-5 rounded-full transition-colors relative flex-shrink-0',
                        day.isClosed ? 'bg-coffee-300' : 'bg-matcha-500'
                      )}
                    >
                      <span
                        className={clsx(
                          'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow',
                          day.isClosed ? 'left-0.5' : 'left-5'
                        )}
                      />
                    </button>

                    {/* Time selects or closed */}
                    <div className="flex-1 flex items-center justify-end gap-1">
                      {!day.isClosed ? (
                        <>
                          <select
                            value={day.openTime}
                            onChange={(e) => updateDay(day.dayOfWeek, 'openTime', e.target.value)}
                            className="w-[72px] px-1 py-1 text-xs border border-coffee-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-matcha-500"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                          <span className="text-coffee-400 text-xs">-</span>
                          <select
                            value={day.closeTime}
                            onChange={(e) => updateDay(day.dayOfWeek, 'closeTime', e.target.value)}
                            className="w-[72px] px-1 py-1 text-xs border border-coffee-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-matcha-500"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <span className="text-xs text-coffee-400">ปิดทำการ</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="mt-3 p-2 bg-sky-50 border border-sky-200 rounded-lg">
              <p className="text-xs text-sky-700">
                <Calendar className="h-3 w-3 inline mr-1" />
                ใช้คำนวณ SLA เมื่อเลือกโหมด "เวลาทำการ"
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t border-coffee-100 bg-cream-50">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2 border border-coffee-200 text-coffee-600 rounded-lg hover:bg-coffee-50"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading || fetching}
              className="flex-1 px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  บันทึก
                </>
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
        type="button"
        onClick={() => setOpen(true)}
        className="p-2 hover:bg-coffee-100 rounded-lg transition-colors text-coffee-400 hover:text-coffee-600"
        title="ตั้งค่าเวลาทำการ"
      >
        <Clock className="h-4 w-4" />
      </button>

      {open && mounted && createPortal(modalContent, document.body)}
    </>
  )
}
