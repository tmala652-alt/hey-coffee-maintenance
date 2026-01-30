'use client'

import { useState } from 'react'
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Users,
  LogIn,
  LayoutDashboard,
  Wrench,
  Clock,
  Shield,
  Bell,
  Settings,
  HelpCircle,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Building2,
  Package,
  Truck,
  Calendar,
  Receipt,
  FileText,
  Zap,
  Droplets,
  Wind,
  Coffee,
  Snowflake,
  Monitor,
  Home,
  ArrowDown,
  Minus,
  ArrowUp,
  Crown,
  Store,
  HardHat,
  Briefcase,
  Target,
  TrendingUp,
  MessageSquare,
  Search,
} from 'lucide-react'
import { clsx } from 'clsx'

interface Section {
  id: string
  title: string
  icon: React.ElementType
  content: React.ReactNode
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('overview')
  const [expandedItems, setExpandedItems] = useState<string[]>(['overview'])
  const [searchQuery, setSearchQuery] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const sections: Section[] = [
    {
      id: 'overview',
      title: 'ภาพรวมระบบ',
      icon: BookOpen,
      content: <OverviewSection />,
    },
    {
      id: 'roles',
      title: 'บทบาทผู้ใช้งาน',
      icon: Users,
      content: <RolesSection />,
    },
    {
      id: 'login',
      title: 'การเข้าสู่ระบบ',
      icon: LogIn,
      content: <LoginSection />,
    },
    {
      id: 'dashboard',
      title: 'แดชบอร์ด',
      icon: LayoutDashboard,
      content: <DashboardSection />,
    },
    {
      id: 'request',
      title: 'การแจ้งซ่อม',
      icon: Wrench,
      content: <RequestSection />,
    },
    {
      id: 'management',
      title: 'การจัดการงานซ่อม',
      icon: Briefcase,
      content: <ManagementSection />,
    },
    {
      id: 'sla',
      title: 'ระบบ SLA',
      icon: Clock,
      content: <SLASection />,
    },
    {
      id: 'admin',
      title: 'การจัดการสำหรับ Admin',
      icon: Shield,
      content: <AdminSection />,
    },
    {
      id: 'notifications',
      title: 'การแจ้งเตือน',
      icon: Bell,
      content: <NotificationsSection />,
    },
    {
      id: 'settings',
      title: 'การตั้งค่าบัญชี',
      icon: Settings,
      content: <SettingsSection />,
    },
    {
      id: 'faq',
      title: 'คำถามที่พบบ่อย',
      icon: HelpCircle,
      content: <FAQSection />,
    },
  ]

  const filteredSections = searchQuery
    ? sections.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sections

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-700/30 transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -inset-1 bg-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-coffee-900">คู่มือการใช้งาน</h1>
            <p className="text-coffee-500 mt-1">ระบบแจ้งซ่อม Hey! Coffee Maintenance</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="card-glass p-4 sticky top-24">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-400" />
              <input
                type="text"
                placeholder="ค้นหาหัวข้อ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-coffee-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {filteredSections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id)
                      toggleExpand(section.id)
                    }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group',
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                        : 'text-coffee-600 hover:bg-purple-50 hover:text-purple-700'
                    )}
                  >
                    <Icon className={clsx(
                      'h-5 w-5 flex-shrink-0 transition-transform duration-300',
                      !isActive && 'group-hover:scale-110'
                    )} />
                    <span className="flex-1 text-left">{section.title}</span>
                    <ChevronRight className={clsx(
                      'h-4 w-4 transition-transform duration-300',
                      isActive && 'rotate-90'
                    )} />
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card-glass p-6 lg:p-8">
            {sections.find(s => s.id === activeSection)?.content}
          </div>
        </div>
      </div>
    </div>
  )
}

// Section Components

function OverviewSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-purple-600" />
          ภาพรวมระบบ
        </h2>
        <p className="text-coffee-600 leading-relaxed">
          ระบบแจ้งซ่อม Hey! Coffee Maintenance เป็นระบบจัดการงานซ่อมบำรุงสำหรับองค์กรที่มีหลายสาขา
          ครอบคลุมตั้งแต่การแจ้งซ่อม การมอบหมายงาน การติดตาม SLA ไปจนถึงการจัดการค่าใช้จ่าย
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-coffee-900 mb-4">คุณสมบัติหลัก</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: FileText, title: 'แจ้งซ่อมออนไลน์', desc: 'พร้อมแนบรูปและวิดีโอประกอบ', color: 'from-blue-100 to-blue-200 text-blue-700' },
            { icon: Target, title: 'ระบบ SLA อัตโนมัติ', desc: 'ติดตามและแจ้งเตือนเมื่อใกล้ครบกำหนด', color: 'from-purple-100 to-purple-200 text-purple-700' },
            { icon: Users, title: 'มอบหมายงานอัตโนมัติ', desc: 'ตามทักษะและภาระงานของช่าง', color: 'from-matcha-100 to-matcha-200 text-matcha-700' },
            { icon: TrendingUp, title: 'ติดตามสถานะ Real-time', desc: 'ทราบความคืบหน้าทันที', color: 'from-honey-100 to-honey-200 text-honey-700' },
            { icon: Receipt, title: 'จัดการค่าใช้จ่าย', desc: 'บันทึกและอนุมัติค่าใช้จ่าย', color: 'from-orange-100 to-orange-200 text-orange-700' },
            { icon: Bell, title: 'แจ้งเตือนอัตโนมัติ', desc: 'รับทราบทุกความเคลื่อนไหว', color: 'from-cherry-100 to-cherry-200 text-cherry-700' },
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-cream-50 rounded-xl hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-coffee-900">{feature.title}</h4>
                <p className="text-sm text-coffee-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RolesSection() {
  const roles = [
    {
      icon: Crown,
      title: 'ผู้ดูแลระบบ (Admin)',
      color: 'from-cherry-500 to-cherry-600',
      permissions: [
        'ดูและจัดการงานทุกสาขา',
        'จัดการผู้ใช้ (เพิ่ม/แก้ไข/ลบ)',
        'จัดการสาขาและเวลาทำการ',
        'จัดการอุปกรณ์และผู้รับเหมา',
        'ดูรายงานและสถิติ',
        'อนุมัติค่าใช้จ่ายและใบเบิกเงิน',
      ],
    },
    {
      icon: Briefcase,
      title: 'ผู้จัดการ (Manager)',
      color: 'from-purple-500 to-purple-600',
      permissions: [
        'ดูงานในสาขาที่รับผิดชอบ',
        'อนุมัติค่าใช้จ่ายตามวงเงิน',
        'ดูรายงานสรุป',
        'จัดการทีมงาน',
      ],
    },
    {
      icon: HardHat,
      title: 'ช่างเทคนิค (Technician)',
      color: 'from-orange-500 to-orange-600',
      permissions: [
        'รับงานที่มอบหมาย',
        'อัปเดตสถานะงาน',
        'หยุดพัก/ดำเนินงานต่อ',
        'ดูคู่มือซ่อม',
        'บันทึกค่าใช้จ่าย',
      ],
    },
    {
      icon: Store,
      title: 'พนักงานสาขา (Branch)',
      color: 'from-blue-500 to-blue-600',
      permissions: [
        'แจ้งซ่อมใหม่',
        'ติดตามงานของสาขา',
        'ให้ Feedback หลังซ่อมเสร็จ',
      ],
    },
    {
      icon: Truck,
      title: 'ผู้รับเหมา (Vendor)',
      color: 'from-emerald-500 to-emerald-600',
      permissions: [
        'รับงานที่มอบหมาย',
        'จัดการข้อมูลส่วนตัว',
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <Users className="h-7 w-7 text-purple-600" />
          บทบาทผู้ใช้งาน
        </h2>
        <p className="text-coffee-600">ระบบมี 5 บทบาทหลัก แต่ละบทบาทมีสิทธิ์การใช้งานที่แตกต่างกัน</p>
      </div>

      <div className="space-y-4">
        {roles.map((role, i) => (
          <div key={i} className="border border-coffee-100 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className={`bg-gradient-to-r ${role.color} p-4 text-white`}>
              <div className="flex items-center gap-3">
                <role.icon className="h-6 w-6" />
                <h3 className="font-bold text-lg">{role.title}</h3>
              </div>
            </div>
            <div className="p-4 bg-white">
              <h4 className="text-sm font-semibold text-coffee-700 mb-2">สิทธิ์การใช้งาน:</h4>
              <ul className="space-y-1">
                {role.permissions.map((perm, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-coffee-600">
                    <CheckCircle className="h-4 w-4 text-matcha-500 flex-shrink-0" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LoginSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <LogIn className="h-7 w-7 text-purple-600" />
          การเข้าสู่ระบบ
        </h2>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
        <h3 className="font-semibold text-coffee-900 mb-4">วิธีเข้าสู่ระบบ</h3>
        <div className="space-y-4">
          {[
            { step: 1, text: 'เปิดเว็บไซต์ระบบแจ้งซ่อม' },
            { step: 2, text: 'กรอก อีเมล และ รหัสผ่าน' },
            { step: 3, text: 'คลิกปุ่ม "เข้าสู่ระบบ"' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                {item.step}
              </div>
              <p className="text-coffee-700">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-honey-50 border border-honey-200 rounded-xl p-4">
        <h3 className="font-semibold text-honey-800 mb-2 flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          ลืมรหัสผ่าน?
        </h3>
        <ol className="list-decimal list-inside text-sm text-honey-700 space-y-1">
          <li>คลิก "ลืมรหัสผ่าน" ที่หน้า Login</li>
          <li>กรอกอีเมลที่ลงทะเบียน</li>
          <li>ตรวจสอบอีเมลและทำตามคำแนะนำ</li>
        </ol>
      </div>
    </div>
  )
}

function DashboardSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 text-purple-600" />
          แดชบอร์ด
        </h2>
        <p className="text-coffee-600">หน้าแดชบอร์ดแสดงข้อมูลสรุปและสถิติที่สำคัญ</p>
      </div>

      <div>
        <h3 className="font-semibold text-coffee-900 mb-3">ส่วนประกอบหลัก</h3>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-coffee-700 to-coffee-900 text-white rounded-xl p-4">
            <h4 className="font-semibold mb-2">🎉 แบนเนอร์ต้อนรับ</h4>
            <ul className="text-sm text-coffee-200 space-y-1">
              <li>• แสดงข้อความทักทายตามช่วงเวลา</li>
              <li>• สรุปงานวันนี้</li>
              <li>• ปุ่มลัด "แจ้งซ่อมใหม่"</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'งานทั้งหมด', color: 'bg-coffee-100 text-coffee-700' },
              { label: 'รอดำเนินการ', color: 'bg-honey-100 text-honey-700' },
              { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700' },
              { label: 'เสร็จสิ้น', color: 'bg-matcha-100 text-matcha-700' },
            ].map((card, i) => (
              <div key={i} className={`${card.color} rounded-xl p-3 text-center`}>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-coffee-900 mb-3">สถิติสำหรับ Admin</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50">
              <tr>
                <th className="text-left p-3 font-semibold text-coffee-700">ตัวชี้วัด</th>
                <th className="text-left p-3 font-semibold text-coffee-700">ความหมาย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              <tr><td className="p-3 text-purple-600 font-medium">SLA Compliance</td><td className="p-3 text-coffee-600">เปอร์เซ็นต์งานที่เสร็จตาม SLA</td></tr>
              <tr><td className="p-3 text-orange-600 font-medium">ใกล้เกิน SLA</td><td className="p-3 text-coffee-600">งานที่ใช้เวลาเกิน 75%</td></tr>
              <tr><td className="p-3 text-blue-600 font-medium">เวลาตอบรับเฉลี่ย</td><td className="p-3 text-coffee-600">เวลาเฉลี่ยในการมอบหมายงาน</td></tr>
              <tr><td className="p-3 text-cherry-600 font-medium">งาน Critical</td><td className="p-3 text-coffee-600">งานเร่งด่วนที่ยังไม่เสร็จ</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function RequestSection() {
  const categories = [
    { icon: Zap, label: 'ไฟฟ้า', color: 'bg-yellow-100 text-yellow-700' },
    { icon: Droplets, label: 'ประปา', color: 'bg-blue-100 text-blue-700' },
    { icon: Wind, label: 'แอร์', color: 'bg-cyan-100 text-cyan-700' },
    { icon: Coffee, label: 'เครื่องชงกาแฟ', color: 'bg-coffee-100 text-coffee-700' },
    { icon: Snowflake, label: 'ตู้เย็น/ตู้แช่', color: 'bg-sky-100 text-sky-700' },
    { icon: Home, label: 'อาคาร', color: 'bg-stone-100 text-stone-700' },
    { icon: Monitor, label: 'IT/อุปกรณ์', color: 'bg-purple-100 text-purple-700' },
  ]

  const priorities = [
    { icon: ArrowDown, label: 'ต่ำ', color: 'bg-matcha-100 text-matcha-700 border-matcha-300', desc: 'งานไม่เร่งด่วน' },
    { icon: Minus, label: 'ปานกลาง', color: 'bg-honey-100 text-honey-700 border-honey-300', desc: 'งานทั่วไป' },
    { icon: ArrowUp, label: 'สูง', color: 'bg-orange-100 text-orange-700 border-orange-300', desc: 'ต้องการเร็ว' },
    { icon: AlertTriangle, label: 'เร่งด่วน', color: 'bg-cherry-100 text-cherry-700 border-cherry-300', desc: 'กระทบการทำงาน' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <Wrench className="h-7 w-7 text-purple-600" />
          การแจ้งซ่อม
        </h2>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
        <h3 className="font-bold text-lg text-coffee-900 mb-4">ขั้นตอนการแจ้งซ่อม</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { step: 1, title: 'เลือกสถานที่', desc: 'เลือกสาขาและตำแหน่งในสาขา' },
            { step: 2, title: 'กรอกหัวข้อ', desc: 'อธิบายปัญหาโดยย่อ เช่น "แอร์ไม่เย็น"' },
            { step: 3, title: 'เลือกประเภท', desc: 'เลือกประเภทงานซ่อม' },
            { step: 4, title: 'เลือกความสำคัญ', desc: 'กำหนดความเร่งด่วน' },
            { step: 5, title: 'ตั้งค่า SLA', desc: 'กำหนดระยะเวลาดำเนินการ' },
            { step: 6, title: 'กรอกรายละเอียด', desc: 'อธิบายปัญหาเพิ่มเติม' },
            { step: 7, title: 'แนบรูป/วิดีโอ', desc: 'เพิ่มหลักฐานประกอบ' },
            { step: 8, title: 'ส่งแจ้งซ่อม', desc: 'ตรวจสอบและยืนยัน' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 bg-white p-3 rounded-xl">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-coffee-900">{item.title}</p>
                <p className="text-sm text-coffee-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-coffee-900 mb-3">ประเภทงาน</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, i) => (
            <div key={i} className={`${cat.color} px-4 py-2 rounded-xl flex items-center gap-2`}>
              <cat.icon className="h-5 w-5" />
              <span className="font-medium">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-coffee-900 mb-3">ระดับความสำคัญ</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {priorities.map((p, i) => (
            <div key={i} className={`${p.color} p-3 rounded-xl border-2 text-center`}>
              <p.icon className="h-6 w-6 mx-auto mb-1" />
              <p className="font-semibold">{p.label}</p>
              <p className="text-xs opacity-80">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ManagementSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <Briefcase className="h-7 w-7 text-purple-600" />
          การจัดการงานซ่อม
        </h2>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
        <h3 className="font-bold text-lg text-orange-800 mb-4 flex items-center gap-2">
          <HardHat className="h-6 w-6" />
          สำหรับช่างเทคนิค
        </h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-coffee-900 mb-2">Flow การทำงาน</h4>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700">📋 รับงาน</span>
              <ChevronRight className="h-4 w-4 text-coffee-400" />
              <span className="bg-white px-3 py-1.5 rounded-lg border border-green-200 text-green-700">🔧 เริ่มงาน</span>
              <ChevronRight className="h-4 w-4 text-coffee-400" />
              <span className="bg-white px-3 py-1.5 rounded-lg border border-yellow-200 text-yellow-700">⏸️ หยุดพัก</span>
              <ChevronRight className="h-4 w-4 text-coffee-400" />
              <span className="bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700">▶️ ดำเนินต่อ</span>
              <ChevronRight className="h-4 w-4 text-coffee-400" />
              <span className="bg-white px-3 py-1.5 rounded-lg border border-matcha-200 text-matcha-700">✅ เสร็จสิ้น</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-coffee-900 mb-2">ปุ่มควบคุมงาน</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-coffee-100">
                <div className="flex items-center gap-2 mb-1">
                  <Play className="h-5 w-5 text-matcha-600" />
                  <span className="font-medium text-coffee-900">เริ่มดำเนินการ</span>
                </div>
                <p className="text-xs text-coffee-500">เปลี่ยนสถานะเป็น "กำลังดำเนินการ"</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-coffee-100">
                <div className="flex items-center gap-2 mb-1">
                  <Pause className="h-5 w-5 text-honey-600" />
                  <span className="font-medium text-coffee-900">หยุดพัก</span>
                </div>
                <p className="text-xs text-coffee-500">SLA จะหยุดนับอัตโนมัติ</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-coffee-100">
                <div className="flex items-center gap-2 mb-1">
                  <Play className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-coffee-900">ดำเนินการต่อ</span>
                </div>
                <p className="text-xs text-coffee-500">กลับมาทำงาน SLA ขยายตามเวลาหยุด</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-coffee-100">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-5 w-5 text-matcha-600" />
                  <span className="font-medium text-coffee-900">เสร็จสิ้น</span>
                </div>
                <p className="text-xs text-coffee-500">จบงานและแจ้งผู้แจ้ง</p>
              </div>
            </div>
          </div>

          <div className="bg-honey-100 border border-honey-200 rounded-xl p-3">
            <h4 className="font-semibold text-honey-800 mb-2">เหตุผลการหยุดพัก</h4>
            <div className="flex flex-wrap gap-2 text-sm">
              {['รออะไหล่', 'รออนุมัติ', 'รอผู้รับเหมา', 'ลูกค้าไม่อยู่', 'สภาพอากาศ', 'อื่นๆ'].map((r, i) => (
                <span key={i} className="bg-white px-2 py-1 rounded-lg text-honey-700">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-bold text-lg text-blue-800 mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6" />
          การมอบหมายงาน (Admin)
        </h3>

        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-coffee-900 mb-2">มอบหมายอัตโนมัติ</h4>
            <p className="text-sm text-coffee-600 mb-2">ระบบจะเลือกช่างที่เหมาะสมที่สุดตาม:</p>
            <ul className="text-sm text-coffee-500 space-y-1">
              <li>• <strong>skill_match</strong> - เน้นทักษะตรงกับงาน</li>
              <li>• <strong>least_loaded</strong> - เน้นช่างที่งานน้อย</li>
              <li>• <strong>round_robin</strong> - สลับช่างวนรอบ</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-coffee-900 mb-2">มอบหมายเอง</h4>
            <p className="text-sm text-coffee-600">เลือกช่างจากรายการที่แสดงทักษะและภาระงาน</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SLASection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <Clock className="h-7 w-7 text-purple-600" />
          ระบบ SLA
        </h2>
        <p className="text-coffee-600">
          SLA (Service Level Agreement) คือข้อตกลงระดับการให้บริการ กำหนดระยะเวลาที่งานต้องเสร็จสิ้น
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-coffee-900 mb-3">สถานะ SLA</h3>
        <div className="space-y-2">
          {[
            { status: 'On Track', percent: '0-74%', color: 'bg-matcha-500', desc: 'ปกติ ยังมีเวลาเหลือ' },
            { status: 'Warning', percent: '75-89%', color: 'bg-honey-500', desc: 'เตือน เหลือเวลาน้อย' },
            { status: 'Critical', percent: '90-99%', color: 'bg-orange-500', desc: 'วิกฤต ต้องรีบ' },
            { status: 'Breached', percent: '100%+', color: 'bg-cherry-500', desc: 'เกินกำหนด' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-cream-50 rounded-xl">
              <div className={`w-4 h-4 rounded-full ${item.color}`} />
              <div className="flex-1">
                <span className="font-semibold text-coffee-900">{item.status}</span>
                <span className="text-coffee-400 mx-2">|</span>
                <span className="text-coffee-600">{item.percent}</span>
              </div>
              <span className="text-sm text-coffee-500">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-matcha-50 border border-matcha-200 rounded-xl p-4">
          <h3 className="font-semibold text-matcha-800 mb-2 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            เวลาปฏิทิน
          </h3>
          <p className="text-sm text-matcha-700">นับเวลาต่อเนื่อง 24 ชั่วโมง รวมวันหยุดและนอกเวลางาน</p>
          <p className="text-xs text-matcha-600 mt-2">เหมาะกับ: งานเร่งด่วน</p>
        </div>
        <div className="bg-honey-50 border border-honey-200 rounded-xl p-4">
          <h3 className="font-semibold text-honey-800 mb-2 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            เวลาทำการ
          </h3>
          <p className="text-sm text-honey-700">นับเฉพาะเวลาทำการของสาขา ไม่รวมวันหยุด</p>
          <p className="text-xs text-honey-600 mt-2">เหมาะกับ: งานทั่วไป</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">การขยาย SLA อัตโนมัติ</h3>
        <p className="text-sm text-blue-700">
          เมื่อช่างหยุดพักงาน (Pause) ระบบจะหยุดนับ SLA และเมื่อดำเนินงานต่อ
          จะขยายกำหนดส่งงานตามระยะเวลาที่หยุดพักโดยอัตโนมัติ
        </p>
      </div>
    </div>
  )
}

function AdminSection() {
  const adminFeatures = [
    { icon: Users, title: 'จัดการผู้ใช้', path: '/admin/users', desc: 'เพิ่ม แก้ไข ลบ ผู้ใช้ในระบบ' },
    { icon: Building2, title: 'จัดการสาขา', path: '/admin/branches', desc: 'จัดการสาขาและเวลาทำการ' },
    { icon: Package, title: 'จัดการอุปกรณ์', path: '/admin/equipment', desc: 'ลงทะเบียนและติดตามอุปกรณ์' },
    { icon: Truck, title: 'ผู้รับเหมา', path: '/admin/vendors', desc: 'จัดการข้อมูลผู้รับเหมา' },
    { icon: Calendar, title: 'ตารางบำรุงรักษา', path: '/admin/schedules', desc: 'ตั้งการซ่อมบำรุงตามกำหนด' },
    { icon: Receipt, title: 'ค่าใช้จ่าย', path: '/admin/expenses', desc: 'บันทึกและจัดการค่าใช้จ่าย' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <Shield className="h-7 w-7 text-purple-600" />
          การจัดการสำหรับ Admin
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {adminFeatures.map((feature, i) => (
          <div key={i} className="bg-white border border-coffee-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-xl flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <h3 className="font-semibold text-coffee-900">{feature.title}</h3>
                <p className="text-sm text-coffee-500">{feature.desc}</p>
                <p className="text-xs text-purple-600 mt-1">{feature.path}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
        <h3 className="font-bold text-lg text-purple-800 mb-4">ระบบอนุมัติค่าใช้จ่าย</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-4 bg-white p-3 rounded-xl">
            <span className="w-24 text-sm font-medium text-coffee-600">Level 1</span>
            <span className="text-coffee-900">0 - 5,000 บาท</span>
            <span className="text-sm text-purple-600 ml-auto">Manager</span>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 rounded-xl">
            <span className="w-24 text-sm font-medium text-coffee-600">Level 2</span>
            <span className="text-coffee-900">5,001 - 20,000 บาท</span>
            <span className="text-sm text-purple-600 ml-auto">Admin</span>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 rounded-xl">
            <span className="w-24 text-sm font-medium text-coffee-600">Level 3</span>
            <span className="text-coffee-900">20,001+ บาท</span>
            <span className="text-sm text-purple-600 ml-auto">Admin + CEO</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationsSection() {
  const notifications = [
    { icon: Wrench, type: 'มอบหมายงาน', color: 'bg-blue-100 text-blue-600', desc: 'ได้รับงานใหม่' },
    { icon: Clock, type: 'เตือน SLA', color: 'bg-cherry-100 text-cherry-600', desc: 'SLA ใกล้หมดเวลา' },
    { icon: CheckCircle, type: 'สถานะเปลี่ยน', color: 'bg-matcha-100 text-matcha-600', desc: 'งานเปลี่ยนสถานะ' },
    { icon: MessageSquare, type: 'แชท', color: 'bg-honey-100 text-honey-600', desc: 'มีข้อความใหม่' },
    { icon: Calendar, type: 'งานตามกำหนด', color: 'bg-purple-100 text-purple-600', desc: 'งานบำรุงรักษาตามรอบ' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <Bell className="h-7 w-7 text-purple-600" />
          การแจ้งเตือน
        </h2>
      </div>

      <div>
        <h3 className="font-semibold text-coffee-900 mb-3">ประเภทการแจ้งเตือน</h3>
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-cream-50 rounded-xl">
              <div className={`w-10 h-10 rounded-xl ${n.color} flex items-center justify-center`}>
                <n.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-coffee-900">{n.type}</p>
                <p className="text-sm text-coffee-500">{n.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-honey-50 border border-honey-200 rounded-xl p-4">
        <h3 className="font-semibold text-honey-800 mb-2">วิธีดูการแจ้งเตือน</h3>
        <ol className="list-decimal list-inside text-sm text-honey-700 space-y-1">
          <li>คลิกไอคอนกระดิ่ง 🔔 ที่มุมขวาบน</li>
          <li>ตัวเลขสีแดงแสดงจำนวนที่ยังไม่อ่าน</li>
          <li>คลิกที่รายการเพื่อไปยังหน้าที่เกี่ยวข้อง</li>
          <li>คลิก "อ่านทั้งหมด" เพื่อเคลียร์</li>
        </ol>
      </div>
    </div>
  )
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <Settings className="h-7 w-7 text-purple-600" />
          การตั้งค่าบัญชี
        </h2>
      </div>

      <div className="bg-cream-50 rounded-xl p-4">
        <h3 className="font-semibold text-coffee-900 mb-3">ข้อมูลที่แก้ไขได้</h3>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-coffee-600">
            <CheckCircle className="h-4 w-4 text-matcha-500" />
            ชื่อ-นามสกุล
          </li>
          <li className="flex items-center gap-2 text-coffee-600">
            <CheckCircle className="h-4 w-4 text-matcha-500" />
            เบอร์โทรศัพท์
          </li>
          <li className="flex items-center gap-2 text-coffee-600">
            <CheckCircle className="h-4 w-4 text-matcha-500" />
            สาขาที่สังกัด (ยกเว้น Admin)
          </li>
        </ul>
      </div>

      <div className="bg-cream-50 rounded-xl p-4">
        <h3 className="font-semibold text-coffee-900 mb-3">ตั้งค่าการแจ้งเตือน</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="text-coffee-700">แจ้งเตือนทางอีเมล</span>
            <div className="w-12 h-6 bg-matcha-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="text-coffee-700">Push Notification</span>
            <div className="w-12 h-6 bg-matcha-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-coffee-50 rounded-xl p-4">
        <h3 className="font-semibold text-coffee-700 mb-3">ข้อมูลบัญชี (อ่านอย่างเดียว)</h3>
        <ul className="space-y-1 text-sm text-coffee-600">
          <li>• อีเมล</li>
          <li>• บทบาท</li>
          <li>• วันที่สร้างบัญชี</li>
        </ul>
      </div>
    </div>
  )
}

function FAQSection() {
  const faqs = [
    { q: 'ฉันลืมรหัสผ่าน ทำอย่างไร?', a: 'คลิก "ลืมรหัสผ่าน" ที่หน้า Login และทำตามขั้นตอน' },
    { q: 'ทำไมฉันไม่เห็นงานบางรายการ?', a: 'คุณจะเห็นเฉพาะงานที่เกี่ยวข้องกับบทบาทและสาขาของคุณ' },
    { q: 'SLA หยุดนับได้ไหม?', a: 'ได้ เมื่อช่างหยุดพักงาน (Pause) SLA จะหยุดนับอัตโนมัติ' },
    { q: 'ฉันสามารถแนบไฟล์อะไรได้บ้าง?', a: 'รูปภาพ (JPG, PNG สูงสุด 5MB) และวิดีโอ (MP4, MOV สูงสุด 50MB)' },
    { q: 'ถ้าต้องการเปลี่ยนสาขาที่สังกัดทำอย่างไร?', a: 'ติดต่อผู้ดูแลระบบเพื่อแก้ไขข้อมูล' },
    { q: 'งานเร่งด่วนจะถูกจัดการอย่างไร?', a: 'งาน Critical จะแสดงแจ้งเตือนพิเศษและถูกจัดลำดับความสำคัญสูงสุด' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-coffee-900 mb-4 flex items-center gap-3">
          <HelpCircle className="h-7 w-7 text-purple-600" />
          คำถามที่พบบ่อย (FAQ)
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-coffee-100 rounded-xl overflow-hidden">
            <div className="bg-cream-50 p-4">
              <p className="font-semibold text-coffee-900 flex items-start gap-2">
                <span className="text-purple-600 font-bold">Q:</span>
                {faq.q}
              </p>
            </div>
            <div className="p-4 bg-white">
              <p className="text-coffee-600 flex items-start gap-2">
                <span className="text-matcha-600 font-bold">A:</span>
                {faq.a}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100 text-center">
        <h3 className="font-bold text-lg text-purple-800 mb-2">ต้องการความช่วยเหลือเพิ่มเติม?</h3>
        <p className="text-purple-600 mb-4">ติดต่อทีมสนับสนุน</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <div className="flex items-center justify-center gap-2 text-purple-700">
            <span>📧</span>
            <span>support@heycoffee.co.th</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-purple-700">
            <span>📞</span>
            <span>02-xxx-xxxx</span>
          </div>
        </div>
      </div>
    </div>
  )
}
