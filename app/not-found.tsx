import Link from 'next/link'
import { Coffee, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-coffee-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Coffee className="h-10 w-10 text-coffee-700" />
        </div>
        <h1 className="text-4xl font-bold text-coffee-900 mb-2">404</h1>
        <p className="text-xl text-coffee-600 mb-6">ไม่พบหน้าที่คุณต้องการ</p>
        <Link href="/" className="btn-primary">
          <Home className="h-5 w-5" />
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  )
}
