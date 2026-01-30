import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Receipt,
  FileText,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Plus,
  Building2,
  Calendar,
  PieChart,
  BarChart3
} from 'lucide-react'
import { getExpenseSummary } from '@/lib/expense'
import { getDisbursementSummary } from '@/lib/disbursement'

export default async function ExpensesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'manager'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const organizationId = profile.organization_id

  // Get current month date range
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  // Get summaries
  const expenseSummary = organizationId
    ? await getExpenseSummary(supabase, organizationId, startOfMonth, endOfMonth)
    : { totalExpenses: 0, pendingApproval: 0, approved: 0, paid: 0, byCategory: {} }

  const disbursementSummary = organizationId
    ? await getDisbursementSummary(supabase, organizationId, startOfMonth, endOfMonth)
    : { totalAmount: 0, draftCount: 0, submittedCount: 0, processingCount: 0, paidCount: 0, paidAmount: 0 }

  // Get recent invoices
  const { data: recentInvoices } = await supabase
    .from('vendor_invoices')
    .select(`
      id,
      invoice_number,
      invoice_date,
      total_amount,
      status,
      vendor:vendors(company_name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get expense categories with amounts
  const { data: categories } = await supabase
    .from('expense_categories')
    .select('id, name, code')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('sort_order')

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    paid: 'bg-blue-50 text-blue-700 border-blue-200'
  }

  const statusLabels: Record<string, string> = {
    draft: 'ร่าง',
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ไม่อนุมัติ',
    paid: 'จ่ายแล้ว'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 lg:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">ค่าใช้จ่าย</h1>
                <p className="text-emerald-200 text-sm">
                  สรุปประจำเดือน {now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/expenses/invoices"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all border border-white/20"
          >
            <Plus className="w-4 h-4" />
            เพิ่มบิลใหม่
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-coffee-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-coffee-100 to-coffee-200">
              <Receipt className="h-6 w-6 text-coffee-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-900">
                ฿{expenseSummary.totalExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-coffee-500 font-medium">ค่าใช้จ่ายทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-amber-100 to-amber-200">
              <Clock className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                ฿{expenseSummary.pendingApproval.toLocaleString()}
              </p>
              <p className="text-sm text-coffee-500 font-medium">รอดำเนินการ</p>
            </div>
          </div>
          {expenseSummary.pendingApproval > 0 && (
            <div className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          )}
        </div>

        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-emerald-100 to-emerald-200">
              <CheckCircle className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                ฿{expenseSummary.approved.toLocaleString()}
              </p>
              <p className="text-sm text-coffee-500 font-medium">อนุมัติแล้ว</p>
            </div>
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200">
              <Wallet className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                ฿{disbursementSummary.paidAmount.toLocaleString()}
              </p>
              <p className="text-sm text-coffee-500 font-medium">จ่ายแล้ว</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/expenses/invoices"
          className="card p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border-2 border-transparent hover:border-coffee-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-coffee-600" />
              </div>
              <div>
                <p className="font-bold text-lg text-coffee-900 group-hover:text-coffee-700 transition-colors">บิลผู้ขาย</p>
                <p className="text-sm text-coffee-500">จัดการบิลและใบแจ้งหนี้</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-coffee-300 group-hover:text-coffee-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          href="/admin/disbursements"
          className="card p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border-2 border-transparent hover:border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-lg text-coffee-900 group-hover:text-blue-700 transition-colors">ใบเบิกเงิน</p>
                <p className="text-sm text-coffee-500">จัดการใบขอเบิกเงิน</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-coffee-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-coffee-100 bg-gradient-to-r from-coffee-50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-xl flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-coffee-700" />
                </div>
                <div>
                  <h2 className="font-bold text-coffee-900">บิลล่าสุด</h2>
                  <p className="text-xs text-coffee-500">{recentInvoices?.length || 0} รายการ</p>
                </div>
              </div>
              <Link
                href="/admin/expenses/invoices"
                className="text-sm text-coffee-500 hover:text-coffee-700 font-medium flex items-center gap-1 group"
              >
                ดูทั้งหมด
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-coffee-100">
            {recentInvoices && recentInvoices.length > 0 ? (
              recentInvoices.map((invoice: {
                id: string
                invoice_number: string
                invoice_date: string
                total_amount: number
                status: string
                vendor: { company_name: string } | null
              }, index: number) => (
                <Link
                  key={invoice.id}
                  href={`/admin/expenses/invoices/${invoice.id}`}
                  className="p-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-coffee-50/50 hover:to-transparent transition-all duration-300 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-coffee-900 group-hover:text-coffee-700 transition-colors">{invoice.invoice_number}</p>
                      <div className="flex items-center gap-2 text-sm text-coffee-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {invoice.vendor?.company_name || '-'}
                        </span>
                        <span className="text-coffee-300">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(invoice.invoice_date).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-coffee-900">
                      ฿{invoice.total_amount.toLocaleString()}
                    </p>
                    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColors[invoice.status]}`}>
                      {statusLabels[invoice.status]}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-coffee-400" />
                </div>
                <p className="text-coffee-500 mb-4">ยังไม่มีบิล</p>
                <Link
                  href="/admin/expenses/invoices"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มบิลใหม่
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-coffee-100 bg-gradient-to-r from-emerald-50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
                <PieChart className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="font-bold text-coffee-900">ค่าใช้จ่ายตามประเภท</h2>
                <p className="text-xs text-coffee-500">เดือนปัจจุบัน</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            {categories && categories.length > 0 ? (
              <div className="space-y-5">
                {categories.map((category: { id: string; name: string; code: string }, index: number) => {
                  const amount = expenseSummary.byCategory[category.id] || 0
                  const percentage = expenseSummary.totalExpenses > 0
                    ? (amount / expenseSummary.totalExpenses) * 100
                    : 0

                  const colors = [
                    'from-blue-400 to-blue-600',
                    'from-emerald-400 to-emerald-600',
                    'from-amber-400 to-amber-600',
                    'from-purple-400 to-purple-600',
                    'from-rose-400 to-rose-600',
                    'from-cyan-400 to-cyan-600'
                  ]

                  return (
                    <div key={category.id} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[index % colors.length]}`} />
                          <span className="text-sm font-medium text-coffee-700">{category.name}</span>
                        </div>
                        <span className="text-sm font-bold text-coffee-900">
                          ฿{amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-3 bg-coffee-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-full transition-all duration-700 group-hover:opacity-80`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-coffee-500">ยังไม่มีข้อมูลค่าใช้จ่าย</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disbursement Summary */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-coffee-100 bg-gradient-to-r from-blue-50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h2 className="font-bold text-coffee-900">สถานะใบเบิกเงิน</h2>
              <p className="text-xs text-coffee-500">สรุปสถานะทั้งหมด</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 group hover:shadow-md transition-all">
              <p className="text-3xl font-bold text-gray-600 group-hover:scale-110 transition-transform">{disbursementSummary.draftCount}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">ร่าง</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200 group hover:shadow-md transition-all">
              <p className="text-3xl font-bold text-amber-600 group-hover:scale-110 transition-transform">{disbursementSummary.submittedCount}</p>
              <p className="text-sm text-amber-600 font-medium mt-1">ส่งแล้ว</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 group hover:shadow-md transition-all">
              <p className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform">{disbursementSummary.processingCount}</p>
              <p className="text-sm text-blue-600 font-medium mt-1">กำลังดำเนินการ</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 group hover:shadow-md transition-all">
              <p className="text-3xl font-bold text-emerald-600 group-hover:scale-110 transition-transform">{disbursementSummary.paidCount}</p>
              <p className="text-sm text-emerald-600 font-medium mt-1">จ่ายแล้ว</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-coffee-50 to-coffee-100 rounded-2xl border border-coffee-200 group hover:shadow-md transition-all">
              <p className="text-2xl font-bold text-coffee-700 group-hover:scale-110 transition-transform">
                ฿{disbursementSummary.totalAmount.toLocaleString()}
              </p>
              <p className="text-sm text-coffee-600 font-medium mt-1">ยอดรวม</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
