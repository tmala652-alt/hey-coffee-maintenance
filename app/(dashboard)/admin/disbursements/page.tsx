import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Wallet,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  Building2,
  Calendar,
  TrendingUp,
  ArrowRight,
  Search,
  Plus,
  Receipt,
  CreditCard,
  PiggyBank,
  BarChart3
} from 'lucide-react'
import DisbursementForm from './DisbursementForm'
import DisbursementPreview from './DisbursementPreview'

export default async function DisbursementsPage({
  searchParams
}: {
  searchParams: { status?: string; vendor?: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const organizationId = profile.organization_id

  // Fetch disbursements
  let query = supabase
    .from('disbursement_requests')
    .select(`
      *,
      vendor:vendors(id, company_name, address),
      employee:profiles!disbursement_requests_employee_id_fkey(id, name),
      creator:profiles!disbursement_requests_created_by_fkey(id, name),
      items:disbursement_items(*)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.vendor) {
    query = query.eq('vendor_id', searchParams.vendor)
  }

  const { data: disbursements } = await query

  // Fetch vendors for dropdown
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, company_name')
    .order('company_name')

  // Fetch invoices for disbursement (all invoices, not just approved)
  const { data: allInvoices } = await supabase
    .from('vendor_invoices')
    .select(`
      id,
      invoice_number,
      total_amount,
      vendor_id,
      vendor:vendors(id, company_name)
    `)
    .eq('organization_id', organizationId)
    .in('status', ['draft', 'pending', 'approved'])

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    submitted: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200'
  }

  const statusLabels: Record<string, string> = {
    draft: 'ร่าง',
    submitted: 'ส่งแล้ว',
    processing: 'กำลังดำเนินการ',
    paid: 'จ่ายแล้ว',
    cancelled: 'ยกเลิก'
  }

  // Stats
  const stats = {
    total: disbursements?.length || 0,
    draft: disbursements?.filter(d => d.status === 'draft').length || 0,
    processing: disbursements?.filter(d => ['submitted', 'processing'].includes(d.status)).length || 0,
    paid: disbursements?.filter(d => d.status === 'paid').length || 0,
    totalAmount: disbursements?.reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0,
    paidAmount: disbursements?.filter(d => d.status === 'paid').reduce((sum, d) => sum + (d.total_amount || 0), 0) || 0
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 lg:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">ใบเบิกเงิน</h1>
                <p className="text-blue-200 text-sm">จัดการใบขอเบิกเงินสำหรับฝ่ายบัญชี</p>
              </div>
            </div>
          </div>

          <DisbursementForm
            vendors={vendors || []}
            invoices={allInvoices || []}
            organizationId={organizationId || ''}
            userId={user.id}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-coffee-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-coffee-100 to-coffee-200">
              <FileText className="h-6 w-6 text-coffee-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{stats.total}</p>
              <p className="text-sm text-coffee-500 font-medium">ใบเบิกทั้งหมด</p>
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
              <p className="text-3xl font-bold text-amber-600">{stats.processing}</p>
              <p className="text-sm text-coffee-500 font-medium">รอดำเนินการ</p>
            </div>
          </div>
          {stats.processing > 0 && (
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
              <p className="text-3xl font-bold text-emerald-600">{stats.paid}</p>
              <p className="text-sm text-coffee-500 font-medium">จ่ายแล้ว</p>
            </div>
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200">
              <PiggyBank className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">฿{stats.paidAmount.toLocaleString()}</p>
              <p className="text-sm text-coffee-500 font-medium">ยอดจ่ายแล้ว</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-coffee-600">
            <Filter className="w-5 h-5" />
            <span className="font-medium">กรองข้อมูล</span>
          </div>
          <select
            name="status"
            defaultValue={searchParams.status}
            className="px-4 py-2.5 border-2 border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 bg-white transition-all"
          >
            <option value="">ทุกสถานะ</option>
            <option value="draft">ร่าง</option>
            <option value="submitted">ส่งแล้ว</option>
            <option value="processing">กำลังดำเนินการ</option>
            <option value="paid">จ่ายแล้ว</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
          <select
            name="vendor"
            defaultValue={searchParams.vendor}
            className="px-4 py-2.5 border-2 border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 bg-white transition-all"
          >
            <option value="">ทุกผู้รับเงิน</option>
            {vendors?.map((v: { id: string; company_name: string }) => (
              <option key={v.id} value={v.id}>{v.company_name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="btn-primary"
          >
            <Search className="w-4 h-4" />
            ค้นหา
          </button>
          {(searchParams.status || searchParams.vendor) && (
            <Link href="/admin/disbursements" className="btn-ghost text-sm">
              ล้างตัวกรอง
            </Link>
          )}
        </form>
      </div>

      {/* Disbursement List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-coffee-100 bg-gradient-to-r from-coffee-50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h2 className="font-bold text-coffee-900">รายการใบเบิก</h2>
                <p className="text-xs text-coffee-500">{disbursements?.length || 0} รายการ</p>
              </div>
            </div>
          </div>
        </div>

        {disbursements && disbursements.length > 0 ? (
          <div className="divide-y divide-coffee-100">
            {disbursements.map((disbursement: {
              id: string
              document_number: string
              document_date: string
              payee_type: string
              payee_name: string | null
              total_amount: number
              status: string
              approval_status: string
              paid_at: string | null
              notes: string | null
              bank_account_name: string | null
              bank_account_number: string | null
              bank_name: string | null
              vendor: { id: string; company_name: string; address?: string } | null
              employee: { id: string; name: string } | null
              creator: { id: string; name: string } | null
              items: { id: string; description: string; amount: number; sort_order: number }[]
            }, index: number) => (
              <div
                key={disbursement.id}
                className="p-5 hover:bg-gradient-to-r hover:from-coffee-50/50 hover:to-transparent transition-all duration-300 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/admin/disbursements/${disbursement.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-coffee-900 group-hover:text-blue-600 transition-colors">
                            {disbursement.document_number}
                          </span>
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColors[disbursement.status]}`}>
                            {statusLabels[disbursement.status]}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-coffee-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {disbursement.payee_name ||
                              disbursement.vendor?.company_name ||
                              disbursement.employee?.name ||
                              '-'}
                          </span>
                          <span className="text-coffee-300">•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(disbursement.document_date).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-coffee-300">•</span>
                          <span className="text-coffee-400">
                            {disbursement.items?.length || 0} รายการ
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-coffee-900">
                        ฿{disbursement.total_amount.toLocaleString()}
                      </p>
                      {disbursement.paid_at && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1 justify-end mt-1">
                          <CheckCircle className="w-3 h-3" />
                          จ่ายเมื่อ {new Date(disbursement.paid_at).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </div>
                    <DisbursementPreview
                      disbursement={disbursement}
                      organizationName={profile.organization?.name || 'Hey! Coffee Maintenance'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-coffee-900 mb-2">ยังไม่มีใบเบิก</h3>
            <p className="text-coffee-500 mb-6 max-w-sm mx-auto">เริ่มต้นด้วยการสร้างใบเบิกเงินใหม่เพื่อส่งให้ฝ่ายบัญชี</p>
            <DisbursementForm
              vendors={vendors || []}
              invoices={allInvoices || []}
              organizationId={organizationId || ''}
              userId={user.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}
