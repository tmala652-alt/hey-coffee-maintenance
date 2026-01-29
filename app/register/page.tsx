'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Coffee, Eye, EyeOff, Loader2, Mail, Lock, User, Phone, Building2, Sparkles, CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/database.types'

// Google Icon Component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [branchId, setBranchId] = useState('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('ไม่สามารถสมัครด้วย Google ได้')
      setGoogleLoading(false)
    }
  }

  useEffect(() => {
    const fetchBranches = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('branches')
        .select('*')
        .order('name')
      if (data) setBranches(data)
    }
    fetchBranches()
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'branch',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Update profile with branch_id and phone
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      await (supabase
        .from('profiles') as ReturnType<typeof supabase.from>)
        .update({ branch_id: branchId || null, phone })
        .eq('id', currentUser.id)
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-matcha-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-honey-500/10 rounded-full blur-3xl animate-float-delayed" />

        <div className="card-glass p-10 max-w-md w-full text-center relative animate-scale-in">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div className="w-16 h-16 bg-gradient-to-br from-matcha-500 to-matcha-600 rounded-2xl flex items-center justify-center shadow-lg shadow-matcha-500/30 animate-bounce-soft">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-coffee-900 mb-3">สมัครสมาชิกสำเร็จ!</h2>
            <p className="text-coffee-600 mb-8 leading-relaxed">
              กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีของคุณ
              <br />
              <span className="text-sm text-coffee-400">อาจใช้เวลาสักครู่</span>
            </p>
            <Link href="/login" className="btn-primary w-full py-4 group">
              ไปหน้าเข้าสู่ระบบ
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 flex overflow-hidden">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-honey-500 via-honey-600 to-coffee-700 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-coffee-800/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 animate-bounce-soft">
            <Sparkles className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            เข้าร่วมกับเรา!
          </h1>
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            สมัครสมาชิกเพื่อเริ่มต้นใช้งาน
            <br />
            ระบบแจ้งซ่อมบำรุง Hey! Coffee
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/80">สมัครง่าย ใช้งานได้ทันที</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/80">ไม่มีค่าใช้จ่าย</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/80">รองรับทุกสาขาทั่วประเทศ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-coffee-600 to-coffee-800 rounded-2xl flex items-center justify-center shadow-lg shadow-coffee-700/30">
                <Coffee className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-bold text-coffee-900 block">Hey! Coffee</span>
                <span className="text-sm text-coffee-500">Maintenance System</span>
              </div>
            </Link>
          </div>

          {/* Form Card */}
          <div className="animate-slide-up">
            <h2 className="text-3xl font-bold text-coffee-900 mb-2">สมัครสมาชิก</h2>
            <p className="text-coffee-500 mb-6">สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน</p>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-coffee-200 rounded-2xl hover:border-coffee-300 hover:bg-cream-50 transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md group"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-coffee-500" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              <span className="text-coffee-700 font-semibold">
                {googleLoading ? 'กำลังดำเนินการ...' : 'สมัครด้วย Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-coffee-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-gradient-to-br from-cream-50 via-white to-cream-100 text-coffee-400 text-sm font-medium">หรือ</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  <User className="h-4 w-4 inline mr-2" />
                  ชื่อ-นามสกุล
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="สมชาย ใจดี"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  <Mail className="h-4 w-4 inline mr-2" />
                  อีเมล
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  <Phone className="h-4 w-4 inline mr-2" />
                  เบอร์โทรศัพท์
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  placeholder="081-234-5678"
                />
              </div>

              <div>
                <label htmlFor="branch" className="label">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  สาขา
                </label>
                <select
                  id="branch"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">เลือกสาขา</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="password" className="label">
                  <Lock className="h-4 w-4 inline mr-2" />
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-12"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-cherry-50 text-cherry-600 text-sm px-4 py-3 rounded-xl border border-cherry-200 flex items-center gap-2 animate-slide-down">
                  <div className="w-2 h-2 bg-cherry-500 rounded-full" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base group"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    กำลังสมัคร...
                  </>
                ) : (
                  <>
                    สมัครสมาชิก
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-6 text-center text-coffee-600">
              มีบัญชีอยู่แล้ว?{' '}
              <Link href="/login" className="font-semibold text-coffee-800 hover:text-honey-600 transition-colors">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
