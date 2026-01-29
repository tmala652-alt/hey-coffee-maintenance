import Link from 'next/link'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-cherry-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="h-10 w-10 text-cherry-600" />
        </div>
        <h1 className="text-2xl font-bold text-coffee-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-coffee-600 mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        <Link href="/dashboard" className="btn-primary">
          <ArrowLeft className="h-5 w-5" />
          กลับแดชบอร์ด
        </Link>
      </div>
    </div>
  )
}
