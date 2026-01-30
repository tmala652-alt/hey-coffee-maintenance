'use client'

import { useState } from 'react'
import {
  GitBranch,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Wrench,
  Building2,
  Shield,
  Send,
  Search,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Star,
  FileText,
  Bell,
  Timer,
  AlertCircle,
  ChevronRight,
  Zap,
  Target,
  TrendingUp,
  Users,
  Settings,
  Calendar,
  CheckCheck,
} from 'lucide-react'

type WorkflowSection = 'overview' | 'request' | 'assignment' | 'execution' | 'sla' | 'escalation' | 'roles'

export default function WorkflowPage() {
  const [activeSection, setActiveSection] = useState<WorkflowSection>('overview')

  const sections = [
    { id: 'overview', label: 'ภาพรวมระบบ', icon: GitBranch },
    { id: 'request', label: 'การแจ้งซ่อม', icon: Send },
    { id: 'assignment', label: 'การมอบหมายงาน', icon: Users },
    { id: 'execution', label: 'การดำเนินงาน', icon: Wrench },
    { id: 'sla', label: 'ระบบ SLA', icon: Timer },
    { id: 'escalation', label: 'การ Escalate', icon: AlertTriangle },
    { id: 'roles', label: 'บทบาทผู้ใช้', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-honey-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-coffee-800 via-coffee-700 to-coffee-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
              <GitBranch className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Workflow ระบบแจ้งซ่อม</h1>
              <p className="text-coffee-200 mt-1">เรียนรู้ขั้นตอนการทำงานของระบบ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-4 sticky top-8">
              <h3 className="text-sm font-semibold text-coffee-600 mb-3 px-2">หัวข้อ</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as WorkflowSection)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-coffee-700 to-coffee-800 text-white shadow-lg'
                        : 'text-coffee-600 hover:bg-coffee-50'
                    }`}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'request' && <RequestSection />}
            {activeSection === 'assignment' && <AssignmentSection />}
            {activeSection === 'execution' && <ExecutionSection />}
            {activeSection === 'sla' && <SLASection />}
            {activeSection === 'escalation' && <EscalationSection />}
            {activeSection === 'roles' && <RolesSection />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Overview Section
function OverviewSection() {
  const mainFlow = [
    { icon: Send, label: 'แจ้งซ่อม', color: 'bg-blue-500', desc: 'สาขาแจ้งปัญหา' },
    { icon: Search, label: 'รอตรวจสอบ', color: 'bg-amber-500', desc: 'Admin ตรวจสอบ' },
    { icon: Users, label: 'มอบหมาย', color: 'bg-purple-500', desc: 'เลือกช่างซ่อม' },
    { icon: Wrench, label: 'ดำเนินการ', color: 'bg-orange-500', desc: 'ช่างซ่อมแซม' },
    { icon: CheckCircle2, label: 'เสร็จสิ้น', color: 'bg-green-500', desc: 'งานสำเร็จ' },
    { icon: Star, label: 'Feedback', color: 'bg-pink-500', desc: 'ประเมินงาน' },
  ]

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h2 className="text-xl font-bold text-coffee-900 mb-6 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-coffee-600" />
          ภาพรวม Workflow หลัก
        </h2>

        {/* Main Flow Diagram */}
        <div className="relative">
          {/* Desktop Flow */}
          <div className="hidden md:flex items-center justify-between gap-2">
            {mainFlow.map((step, index) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-coffee-900">{step.label}</p>
                  <p className="text-xs text-coffee-500">{step.desc}</p>
                </div>
                {index < mainFlow.length - 1 && (
                  <ChevronRight className="h-6 w-6 text-coffee-300 mx-2" />
                )}
              </div>
            ))}
          </div>

          {/* Mobile Flow */}
          <div className="md:hidden space-y-4">
            {mainFlow.map((step, index) => (
              <div key={step.label}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${step.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-coffee-900">{step.label}</p>
                    <p className="text-sm text-coffee-500">{step.desc}</p>
                  </div>
                </div>
                {index < mainFlow.length - 1 && (
                  <div className="ml-7 my-2 h-6 w-0.5 bg-coffee-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h3 className="text-lg font-bold text-coffee-900 mb-4">สถานะงาน</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { status: 'pending', label: 'รอดำเนินการ', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            { status: 'assigned', label: 'มอบหมายแล้ว', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { status: 'in_progress', label: 'กำลังดำเนินการ', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { status: 'pending_review', label: 'รอตรวจสอบ', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            { status: 'completed', label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700 border-green-200' },
            { status: 'cancelled', label: 'ยกเลิก', color: 'bg-gray-100 text-gray-700 border-gray-200' },
          ].map((item) => (
            <div key={item.status} className={`px-3 py-2 rounded-lg border ${item.color} text-center text-sm font-medium`}>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <Zap className="h-8 w-8 mb-3 opacity-80" />
          <h4 className="text-lg font-bold">Auto-Assignment</h4>
          <p className="text-blue-100 text-sm mt-1">มอบหมายงานอัตโนมัติตาม skill และ workload</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
          <Timer className="h-8 w-8 mb-3 opacity-80" />
          <h4 className="text-lg font-bold">SLA Tracking</h4>
          <p className="text-amber-100 text-sm mt-1">ติดตามเวลาและแจ้งเตือนก่อนหมดกำหนด</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-6 text-white">
          <AlertTriangle className="h-8 w-8 mb-3 opacity-80" />
          <h4 className="text-lg font-bold">Escalation</h4>
          <p className="text-red-100 text-sm mt-1">ยกระดับงานอัตโนมัติเมื่อเกิน SLA</p>
        </div>
      </div>
    </div>
  )
}

// Request Section
function RequestSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h2 className="text-xl font-bold text-coffee-900 mb-6 flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-600" />
          ขั้นตอนการแจ้งซ่อม
        </h2>

        <div className="space-y-6">
          {/* Step by Step */}
          {[
            { step: 1, title: 'เข้าสู่ระบบ', desc: 'พนักงานสาขาเข้าสู่ระบบด้วย Email และ Password', icon: User },
            { step: 2, title: 'คลิก "แจ้งซ่อมใหม่"', desc: 'จากหน้า Dashboard หรือเมนู Sidebar', icon: FileText },
            { step: 3, title: 'กรอกข้อมูล', desc: 'ระบุหัวข้อ, ประเภท, ความสำคัญ, SLA และรายละเอียด', icon: Settings },
            { step: 4, title: 'แนบรูปภาพ (ถ้ามี)', desc: 'ถ่ายรูปปัญหาเพื่อให้ช่างเข้าใจได้ง่ายขึ้น', icon: FileText },
            { step: 5, title: 'ส่งแจ้งซ่อม', desc: 'กดปุ่ม "ส่งแจ้งซ่อม" ระบบจะสร้าง Ticket อัตโนมัติ', icon: Send },
          ].map((item, index) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {item.step}
                </div>
                {index < 4 && <div className="w-0.5 h-full bg-blue-200 mt-2" />}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-coffee-900">{item.title}</h4>
                </div>
                <p className="text-coffee-600 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Levels */}
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h3 className="text-lg font-bold text-coffee-900 mb-4">ระดับความสำคัญ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { level: 'low', label: 'ต่ำ', color: 'border-l-green-500 bg-green-50', desc: 'งานทั่วไป ไม่เร่งด่วน', sla: 'SLA: 72 ชั่วโมง' },
            { level: 'medium', label: 'ปานกลาง', color: 'border-l-amber-500 bg-amber-50', desc: 'งานที่ควรทำเร็ว', sla: 'SLA: 24-48 ชั่วโมง' },
            { level: 'high', label: 'สูง', color: 'border-l-orange-500 bg-orange-50', desc: 'งานสำคัญ กระทบการใช้งาน', sla: 'SLA: 8 ชั่วโมง' },
            { level: 'critical', label: 'เร่งด่วน', color: 'border-l-red-500 bg-red-50', desc: 'งานวิกฤต ต้องแก้ไขทันที', sla: 'SLA: 4 ชั่วโมง' },
          ].map((item) => (
            <div key={item.level} className={`border-l-4 ${item.color} rounded-r-xl p-4`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-coffee-900">{item.label}</span>
                <span className="text-xs bg-white px-2 py-1 rounded-full text-coffee-600">{item.sla}</span>
              </div>
              <p className="text-sm text-coffee-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h3 className="text-lg font-bold text-coffee-900 mb-4">ประเภทงานซ่อม</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { type: 'electrical', label: 'ไฟฟ้า', emoji: '⚡', color: 'bg-yellow-100 border-yellow-300' },
            { type: 'plumbing', label: 'ประปา', emoji: '💧', color: 'bg-blue-100 border-blue-300' },
            { type: 'aircon', label: 'แอร์', emoji: '❄️', color: 'bg-cyan-100 border-cyan-300' },
            { type: 'coffee_machine', label: 'เครื่องชงกาแฟ', emoji: '☕', color: 'bg-amber-100 border-amber-300' },
            { type: 'furniture', label: 'เฟอร์นิเจอร์', emoji: '🪑', color: 'bg-orange-100 border-orange-300' },
            { type: 'equipment', label: 'อุปกรณ์', emoji: '🔧', color: 'bg-gray-100 border-gray-300' },
            { type: 'structural', label: 'โครงสร้าง', emoji: '🏗️', color: 'bg-stone-100 border-stone-300' },
            { type: 'other', label: 'อื่นๆ', emoji: '📦', color: 'bg-purple-100 border-purple-300' },
          ].map((item) => (
            <div key={item.type} className={`${item.color} border rounded-xl p-4 text-center`}>
              <span className="text-2xl">{item.emoji}</span>
              <p className="mt-1 text-sm font-medium text-coffee-900">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Assignment Section
function AssignmentSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h2 className="text-xl font-bold text-coffee-900 mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          การมอบหมายงาน
        </h2>

        {/* Flow Diagram */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <p className="mt-2 font-semibold text-coffee-900">งานใหม่</p>
              <p className="text-xs text-coffee-500">สถานะ: Pending</p>
            </div>

            <ArrowRight className="h-8 w-8 text-purple-400 hidden md:block" />
            <ArrowDown className="h-8 w-8 text-purple-400 md:hidden" />

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <p className="mt-2 font-semibold text-coffee-900">Admin ตรวจสอบ</p>
              <p className="text-xs text-coffee-500">วิเคราะห์งาน</p>
            </div>

            <ArrowRight className="h-8 w-8 text-purple-400 hidden md:block" />
            <ArrowDown className="h-8 w-8 text-purple-400 md:hidden" />

            <div className="text-center p-4 border-2 border-dashed border-purple-300 rounded-xl">
              <p className="text-sm font-semibold text-purple-700 mb-2">เลือกวิธี</p>
              <div className="flex flex-col gap-2">
                <div className="bg-white px-3 py-1.5 rounded-lg text-sm text-coffee-700 shadow-sm">
                  <Zap className="h-4 w-4 inline mr-1 text-amber-500" /> Auto-Assign
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg text-sm text-coffee-700 shadow-sm">
                  <User className="h-4 w-4 inline mr-1 text-blue-500" /> Manual
                </div>
              </div>
            </div>

            <ArrowRight className="h-8 w-8 text-purple-400 hidden md:block" />
            <ArrowDown className="h-8 w-8 text-purple-400 md:hidden" />

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Wrench className="h-10 w-10 text-white" />
              </div>
              <p className="mt-2 font-semibold text-coffee-900">ช่างรับงาน</p>
              <p className="text-xs text-coffee-500">สถานะ: Assigned</p>
            </div>
          </div>
        </div>

        {/* Auto-Assignment Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-coffee-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-amber-500" />
              <h4 className="font-semibold text-coffee-900">Auto-Assignment</h4>
            </div>
            <p className="text-sm text-coffee-600 mb-4">ระบบจะเลือกช่างโดยพิจารณาจาก:</p>
            <ul className="space-y-2">
              {[
                'ทักษะตรงกับประเภทงาน',
                'ปริมาณงานปัจจุบัน (Workload)',
                'พื้นที่/สาขาที่รับผิดชอบ',
                'ความพร้อมของช่าง',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-coffee-700">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-coffee-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-coffee-900">Manual Assignment</h4>
            </div>
            <p className="text-sm text-coffee-600 mb-4">Admin เลือกช่างเอง สำหรับกรณี:</p>
            <ul className="space-y-2">
              {[
                'งานเฉพาะทางต้องการผู้เชี่ยวชาญ',
                'งานเร่งด่วนพิเศษ',
                'ลูกค้าระบุช่างที่ต้องการ',
                'งานต่อเนื่องจากครั้งก่อน',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-coffee-700">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Notification Flow */}
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h3 className="text-lg font-bold text-coffee-900 mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          การแจ้งเตือน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="font-semibold text-blue-900 mb-2">ช่างเทคนิค</p>
            <p className="text-sm text-blue-700">ได้รับแจ้งเตือนทันทีเมื่อมีงานใหม่</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="font-semibold text-amber-900 mb-2">ผู้แจ้งซ่อม</p>
            <p className="text-sm text-amber-700">ได้รับแจ้งเมื่องานถูกมอบหมาย</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="font-semibold text-purple-900 mb-2">Admin/Manager</p>
            <p className="text-sm text-purple-700">ติดตามสถานะงานทั้งหมด</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Execution Section
function ExecutionSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h2 className="text-xl font-bold text-coffee-900 mb-6 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-orange-600" />
          ขั้นตอนการดำเนินงาน
        </h2>

        {/* Tech Flow */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { icon: CheckCheck, label: 'รับงาน', color: 'bg-blue-500', desc: 'ยืนยันรับงาน' },
              { icon: Play, label: 'เริ่มงาน', color: 'bg-green-500', desc: 'เริ่มจับเวลา' },
              { icon: Pause, label: 'หยุดพัก', color: 'bg-amber-500', desc: 'SLA หยุดนับ' },
              { icon: RotateCcw, label: 'ดำเนินต่อ', color: 'bg-blue-500', desc: 'SLA นับต่อ' },
              { icon: CheckCircle2, label: 'เสร็จสิ้น', color: 'bg-green-600', desc: 'จบงาน' },
            ].map((step, i) => (
              <div key={step.label} className="text-center">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto shadow-lg hover:scale-110 transition-transform`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <p className="mt-2 font-semibold text-coffee-900 text-sm">{step.label}</p>
                <p className="text-xs text-coffee-500">{step.desc}</p>
                {i < 4 && (
                  <ChevronRight className="h-5 w-5 text-coffee-300 mx-auto mt-2 hidden md:block rotate-0 md:absolute md:top-6" style={{ left: `${(i + 1) * 20 - 2}%` }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions Available */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
          <h3 className="text-lg font-bold text-coffee-900 mb-4">ปุ่มควบคุม</h3>
          <div className="space-y-3">
            {[
              { icon: Play, label: 'เริ่มดำเนินการ', color: 'bg-green-500', desc: 'เริ่มทำงานและจับเวลา' },
              { icon: Pause, label: 'หยุดพัก', color: 'bg-amber-500', desc: 'หยุดชั่วคราว SLA หยุดนับ' },
              { icon: RotateCcw, label: 'ดำเนินการต่อ', color: 'bg-blue-500', desc: 'กลับมาทำงานต่อ' },
              { icon: CheckCircle2, label: 'เสร็จสิ้น', color: 'bg-green-600', desc: 'ปิดงาน' },
            ].map((action) => (
              <div key={action.label} className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl">
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-coffee-900">{action.label}</p>
                  <p className="text-xs text-coffee-500">{action.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
          <h3 className="text-lg font-bold text-coffee-900 mb-4">ฟีเจอร์ระหว่างงาน</h3>
          <div className="space-y-3">
            {[
              { icon: MessageSquare, label: 'แชทกับผู้แจ้ง', desc: 'สื่อสารสอบถามรายละเอียด' },
              { icon: FileText, label: 'อัปเดตสถานะ', desc: 'รายงานความคืบหน้า' },
              { icon: Target, label: 'ดู SLA', desc: 'ตรวจสอบเวลาที่เหลือ' },
              { icon: AlertCircle, label: 'ขอ Escalate', desc: 'ส่งต่อเมื่อต้องการความช่วยเหลือ' },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl">
                <div className="w-10 h-10 bg-coffee-100 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-coffee-600" />
                </div>
                <div>
                  <p className="font-medium text-coffee-900">{feature.label}</p>
                  <p className="text-xs text-coffee-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completion */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">เมื่องานเสร็จสิ้น</h3>
            <p className="text-green-100 text-sm">ผู้แจ้งจะได้รับแจ้งเตือนให้ประเมินงาน</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {['ความพึงพอใจ', 'ความรวดเร็ว', 'คุณภาพงาน', 'ความเป็นมืออาชีพ'].map((item) => (
            <div key={item} className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// SLA Section
function SLASection() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h2 className="text-xl font-bold text-coffee-900 mb-6 flex items-center gap-2">
          <Timer className="h-5 w-5 text-amber-600" />
          ระบบ SLA (Service Level Agreement)
        </h2>

        {/* SLA Overview */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-6">
          <p className="text-coffee-700 leading-relaxed">
            SLA คือข้อตกลงระดับการให้บริการ กำหนดเวลาสูงสุดที่ต้องแก้ไขปัญหาให้เสร็จสิ้น
            ระบบจะติดตามและแจ้งเตือนอัตโนมัติเมื่อใกล้หรือเกินกำหนด
          </p>
        </div>

        {/* SLA Levels */}
        <h3 className="text-lg font-bold text-coffee-900 mb-4">ระดับ SLA</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { hours: 4, label: '4 ชั่วโมง', type: 'เร่งด่วน', color: 'bg-red-500' },
            { hours: 8, label: '8 ชั่วโมง', type: 'สูง', color: 'bg-orange-500' },
            { hours: 24, label: '24 ชั่วโมง', type: 'ปานกลาง', color: 'bg-amber-500' },
            { hours: 48, label: '48 ชั่วโมง', type: 'ต่ำ', color: 'bg-blue-500' },
            { hours: 72, label: '72 ชั่วโมง', type: 'ทั่วไป', color: 'bg-green-500' },
          ].map((sla) => (
            <div key={sla.hours} className="text-center p-4 border border-coffee-100 rounded-xl hover:shadow-lg transition-shadow">
              <div className={`w-14 h-14 ${sla.color} rounded-full flex items-center justify-center mx-auto text-white font-bold text-lg shadow-lg`}>
                {sla.hours}h
              </div>
              <p className="mt-2 font-semibold text-coffee-900">{sla.label}</p>
              <p className="text-xs text-coffee-500">{sla.type}</p>
            </div>
          ))}
        </div>

        {/* SLA Status Colors */}
        <h3 className="text-lg font-bold text-coffee-900 mb-4">สถานะ SLA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { range: '0-74%', status: 'ปกติ', color: 'bg-green-500', icon: '🟢', desc: 'เวลายังเหลือเพียงพอ' },
            { range: '75-89%', status: 'เตือน', color: 'bg-amber-500', icon: '🟡', desc: 'เริ่มใกล้หมดเวลา' },
            { range: '90-99%', status: 'วิกฤต', color: 'bg-orange-500', icon: '🟠', desc: 'เวลาใกล้หมด!' },
            { range: '100%+', status: 'เกินกำหนด', color: 'bg-red-500', icon: '🔴', desc: 'เกิน SLA แล้ว' },
          ].map((level) => (
            <div key={level.range} className={`${level.color} rounded-xl p-4 text-white`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{level.icon}</span>
                <span className="font-bold">{level.status}</span>
              </div>
              <p className="text-sm opacity-90">{level.range}</p>
              <p className="text-xs opacity-75 mt-1">{level.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Working Hours Mode */}
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h3 className="text-lg font-bold text-coffee-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          โหมดคำนวณ SLA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5">
            <h4 className="font-bold text-blue-900 mb-2">Calendar Mode</h4>
            <p className="text-sm text-blue-700 mb-3">นับเวลา 24 ชั่วโมงติดต่อกัน รวมวันหยุด</p>
            <div className="bg-white rounded-lg p-3 text-sm text-coffee-600">
              <p>ตัวอย่าง: SLA 24h</p>
              <p>แจ้ง: วันจันทร์ 10:00</p>
              <p>กำหนด: วันอังคาร 10:00</p>
            </div>
          </div>
          <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
            <h4 className="font-bold text-green-900 mb-2">Working Hours Mode</h4>
            <p className="text-sm text-green-700 mb-3">นับเฉพาะเวลาทำงาน ไม่รวมวันหยุด</p>
            <div className="bg-white rounded-lg p-3 text-sm text-coffee-600">
              <p>ตัวอย่าง: SLA 8h (ทำงาน 9:00-18:00)</p>
              <p>แจ้ง: วันจันทร์ 15:00</p>
              <p>กำหนด: วันอังคาร 14:00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pause Logic */}
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h3 className="text-lg font-bold text-coffee-900 mb-4 flex items-center gap-2">
          <Pause className="h-5 w-5 text-amber-600" />
          การหยุดพัก SLA
        </h3>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-coffee-700 mb-4">
            เมื่อช่างกด "หยุดพัก" ระบบจะหยุดนับเวลา SLA ชั่วคราว จนกว่าจะกด "ดำเนินการต่อ"
          </p>
          <div className="flex flex-wrap gap-2">
            {['รอของ', 'รอลูกค้า', 'พักเที่ยง', 'รออะไหล่', 'เหตุสุดวิสัย'].map((reason) => (
              <span key={reason} className="bg-white px-3 py-1.5 rounded-lg text-sm text-coffee-700 border border-amber-200">
                {reason}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Escalation Section
function EscalationSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h2 className="text-xl font-bold text-coffee-900 mb-6 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          การ Escalate งาน
        </h2>

        {/* Escalation Flow */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 mb-6">
          <h4 className="font-bold text-coffee-900 mb-4">เมื่อไหร่ควร Escalate?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { trigger: 'SLA เกิน 90%', desc: 'เวลาใกล้หมด ต้องการความช่วยเหลือ' },
              { trigger: 'ปัญหาซับซ้อน', desc: 'เกินความสามารถที่จะแก้ไขคนเดียว' },
              { trigger: 'ต้องการอนุมัติ', desc: 'ค่าใช้จ่ายเกินงบประมาณ' },
              { trigger: 'ปัญหาระบบ', desc: 'ต้องการ IT/Vendor เข้าช่วย' },
            ].map((item) => (
              <div key={item.trigger} className="flex items-start gap-3 bg-white p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-coffee-900">{item.trigger}</p>
                  <p className="text-sm text-coffee-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Escalation Levels */}
        <h3 className="text-lg font-bold text-coffee-900 mb-4">ระดับการ Escalate</h3>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 via-orange-400 to-red-500" />

          {[
            { level: 1, title: 'Level 1: ช่างอาวุโส', desc: 'ส่งต่อให้ช่างที่มีประสบการณ์มากกว่า', time: 'ภายใน 30 นาที', color: 'bg-amber-500' },
            { level: 2, title: 'Level 2: หัวหน้าช่าง', desc: 'ส่งต่อให้หัวหน้าทีมช่าง', time: 'ภายใน 1 ชั่วโมง', color: 'bg-orange-500' },
            { level: 3, title: 'Level 3: ผู้จัดการ', desc: 'ส่งต่อให้ผู้จัดการแผนก', time: 'ภายใน 2 ชั่วโมง', color: 'bg-red-500' },
            { level: 4, title: 'Level 4: ผู้บริหาร', desc: 'กรณีวิกฤต ต้องการการตัดสินใจระดับสูง', time: 'ทันที', color: 'bg-red-700' },
          ].map((level) => (
            <div key={level.level} className="relative flex gap-4 pb-8">
              <div className={`w-12 h-12 ${level.color} rounded-full flex items-center justify-center text-white font-bold z-10 shadow-lg`}>
                L{level.level}
              </div>
              <div className="flex-1 bg-cream-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-coffee-900">{level.title}</h4>
                  <span className="text-xs bg-white px-2 py-1 rounded-full text-coffee-600">{level.time}</span>
                </div>
                <p className="text-sm text-coffee-600">{level.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto Escalation */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-6 w-6" />
          <h3 className="text-lg font-bold">Auto-Escalation</h3>
        </div>
        <p className="text-red-100 mb-4">
          ระบบจะ Escalate อัตโนมัติเมื่อ SLA เกินกำหนด โดยไม่ต้องมีคนกดปุ่ม
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { at: '90%', action: 'แจ้งเตือนช่าง' },
            { at: '100%', action: 'แจ้งเตือนหัวหน้า' },
            { at: '120%', action: 'แจ้งเตือนผู้จัดการ' },
            { at: '150%', action: 'แจ้งเตือนผู้บริหาร' },
          ].map((item) => (
            <div key={item.at} className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <p className="font-bold text-lg">{item.at}</p>
              <p className="text-xs text-red-100">{item.action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Roles Section
function RolesSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6">
        <h2 className="text-xl font-bold text-coffee-900 mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          บทบาทผู้ใช้ในระบบ
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin */}
          <div className="border-2 border-purple-200 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8" />
                <div>
                  <h3 className="font-bold text-lg">Admin</h3>
                  <p className="text-purple-200 text-sm">ผู้ดูแลระบบ</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {[
                  'ดูและจัดการงานทั้งหมด',
                  'มอบหมายงานให้ช่าง',
                  'จัดการผู้ใช้/สาขา/อุปกรณ์',
                  'ดูรายงานและสถิติ',
                  'อนุมัติค่าใช้จ่าย',
                  'ตั้งค่าระบบ',
                ].map((perm, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-coffee-700">
                    <CheckCircle2 className="h-4 w-4 text-purple-500" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Manager */}
          <div className="border-2 border-indigo-200 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8" />
                <div>
                  <h3 className="font-bold text-lg">Manager</h3>
                  <p className="text-indigo-200 text-sm">ผู้จัดการ</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {[
                  'ดูงานของทีม',
                  'ติดตาม SLA และ performance',
                  'รับ Escalation',
                  'อนุมัติค่าใช้จ่าย',
                  'ดูรายงาน',
                ].map((perm, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-coffee-700">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Technician */}
          <div className="border-2 border-orange-200 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <Wrench className="h-8 w-8" />
                <div>
                  <h3 className="font-bold text-lg">Technician</h3>
                  <p className="text-orange-200 text-sm">ช่างเทคนิค</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {[
                  'ดูงานที่ได้รับมอบหมาย',
                  'เริ่ม/หยุดพัก/เสร็จงาน',
                  'แชทกับผู้แจ้ง',
                  'อัปเดตสถานะงาน',
                  'ขอ Escalate',
                ].map((perm, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-coffee-700">
                    <CheckCircle2 className="h-4 w-4 text-orange-500" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Branch */}
          <div className="border-2 border-blue-200 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                <div>
                  <h3 className="font-bold text-lg">Branch</h3>
                  <p className="text-blue-200 text-sm">พนักงานสาขา</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {[
                  'แจ้งซ่อมใหม่',
                  'ติดตามงานของสาขา',
                  'แชทกับช่าง',
                  'ให้ Feedback หลังซ่อมเสร็จ',
                ].map((perm, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-coffee-700">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 p-6 overflow-x-auto">
        <h3 className="text-lg font-bold text-coffee-900 mb-4">ตารางสิทธิ์</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-coffee-100">
              <th className="text-left py-3 px-2 text-coffee-600">ฟีเจอร์</th>
              <th className="text-center py-3 px-2 text-purple-600">Admin</th>
              <th className="text-center py-3 px-2 text-indigo-600">Manager</th>
              <th className="text-center py-3 px-2 text-orange-600">Tech</th>
              <th className="text-center py-3 px-2 text-blue-600">Branch</th>
            </tr>
          </thead>
          <tbody>
            {[
              { feature: 'แจ้งซ่อมใหม่', admin: true, manager: false, tech: false, branch: true },
              { feature: 'มอบหมายงาน', admin: true, manager: false, tech: false, branch: false },
              { feature: 'ดำเนินการซ่อม', admin: false, manager: false, tech: true, branch: false },
              { feature: 'ดูรายงาน', admin: true, manager: true, tech: false, branch: false },
              { feature: 'จัดการผู้ใช้', admin: true, manager: false, tech: false, branch: false },
              { feature: 'อนุมัติค่าใช้จ่าย', admin: true, manager: true, tech: false, branch: false },
              { feature: 'ให้ Feedback', admin: false, manager: false, tech: false, branch: true },
            ].map((row) => (
              <tr key={row.feature} className="border-b border-coffee-50 hover:bg-cream-50">
                <td className="py-3 px-2 text-coffee-900">{row.feature}</td>
                <td className="text-center py-3 px-2">
                  {row.admin ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <span className="text-coffee-300">-</span>}
                </td>
                <td className="text-center py-3 px-2">
                  {row.manager ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <span className="text-coffee-300">-</span>}
                </td>
                <td className="text-center py-3 px-2">
                  {row.tech ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <span className="text-coffee-300">-</span>}
                </td>
                <td className="text-center py-3 px-2">
                  {row.branch ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <span className="text-coffee-300">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
