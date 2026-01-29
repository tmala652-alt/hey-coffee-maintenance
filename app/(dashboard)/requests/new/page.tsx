'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload, X, Image as ImageIcon, Wrench, Building2, Tag, Clock, FileText, Camera, AlertCircle, Send, Sparkles, Zap, Droplets, Wind, Coffee, Snowflake, Armchair, Home, Monitor, MoreHorizontal, ArrowDown, Minus, ArrowUp, AlertTriangle, MapPin, Navigation } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch, Profile } from '@/types/database.types'
import { clsx } from 'clsx'

const categories = [
  { value: 'ไฟฟ้า', icon: Zap, color: 'from-yellow-100 to-yellow-200 text-yellow-700' },
  { value: 'ประปา', icon: Droplets, color: 'from-blue-100 to-blue-200 text-blue-700' },
  { value: 'แอร์', icon: Wind, color: 'from-cyan-100 to-cyan-200 text-cyan-700' },
  { value: 'เครื่องชงกาแฟ', icon: Coffee, color: 'from-coffee-100 to-coffee-200 text-coffee-700' },
  { value: 'ตู้เย็น/ตู้แช่', icon: Snowflake, color: 'from-sky-100 to-sky-200 text-sky-700' },
  { value: 'เฟอร์นิเจอร์', icon: Armchair, color: 'from-orange-100 to-orange-200 text-orange-700' },
  { value: 'อาคาร/สถานที่', icon: Home, color: 'from-stone-100 to-stone-200 text-stone-700' },
  { value: 'IT/อุปกรณ์', icon: Monitor, color: 'from-purple-100 to-purple-200 text-purple-700' },
  { value: 'อื่นๆ', icon: MoreHorizontal, color: 'from-gray-100 to-gray-200 text-gray-700' },
]

const slaOptions = [
  { value: 4, label: '4 ชั่วโมง', desc: 'เร่งด่วนมาก', color: 'text-cherry-600' },
  { value: 8, label: '8 ชั่วโมง', desc: 'เร่งด่วน', color: 'text-orange-600' },
  { value: 24, label: '24 ชั่วโมง', desc: 'ปกติ', color: 'text-honey-600' },
  { value: 48, label: '48 ชั่วโมง', desc: 'ไม่เร่ง', color: 'text-matcha-600' },
  { value: 72, label: '72 ชั่วโมง', desc: 'ยืดหยุ่น', color: 'text-coffee-600' },
]

const priorityOptions = [
  { value: 'low', label: 'ต่ำ', icon: ArrowDown, color: 'from-matcha-100 to-matcha-200 text-matcha-700 border-matcha-300' },
  { value: 'medium', label: 'ปานกลาง', icon: Minus, color: 'from-honey-100 to-honey-200 text-honey-700 border-honey-300' },
  { value: 'high', label: 'สูง', icon: ArrowUp, color: 'from-orange-100 to-orange-200 text-orange-700 border-orange-300' },
  { value: 'critical', label: 'เร่งด่วน', icon: AlertTriangle, color: 'from-cherry-100 to-cherry-200 text-cherry-700 border-cherry-300 animate-pulse' },
]

