'use client'

import { useState } from 'react'
import { Download, Loader2, X, FileSpreadsheet, Calendar } from 'lucide-react'

export default function ExportButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleExport = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          format: 'csv',
        }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `maintenance-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setOpen(false)
    } catch (error) {
      alert('ไม่สามารถ Export ได้ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const setPreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary"
      >
        <Download className="h-5 w-5" />
        Export รายงาน
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-coffee-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-matcha-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-matcha-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-coffee-900">Export รายงาน</h2>
                  <p className="text-sm text-coffee-500">ดาวน์โหลดข้อมูลเป็น CSV</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-coffee-400 hover:text-coffee-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Quick presets */}
              <div>
                <label className="label">ช่วงเวลา</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreset(7)}
                    className="px-3 py-1.5 text-sm bg-cream-50 hover:bg-cream-100 rounded-lg text-coffee-700 transition-colors"
                  >
                    7 วันล่าสุด
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreset(30)}
                    className="px-3 py-1.5 text-sm bg-cream-50 hover:bg-cream-100 rounded-lg text-coffee-700 transition-colors"
                  >
                    30 วันล่าสุด
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreset(90)}
                    className="px-3 py-1.5 text-sm bg-cream-50 hover:bg-cream-100 rounded-lg text-coffee-700 transition-colors"
                  >
                    90 วันล่าสุด
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="px-3 py-1.5 text-sm bg-cream-50 hover:bg-cream-100 rounded-lg text-coffee-700 transition-colors"
                  >
                    ทั้งหมด
                  </button>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    ตั้งแต่
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    ถึง
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="p-3 bg-cream-50 rounded-lg text-sm text-coffee-600">
                <p>ข้อมูลที่จะ Export:</p>
                <ul className="list-disc list-inside mt-1 text-coffee-500">
                  <li>รหัสงาน, หัวข้อ</li>
                  <li>สาขา, ประเภท, ความสำคัญ</li>
                  <li>สถานะ, ผู้แจ้ง, ผู้รับผิดชอบ</li>
                  <li>ค่าใช้จ่าย, SLA, วันที่</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-coffee-100">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary flex-1"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> กำลังสร้าง...</>
                ) : (
                  <><Download className="h-5 w-5" /> ดาวน์โหลด CSV</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
