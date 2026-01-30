import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  Building2,
  Calendar,
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard
} from 'lucide-react'
import InvoiceForm from './InvoiceForm'

export default async function InvoicesPage({
  searchParams
}: {
  searchParams: { status?: string; vendor?: string; search?: string }
}) {
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

  // Fetch invoices
  let query = supabase
    .from('vendor_invoices')
    .select(`
      *,
      vendor:vendors(id, company_name),
      request:maintenance_requests(id, title),
      branch:branches(id, name),
      creator:profiles!vendor_invoices_created_by_fkey(id, name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.vendor) {
    query = query.eq('vendor_id', searchParams.vendor)
  }
  if (searchParams.search) {
    query = query.ilike('invoice_number', `%${searchParams.search}%`)
  }

  const { data: invoices } = await query

  // Fetch vendors for dropdown
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, company_name')
    .order('company_name')

  // Fetch expense categories
  const { data: categories } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('sort_order')

  // Fetch branches
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, code')
    .eq('organization_id', organizationId)
    .order('name')

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

  // Stats
  const stats = {
    total: invoices?.length || 0,
    draft: invoices?.filter(i => i.status === 'draft').length || 0,
    pending: invoices?.filter(i => i.status === 'pending').length || 0,
    approved: invoices?.filter(i => i.status === 'approved').length || 0,
    totalAmount: invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-coffee-600 via-coffee-700 to-amber-800 rounded-3xl p-6 lg:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/expenses"
              className="p-2 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">บิลผู้ขาย</h1>
                <p className="text-coffee-200 text-sm">จัดการบิลและใบแจ้งหนี้จากผู้ขาย</p>
              </div>
            </div>
          </div>

          <InvoiceForm
            vendors={vendors || []}
            categories={categories || []}
            branches={branches || []}
            organizationId={organizationId || ''}
            userId={user.id}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-coffee-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-coffee-100 to-coffee-200">
              <FileText className="h-6 w-6 text-coffee-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-coffee-900">{stats.total}</p>
              <p className="text-sm text-coffee-500 font-medium">บิลทั้งหมด</p>
            </div>
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gray-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-gray-100 to-gray-200">
              <AlertCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-600">{stats.draft}</p>
              <p className="text-sm text-coffee-500 font-medium">ร่าง</p>
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
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-coffee-500 font-medium">รอดำเนินการ</p>
            </div>
          </div>
          {stats.pending > 0 && (
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
              <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
              <p className="text-sm text-coffee-500 font-medium">อนุมัติแล้ว</p>
            </div>
          </div>
        </div>

        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="icon-container bg-gradient-to-br from-blue-100 to-blue-200">
              <CreditCard className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">฿{stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-coffee-500 font-medium">ยอดรวม</p>
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
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="ค้นหาเลขที่บิล..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 bg-white transition-all"
              />
            </div>
          </div>
          <select
            name="status"
            defaultValue={searchParams.status}
            className="px-4 py-2.5 border-2 border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 bg-white transition-all"
          >
            <option value="">ทุกสถานะ</option>
            <option value="draft">ร่าง</option>
            <option value="pending">รออนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ไม่อนุมัติ</option>
            <option value="paid">จ่ายแล้ว</option>
          </select>
          <select
            name="vendor"
            defaultValue={searchParams.vendor}
            className="px-4 py-2.5 border-2 border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 bg-white transition-all"
          >
            <option value="">ทุกผู้ขาย</option>
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
          {(searchParams.status || searchParams.vendor || searchParams.search) && (
            <Link href="/admin/expenses/invoices" className="btn-ghost text-sm">
              ล้างตัวกรอง
            </Link>
          )}
        </form>
      </div>

      {/* Invoice List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-coffee-100 bg-gradient-to-r from-coffee-50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-coffee-100 to-coffee-200 rounded-xl flex items-center justify-center">
                <Receipt className="h-5 w-5 text-coffee-700" />
              </div>
              <div>
                <h2 className="font-bold text-coffee-900">รายการบิล</h2>
                <p className="text-xs text-coffee-500">{invoices?.length || 0} รายการ</p>
              </div>
            </div>
          </div>
        </div>

        {invoices && invoices.length > 0 ? (
          <div className="divide-y divide-coffee-100">
            {invoices.map((invoice: {
              id: string
              invoice_number: string
              invoice_date: string
              due_date: string | null
              total_amount: number
              status: string
              notes: string | null
              vendor: { id: string; company_name: string } | null
              request: { id: string; title: string } | null
              branch: { id: string; name: string } | null
              creator: { id: string; name: string } | null
              created_at: string
            }, index: number) => (
              <Link
                key={invoice.id}
                href={`/admin/expenses/invoices/${invoice.id}`}
                className="block p-5 hover:bg-gradient-to-r hover:from-coffee-50/50 hover:to-transparent transition-all duration-300 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-coffee-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-coffee-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-coffee-900 group-hover:text-coffee-700 transition-colors">
                          {invoice.invoice_number}
                        </span>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColors[invoice.status]}`}>
                          {statusLabels[invoice.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-coffee-500">
                        {invoice.vendor && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {invoice.vendor.company_name}
                          </span>
                        )}
                        <span className="text-coffee-300">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(invoice.invoice_date).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        {invoice.branch && (
                          <>
                            <span className="text-coffee-300">•</span>
                            <span className="text-coffee-400">
                              สาขา: {invoice.branch.name}
                            </span>
                          </>
                        )}
                      </div>
                      {invoice.notes && (
                        <p className="text-sm text-coffee-400 mt-2 line-clamp-1">
                          {invoice.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-coffee-900">
                      ฿{invoice.total_amount.toLocaleString()}
                    </p>
                    {invoice.due_date && (
                      <p className="text-xs text-coffee-400 mt-1 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        ครบกำหนด {new Date(invoice.due_date).toLocaleDateString('th-TH')}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-coffee-100 to-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-10 h-10 text-coffee-400" />
            </div>
            <h3 className="text-xl font-bold text-coffee-900 mb-2">ยังไม่มีบิล</h3>
            <p className="text-coffee-500 mb-6 max-w-sm mx-auto">เริ่มต้นด้วยการเพิ่มบิลใหม่</p>
            <InvoiceForm
              vendors={vendors || []}
              categories={categories || []}
              branches={branches || []}
              organizationId={organizationId || ''}
              userId={user.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}
