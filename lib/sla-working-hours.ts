import { createClient } from '@/lib/supabase/client'
import {
  addMinutes,
  addDays,
  startOfDay,
  differenceInMinutes,
  isSameDay,
  getDay,
  setHours,
  setMinutes,
  isAfter,
  isBefore,
  max,
  min,
} from 'date-fns'
import type { BranchWorkingHours, Holiday } from '@/types/database.types'

export interface WorkingHours {
  dayOfWeek: number
  openTime: string // "09:00"
  closeTime: string // "18:00"
  isClosed: boolean
}

export interface SLACalculation {
  dueAt: Date
  workingMinutes: number
  calendarMinutes: number
  pausedMinutes: number
}

export interface SLAProgress {
  elapsedMinutes: number
  totalMinutes: number
  percentage: number
  remainingMinutes: number
}

/**
 * Parse time string (HH:mm) to Date object for a given day
 */
function parseTimeToDate(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  let result = setHours(baseDate, hours)
  result = setMinutes(result, minutes)
  return result
}

/**
 * Fetch branch working hours from database
 */
export async function getBranchWorkingHours(branchId: string): Promise<WorkingHours[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('branch_working_hours')
    .select('*')
    .eq('branch_id', branchId)
    .order('day_of_week')

  if (!data || data.length === 0) {
    // Return default working hours (Mon-Sat 09:00-18:00)
    return [
      { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true }, // Sunday
      { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', isClosed: false },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '18:00', isClosed: false },
    ]
  }

  return data.map((d: BranchWorkingHours) => ({
    dayOfWeek: d.day_of_week,
    openTime: d.open_time,
    closeTime: d.close_time,
    isClosed: d.is_closed ?? false,
  }))
}

/**
 * Fetch holidays for a branch within a date range
 */
export async function getHolidays(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<Date[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('holidays')
    .select('*')
    .or(`branch_id.eq.${branchId},branch_id.is.null`)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])

  if (!data) return []

  return data.map((h: Holiday) => new Date(h.date))
}

/**
 * Check if a specific date is a holiday
 */
function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some((h) => isSameDay(h, date))
}

/**
 * Calculate working minutes between two times on the same day
 */
function getWorkingMinutesInDay(
  currentTime: Date,
  daySchedule: WorkingHours,
  holidays: Date[]
): { minutes: number; endTime: Date } {
  // Check if closed or holiday
  if (daySchedule.isClosed || isHoliday(currentTime, holidays)) {
    return { minutes: 0, endTime: startOfDay(addDays(currentTime, 1)) }
  }

  const dayStart = startOfDay(currentTime)
  const openTime = parseTimeToDate(daySchedule.openTime, dayStart)
  const closeTime = parseTimeToDate(daySchedule.closeTime, dayStart)

  // If current time is after close time, no minutes available today
  if (isAfter(currentTime, closeTime) || isSameDay(currentTime, closeTime) && currentTime >= closeTime) {
    return { minutes: 0, endTime: startOfDay(addDays(currentTime, 1)) }
  }

  // Effective start is max of current time and open time
  const effectiveStart = max([currentTime, openTime])

  // If effective start is after close time, no minutes
  if (isAfter(effectiveStart, closeTime)) {
    return { minutes: 0, endTime: startOfDay(addDays(currentTime, 1)) }
  }

  const minutes = differenceInMinutes(closeTime, effectiveStart)
  return { minutes: Math.max(0, minutes), endTime: closeTime }
}

/**
 * คำนวณ due_at โดยนับเฉพาะเวลาทำการ
 *
 * ตัวอย่าง: SLA 4 ชั่วโมง, สร้างตอน 16:00 วันศุกร์
 * - ศุกร์ 16:00-18:00 = 2 ชั่วโมง
 * - เสาร์ = เปิด (ถ้าไม่ปิด)
 * - อาทิตย์ = ปิด
 * - จันทร์ 09:00-11:00 = 2 ชั่วโมง (ถ้าเสาร์ปิด)
 * - due_at = จันทร์ 11:00
 */
