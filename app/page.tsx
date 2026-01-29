import Link from 'next/link'
import {
  Coffee,
  Wrench,
  CheckCircle,
  Clock,
  MessageCircle,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-cream-100 overflow-hidden">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-honey-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-coffee-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-matcha-500/10 rounded-full blur-3xl animate-float" />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-coffee-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-coffee-600 to-coffee-800 rounded-2xl flex items-center justify-center shadow-lg shadow-coffee-700/30">
                <Coffee className="h-7 w-7 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-coffee-900">Hey! Coffee</span>
                <span className="hidden sm:block text-xs text-coffee-500">Maintenance System</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="btn-ghost hidden sm:flex">
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" className="btn-primary">
                <Sparkles className="h-4 w-4" />
                เริ่มต้นใช้งาน
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-honey-100 to-cream-100 rounded-full border border-honey-200 mb-8 animate-fade-in">
              <Zap className="h-4 w-4 text-honey-600" />
              <span className="text-sm font-medium text-coffee-700">ระบบแจ้งซ่อมอัจฉริยะ สำหรับทุกสาขา</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 animate-slide-up">
              <span className="text-coffee-900">ระบบแจ้งซ่อม</span>
              <br />
              <span className="gradient-text-accent">Hey! Coffee</span>
            </h1>

            {/* Description */}
            <p className="text-xl sm:text-2xl text-coffee-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              จัดการงานซ่อมบำรุงได้อย่างมีประสิทธิภาพ
              <br className="hidden sm:block" />
              ติดตามสถานะ แชทกับช่าง และดูรายงานแบบ
              <span className="text-honey-600 font-semibold"> Real-time</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/login" className="btn-primary btn-lg group">
                <Wrench className="h-5 w-5 transition-transform group-hover:rotate-12" />
                เริ่มแจ้งซ่อม
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className="btn-secondary btn-lg">
                <BarChart3 className="h-5 w-5" />
                ดูสถานะงาน
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-coffee-900">10+</div>
                <div className="text-sm text-coffee-500 mt-1">สาขาทั่วประเทศ</div>
              </div>
              <div className="text-center border-x border-coffee-200">
                <div className="text-3xl sm:text-4xl font-bold text-honey-600">24/7</div>
                <div className="text-sm text-coffee-500 mt-1">พร้อมให้บริการ</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-matcha-600">99%</div>
                <div className="text-sm text-coffee-500 mt-1">SLA สำเร็จ</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gradient-to-b from-white to-cream-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-coffee-900 mb-4">
                ฟีเจอร์ที่ครบครัน
              </h2>
              <p className="text-lg text-coffee-600 max-w-2xl mx-auto">
                ทุกสิ่งที่คุณต้องการสำหรับการจัดการงานซ่อมบำรุง
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="card-hover p-8 group">
                <div className="icon-container bg-gradient-to-br from-honey-100 to-honey-200 mb-6">
                  <Wrench className="h-7 w-7 text-honey-700" />
                </div>
                <h3 className="text-xl font-bold text-coffee-900 mb-3">แจ้งซ่อมง่าย</h3>
                <p className="text-coffee-600 leading-relaxed">
                  แจ้งปัญหาพร้อมแนบรูปภาพได้ทันที ระบุความเร่งด่วนและประเภทงานได้ชัดเจน
                </p>
              </div>

              {/* Feature 2 */}
              <div className="card-hover p-8 group">
                <div className="icon-container bg-gradient-to-br from-matcha-100 to-matcha-200 mb-6">
                  <Clock className="h-7 w-7 text-matcha-700" />
                </div>
                <h3 className="text-xl font-bold text-coffee-900 mb-3">ติดตาม Real-time</h3>
                <p className="text-coffee-600 leading-relaxed">
                  ดูสถานะงานและความคืบหน้าได้ตลอด 24 ชั่วโมง อัพเดทแบบทันที
                </p>
              </div>

              {/* Feature 3 */}
              <div className="card-hover p-8 group">
                <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200 mb-6">
                  <MessageCircle className="h-7 w-7 text-blue-700" />
                </div>
                <h3 className="text-xl font-bold text-coffee-900 mb-3">แชทกับช่าง</h3>
                <p className="text-coffee-600 leading-relaxed">
                  สื่อสารกับทีมช่างได้โดยตรง ส่งรูปและข้อมูลเพิ่มเติมได้ทันที
                </p>
              </div>

              {/* Feature 4 */}
              <div className="card-hover p-8 group">
                <div className="icon-container bg-gradient-to-br from-coffee-100 to-coffee-200 mb-6">
                  <BarChart3 className="h-7 w-7 text-coffee-700" />
                </div>
                <h3 className="text-xl font-bold text-coffee-900 mb-3">รายงานครบถ้วน</h3>
                <p className="text-coffee-600 leading-relaxed">
                  สรุปค่าใช้จ่าย SLA และประวัติการซ่อมทั้งหมดในที่เดียว
                </p>
              </div>

              {/* Feature 5 */}
              <div className="card-hover p-8 group">
                <div className="icon-container bg-gradient-to-br from-cherry-100 to-cherry-200 mb-6">
                  <Shield className="h-7 w-7 text-cherry-700" />
                </div>
                <h3 className="text-xl font-bold text-coffee-900 mb-3">ปลอดภัย</h3>
                <p className="text-coffee-600 leading-relaxed">
                  ระบบความปลอดภัยระดับสูง ข้อมูลถูกเข้ารหัสและมีการควบคุมสิทธิ์
                </p>
              </div>

              {/* Feature 6 */}
              <div className="card-hover p-8 group">
                <div className="icon-container bg-gradient-to-br from-purple-100 to-purple-200 mb-6">
                  <CheckCircle className="h-7 w-7 text-purple-700" />
                </div>
                <h3 className="text-xl font-bold text-coffee-900 mb-3">ใช้งานง่าย</h3>
                <p className="text-coffee-600 leading-relaxed">
                  ออกแบบมาให้ใช้งานง่าย ไม่ต้องอบรม เริ่มใช้งานได้ทันที
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card-glass p-12 text-center relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-honey-500/20 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-coffee-500/20 to-transparent rounded-full blur-3xl" />

              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-coffee-600 to-coffee-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-coffee-700/30 animate-bounce-soft">
                  <Coffee className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-coffee-900 mb-4">
                  พร้อมเริ่มใช้งานแล้วหรือยัง?
                </h2>
                <p className="text-lg text-coffee-600 mb-8 max-w-xl mx-auto">
                  เข้าสู่ระบบหรือสมัครสมาชิกเพื่อเริ่มจัดการงานซ่อมบำรุงอย่างมืออาชีพ
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register" className="btn-primary btn-lg">
                    <Sparkles className="h-5 w-5" />
                    สมัครสมาชิกฟรี
                  </Link>
                  <Link href="/login" className="btn-secondary btn-lg">
                    เข้าสู่ระบบ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-coffee-800 to-coffee-900 text-cream-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Coffee className="h-7 w-7" />
              </div>
              <div>
                <span className="text-xl font-bold">Hey! Coffee</span>
                <p className="text-coffee-400 text-sm">Maintenance System</p>
              </div>
            </div>
            <p className="text-coffee-400 text-sm text-center">
              © 2024 Hey! Coffee. ระบบแจ้งซ่อมบำรุง - สำหรับใช้งานภายในองค์กร
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