export default function NewRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [images, setImages] = useState<{ url: string; path: string }[]>([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as const,
    branch_id: '',
    location: '',
    sla_hours: 24,
  })

  // Common locations within branches
  const locationOptions = [
    'เคาน์เตอร์บาร์',
    'ห้องครัว',
    'ห้องน้ำ',
    'พื้นที่ลูกค้า',
    'ห้องเก็บของ',
    'หน้าร้าน',
    'ด้านหลังร้าน',
    'ชั้น 2',
    'ที่จอดรถ',
    'อื่นๆ',
  ]

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as { data: Profile | null }

      setProfile(profileData)

      // Always fetch branches for selection
      const { data: branchesData } = await supabase
        .from('branches')
        .select('*')
        .order('region')
        .order('name') as { data: Branch[] | null }
      setBranches(branchesData || [])

      // Pre-select user's branch if they have one
      if (profileData?.branch_id) {
        setForm(prev => ({ ...prev, branch_id: profileData.branch_id! }))
      }
    }
    fetchData()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from('images')
        .upload(fileName, file)

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName)

        setImages(prev => [...prev, { url: publicUrl, path: fileName }])
      }
    }
    setUploading(false)
  }

  const removeImage = async (path: string) => {
    const supabase = createClient()
    await supabase.storage.from('images').remove([path])
    setImages(prev => prev.filter(img => img.path !== path))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Build description with location
    let fullDescription = form.description || ''
    if (form.location) {
      fullDescription = `📍 ตำแหน่ง: ${form.location}\n\n${fullDescription}`
    }

    // Create maintenance request
    const { data: request, error } = await (supabase
      .from('maintenance_requests') as ReturnType<typeof supabase.from>)
      .insert({
        title: form.title,
        description: fullDescription,
        category: form.category,
        priority: form.priority,
        branch_id: form.branch_id || profile?.branch_id,
        sla_hours: form.sla_hours,
        created_by: user.id,
      })
      .select()
      .single()

    if (error || !request) {
      console.error(error)
      setLoading(false)
      return
    }

    // Add attachments
    if (images.length > 0) {
      await (supabase.from('attachments') as ReturnType<typeof supabase.from>).insert(
        images.map(img => ({
          request_id: (request as { id: string }).id,
          uploaded_by: user.id,
          file_url: img.url,
          type: 'image' as const,
        }))
      )
    }

    router.push(`/requests/${(request as { id: string }).id}`)
  }

  const isAdmin = profile?.role === 'admin'
  const selectedCategory = categories.find(c => c.value === form.category)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/requests" className="p-2 hover:bg-coffee-100 rounded-xl transition-colors">
          <ArrowLeft className="h-6 w-6 text-coffee-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-honey-400 to-honey-600 rounded-xl flex items-center justify-center shadow-lg shadow-honey-500/30">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            แจ้งซ่อมใหม่
          </h1>
          <p className="text-coffee-600 mt-1">กรอกรายละเอียดปัญหาที่ต้องการแจ้งซ่อม</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branch & Location Selection */}
        <div className="card-glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-matcha-100 to-matcha-200 rounded-xl flex items-center justify-center">
              <MapPin className="h-5 w-5 text-matcha-700" />
            </div>
            <div>
              <h3 className="font-semibold text-coffee-900">สถานที่</h3>
              <p className="text-sm text-coffee-500">เลือกสาขาและตำแหน่งที่ต้องการซ่อม</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Branch Selection */}
            <div>
              <label className="label flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                สาขา *
              </label>
              {profile?.branch_id && !isAdmin ? (
                <div className="input bg-cream-50 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-coffee-500" />
                  <span>{branches.find(b => b.id === profile.branch_id)?.name || 'สาขาของคุณ'}</span>
                </div>
              ) : (
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">เลือกสาขา</option>
                  {/* Group branches by region */}
                  {Array.from(new Set(branches.map(b => b.region || 'อื่นๆ'))).map(region => (
                    <optgroup key={region} label={region}>
                      {branches.filter(b => (b.region || 'อื่นๆ') === region).map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} ({branch.code})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            {/* Location Selection */}
            <div>
              <label className="label flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                ตำแหน่งในสาขา
              </label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="input"
              >
                <option value="">เลือกตำแหน่ง (ไม่บังคับ)</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom location input if "อื่นๆ" is selected */}
          {form.location === 'อื่นๆ' && (
            <div className="mt-4">
              <label className="label">ระบุตำแหน่ง</label>
              <input
                type="text"
                placeholder="ระบุตำแหน่งที่ต้องการซ่อม"
                className="input"
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="card-glass p-6">
          <label className="label flex items-center gap-2">
            <FileText className="h-4 w-4" />
            หัวข้อ *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input text-lg"
            placeholder="เช่น แอร์ไม่เย็น, ก๊อกน้ำรั่ว"
            required
          />
        </div>

        {/* Category */}
        <div className="card-glass p-6">
          <label className="label flex items-center gap-2 mb-4">
            <Tag className="h-4 w-4" />
            ประเภทงาน *
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300',
                    form.category === cat.value
                      ? `bg-gradient-to-br ${cat.color} border-current shadow-lg`
                      : 'bg-white text-coffee-600 border-coffee-200 hover:border-coffee-300 hover:bg-cream-50'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium text-center">{cat.value}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Priority */}
        <div className="card-glass p-6">
          <label className="label flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4" />
            ความสำคัญ *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {priorityOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: opt.value as typeof form.priority })}
                  className={clsx(
                    'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-300',
                    form.priority === opt.value
                      ? `bg-gradient-to-r ${opt.color} shadow-lg`
                      : 'bg-white text-coffee-600 border-coffee-200 hover:border-coffee-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* SLA */}
        <div className="card-glass p-6">
          <label className="label flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" />
            ระยะเวลาดำเนินการ (SLA)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {slaOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, sla_hours: opt.value })}
                className={clsx(
                  'flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300',
                  form.sla_hours === opt.value
                    ? 'bg-coffee-700 text-white border-coffee-700 shadow-lg shadow-coffee-700/30'
                    : 'bg-white text-coffee-600 border-coffee-200 hover:border-coffee-300'
                )}
              >
                <span className={clsx('text-lg font-bold', form.sla_hours !== opt.value && opt.color)}>
                  {opt.label}
                </span>
                <span className="text-xs opacity-80">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="card-glass p-6">
          <label className="label flex items-center gap-2">
            <FileText className="h-4 w-4" />
            รายละเอียด
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input min-h-[140px]"
            placeholder="อธิบายปัญหาเพิ่มเติม เช่น ตำแหน่ง อาการ ความรุนแรง..."
          />
        </div>

        {/* Images */}
        <div className="card-glass p-6">
          <label className="label flex items-center gap-2 mb-4">
            <Camera className="h-4 w-4" />
            รูปภาพประกอบ
          </label>
          <div className="space-y-4">
            {/* Upload Button */}
            <label className="flex flex-col items-center justify-center gap-3 px-4 py-10 border-2 border-dashed border-coffee-300 rounded-2xl cursor-pointer hover:border-honey-500 hover:bg-honey-50/50 transition-all duration-300 group">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-coffee-500" />
              ) : (
                <>
                  <div className="w-14 h-14 bg-gradient-to-br from-cream-100 to-cream-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="h-7 w-7 text-coffee-500" />
                  </div>
                  <div className="text-center">
                    <span className="text-coffee-700 font-medium block">คลิกเพื่ออัพโหลดรูปภาพ</span>
                    <span className="text-sm text-coffee-400">รองรับ JPG, PNG ขนาดไม่เกิน 5MB</span>
                  </div>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>

            {/* Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={img.path} className="relative group animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-28 object-cover rounded-xl shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img.path)}
                      className="absolute -top-2 -right-2 p-1.5 bg-cherry-500 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-cherry-600 hover:scale-110"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-2">
          <Link href="/requests" className="btn-secondary flex-1 py-4">
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={loading || !form.title || !form.category || (!form.branch_id && !profile?.branch_id)}
            className="btn-primary flex-1 py-4 group"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                ส่งแจ้งซ่อม
                <Sparkles className="h-4 w-4 text-honey-300" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