export async function calculateWorkingHoursDueAt(
  branchId: string,
  createdAt: Date,
  slaHours: number,
  pausedMinutes: number = 0
): Promise<SLACalculation> {
  const workingHours = await getBranchWorkingHours(branchId)
  const holidays = await getHolidays(branchId, createdAt, addDays(createdAt, 60)) // 60 days ahead

  const targetMinutes = slaHours * 60 - pausedMinutes
  let accumulatedMinutes = 0
  let currentTime = new Date(createdAt)
  const maxIterations = 90 // Safety: max 90 days

  for (let i = 0; i < maxIterations && accumulatedMinutes < targetMinutes; i++) {
    const dayOfWeek = getDay(currentTime)
    const daySchedule = workingHours.find((h) => h.dayOfWeek === dayOfWeek)

    if (!daySchedule || daySchedule.isClosed || isHoliday(currentTime, holidays)) {
      // Skip to next day
      currentTime = startOfDay(addDays(currentTime, 1))
      continue
    }

    const { minutes, endTime } = getWorkingMinutesInDay(currentTime, daySchedule, holidays)

    if (minutes === 0) {
      currentTime = endTime
      continue
    }

    const minutesNeeded = targetMinutes - accumulatedMinutes

    if (minutes >= minutesNeeded) {
      // Done! Calculate exact due time
      const dayStart = startOfDay(currentTime)
      const openTime = parseTimeToDate(daySchedule.openTime, dayStart)
      const effectiveStart = max([currentTime, openTime])

      const dueAt = addMinutes(effectiveStart, minutesNeeded)

      return {
        dueAt,
        workingMinutes: targetMinutes,
        calendarMinutes: differenceInMinutes(dueAt, createdAt),
        pausedMinutes,
      }
    }

    accumulatedMinutes += minutes
    currentTime = startOfDay(addDays(currentTime, 1))
  }

  // Fallback: return current time if exceeded max iterations
  return {
    dueAt: currentTime,
    workingMinutes: targetMinutes,
    calendarMinutes: differenceInMinutes(currentTime, createdAt),
    pausedMinutes,
  }
}

/**
 * Count working minutes between two dates
 */
export function countWorkingMinutes(
  startDate: Date,
  endDate: Date,
  workingHours: WorkingHours[],
  holidays: Date[]
): number {
  if (isAfter(startDate, endDate)) return 0

  let totalMinutes = 0
  let currentTime = new Date(startDate)
  const maxIterations = 90

  for (let i = 0; i < maxIterations && isBefore(currentTime, endDate); i++) {
    const dayOfWeek = getDay(currentTime)
    const daySchedule = workingHours.find((h) => h.dayOfWeek === dayOfWeek)

    if (!daySchedule || daySchedule.isClosed || isHoliday(currentTime, holidays)) {
      currentTime = startOfDay(addDays(currentTime, 1))
      continue
    }

    const dayStart = startOfDay(currentTime)
    const openTime = parseTimeToDate(daySchedule.openTime, dayStart)
    const closeTime = parseTimeToDate(daySchedule.closeTime, dayStart)

    // Effective start is max of current time and open time
    const effectiveStart = max([currentTime, openTime])

    // Effective end is min of end date and close time
    const effectiveEnd = min([endDate, closeTime])

    if (isBefore(effectiveStart, effectiveEnd)) {
      totalMinutes += differenceInMinutes(effectiveEnd, effectiveStart)
    }

    currentTime = startOfDay(addDays(currentTime, 1))
  }

  return totalMinutes
}

/**
 * คำนวณ SLA progress โดยนับเฉพาะเวลาทำการ
 */
export async function calculateWorkingHoursProgress(
  createdAt: Date,
  dueAt: Date,
  branchId: string,
  pausedMinutes: number = 0
): Promise<SLAProgress> {
  const workingHours = await getBranchWorkingHours(branchId)
  const holidays = await getHolidays(branchId, createdAt, dueAt)

  const now = new Date()

  // Count working minutes from createdAt to now
  const elapsedMinutes =
    countWorkingMinutes(createdAt, now, workingHours, holidays) - pausedMinutes

  // Count total working minutes from createdAt to dueAt
  const totalMinutes = countWorkingMinutes(createdAt, dueAt, workingHours, holidays)

  const percentage = totalMinutes > 0 ? (elapsedMinutes / totalMinutes) * 100 : 0
  const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes)

  return {
    elapsedMinutes: Math.max(0, elapsedMinutes),
    totalMinutes,
    percentage: Math.min(100, Math.max(0, percentage)),
    remainingMinutes,
  }
}

/**
 * Format minutes to human readable string
 */
export function formatMinutesToReadable(minutes: number): string {
  if (minutes < 0) return 'เกินกำหนด'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins} นาที`
  } else if (mins === 0) {
    return `${hours} ชั่วโมง`
  } else {
    return `${hours} ชม. ${mins} น.`
  }
}

/**
 * Get SLA status based on percentage
 */
export function getSLAStatusFromPercentage(
  percentage: number,
  requestStatus: string
): 'on_track' | 'warning' | 'critical' | 'breached' | 'completed' | 'no_sla' {
  if (requestStatus === 'completed' || requestStatus === 'cancelled') {
    return 'completed'
  }

  if (percentage >= 100) return 'breached'
  if (percentage >= 90) return 'critical'
  if (percentage >= 75) return 'warning'
  return 'on_track'
}
