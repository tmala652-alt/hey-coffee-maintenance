'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Coffee, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Branch } from '@/types/database.types'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingBranches, setFetchingBranches] = useState(true)

  useEffect(() => {
    const fetchBranches = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('branches')
        .select('*')
        .order('name') as { data: Branch[] | null }
      setBranches(data || [])
      setFetchingBranches(false)
    }
    fetchBranches()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await (supabase
        .from('profiles') as ReturnType<typeof supabase.from>)
        .update({
          branch_id: branchId || null,
          phone: phone || null,
        })
        .eq('id', user.id)
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-cream-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <Coffee className="h-10 w-10 text-coffee-700" />
            <span className="text-2xl font-bold text-coffee-900">Hey! Coffee</span>
          </div>
          <p className="text-coffee-600 mt-2">ระบบแจ้งซ่อมบำรุง</p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-coffee-900 text-center mb-2">
            ยินดีต้อนรับ!
          </h1>
          <p className="text-coffee-600 text-center mb-6">
            กรุณาเลือกสาขาของคุณเพื่อเริ่มใช้งาน
          </p>

          {fetchingBranches ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-coffee-500" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="branch" className="label">
                  สาขา *
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
                <label htmlFor="phone" className="label">
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

              <button
                type="submit"
                disabled={loading || !branchId}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'เริ่มใช้งาน'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
