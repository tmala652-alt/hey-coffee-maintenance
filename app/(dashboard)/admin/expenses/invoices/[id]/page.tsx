import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  FileText,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Edit,
  Trash2,
  Receipt,
  AlertCircle
} from 'lucide-react'
import InvoiceActions from './InvoiceActions'

export default async function InvoiceDetailPage({
  params
}: {
  params: { id: string }
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

  // Fetch invoice with details
  const { data: invoice, error } = await supabase
    .from('vendor_invoices')
    .select(`
      *,
      vendor:vendors(*),
      request:maintenance_requests(id, title),
      branch:branches(id, name, code),
      creator:profiles!vendor_invoices_created_by_fkey(id, name),
      items:vendor_invoice_items(
        *,
        category:expense_categories(*)
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  // Fetch approval request if exists
  const { data: approvalRequest } = await supabase
    .from('approval_requests')
    .select(`
      *,
      requester:profiles!approval_requests_requested_by_fkey(id, name),
      logs:approval_logs(
        *,
        approver:profiles!approval_logs_approved_by_fkey(id, name)
      )
    `)
    .eq('record_type', 'invoice')
    .eq('record_id', params.id)
    .order('requested_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch expense categories for edit
  const { data: categories } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('sort_order')

  // Fetch vendors for edit
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, company_name')
    .order('company_name')

  // Fetch branches for edit
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, code')
    .eq('organization_id', profile.organization_id)
    .order('name')

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    paid: 'bg-blue-100 text-blue-700'
  }

  const statusLabels: Record<string, string> = {
    draft: 'ร่าง',
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ไม่อนุมัติ',
    paid: 'จ่ายแล้ว'
  }

  const statusIcons: Record<string, React.ReactNode> = {
    draft: <FileText className="w-4 h-4" />,
    pending: <Clock className="w-4 h-4" />,
    approved: <CheckCircle className="w-4 h-4" />,
    rejected: <XCircle className="w-4 h-4" />,
    paid: <Receipt className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/expenses/invoices"
            className="p-2 hover:bg-coffee-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-coffee-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-coffee-900">
                {invoice.invoice_number}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${statusColors[invoice.status]}`}>
                {statusIcons[invoice.status]}
                {statusLabels[invoice.status]}
              </span>
            </div>
            <p className="text-coffee-500 text-sm mt-1">
              สร้างโดย {invoice.creator?.name} เมื่อ{' '}
              {new Date(invoice.created_at).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <InvoiceActions
          invoice={invoice}
          vendors={vendors || []}
          categories={categories || []}
          branches={branches || []}
          organizationId={profile.organization_id || ''}
          userId={user.id}
          isAdmin={profile.role === 'admin'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="card">
            <div className="p-5 border-b border-coffee-100">
              <h2 className="font-semibold text-coffee-900">รายละเอียดบิล</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-coffee-500">ผู้ขาย</p>
                  <p className="font-medium text-coffee-900">
                    {invoice.vendor?.company_name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-coffee-500">วันที่บิล</p>
                  <p className="font-medium text-coffee-900">
                    {new Date(invoice.invoice_date).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-coffee-500">วันครบกำหนด</p>
                  <p className="font-medium text-coffee-900">
                    {invoice.due_date
                      ? new Date(invoice.due_date).toLocaleDateString('th-TH')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-coffee-500">สาขา</p>
                  <p className="font-medium text-coffee-900">
                    {invoice.branch ? `${invoice.branch.code} - ${invoice.branch.name}` : '-'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-coffee-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-coffee-500">รายการ</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-coffee-500">ประเภท</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-coffee-500">จำนวน</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-coffee-500">ราคา/หน่วย</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-coffee-500">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item: {
                      id: string
                      description: string
                      category: { name: string } | null
                      quantity: number
                      unit: string
                      unit_price: number
                      amount: number
                    }) => (
                      <tr key={item.id} className="border-b border-coffee-100">
                        <td className="py-3 px-4 text-coffee-900">{item.description}</td>
                        <td className="py-3 px-4 text-coffee-500">{item.category?.name || '-'}</td>
                        <td className="py-3 px-4 text-center text-coffee-900">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-coffee-900">
                          ฿{item.unit_price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-coffee-900">
                          ฿{item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-coffee-200">
                      <td colSpan={4} className="py-3 px-4 text-right text-coffee-500">
                        ยอดรวมก่อน VAT
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-coffee-900">
                        ฿{invoice.subtotal.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-2 px-4 text-right text-coffee-500">
                        VAT ({invoice.vat_percent}%)
                      </td>
                      <td className="py-2 px-4 text-right font-medium text-coffee-900">
                        ฿{invoice.vat_amount.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-coffee-50">
                      <td colSpan={4} className="py-3 px-4 text-right font-semibold text-coffee-900">
                        ยอดรวมทั้งสิ้น
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-lg text-coffee-900">
                        ฿{invoice.total_amount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="mt-4 p-4 bg-coffee-50 rounded-lg">
                  <p className="text-sm text-coffee-500 mb-1">หมายเหตุ:</p>
                  <p className="text-coffee-700">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card p-5">
            <h3 className="font-semibold text-coffee-900 mb-4">สถานะการอนุมัติ</h3>

            {approvalRequest ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-coffee-500">สถานะ</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[approvalRequest.status]}`}>
                    {statusLabels[approvalRequest.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-coffee-500">ระดับปัจจุบัน</span>
                  <span className="font-medium text-coffee-900">
                    {approvalRequest.current_level} / {approvalRequest.required_levels}
                  </span>
                </div>

                {/* Approval Timeline */}
                {approvalRequest.logs && approvalRequest.logs.length > 0 && (
                  <div className="pt-4 border-t border-coffee-100">
                    <p className="text-sm font-medium text-coffee-700 mb-3">ประวัติการอนุมัติ</p>
                    <div className="space-y-3">
                      {approvalRequest.logs.map((log: {
                        id: string
                        action: string
                        approved_at: string
                        approver: { name: string } | null
                        comments: string | null
                      }) => (
                        <div key={log.id} className="flex items-start gap-3">
                          <div className={`mt-0.5 p-1 rounded-full ${log.action === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {log.action === 'approved' ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-coffee-900">
                              {log.approver?.name || 'ไม่ระบุ'}
                            </p>
                            <p className="text-xs text-coffee-500">
                              {new Date(log.approved_at).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {log.comments && (
                              <p className="text-xs text-coffee-400 mt-1">{log.comments}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : invoice.status === 'draft' ? (
              <div className="text-center py-4">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-coffee-300" />
                <p className="text-coffee-500 text-sm">ยังไม่ได้ส่งขออนุมัติ</p>
                <p className="text-coffee-400 text-xs mt-1">
                  กดปุ่ม "ส่งขออนุมัติ" เพื่อเริ่มกระบวนการอนุมัติ
                </p>
              </div>
            ) : (
              <p className="text-coffee-500 text-sm">ไม่มีข้อมูลการอนุมัติ</p>
            )}
          </div>

          {/* Vendor Info */}
          {invoice.vendor && (
            <div className="card p-5">
              <h3 className="font-semibold text-coffee-900 mb-4">ข้อมูลผู้ขาย</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-coffee-100 rounded-lg">
                    <Building2 className="w-4 h-4 text-coffee-600" />
                  </div>
                  <div>
                    <p className="font-medium text-coffee-900">{invoice.vendor.company_name}</p>
                    {invoice.vendor.contact_name && (
                      <p className="text-sm text-coffee-500">{invoice.vendor.contact_name}</p>
                    )}
                  </div>
                </div>
                {invoice.vendor.phone && (
                  <p className="text-sm text-coffee-500">
                    โทร: {invoice.vendor.phone}
                  </p>
                )}
                {invoice.vendor.email && (
                  <p className="text-sm text-coffee-500">
                    อีเมล: {invoice.vendor.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Linked Request */}
          {invoice.request && (
            <div className="card p-5">
              <h3 className="font-semibold text-coffee-900 mb-4">งานซ่อมที่เกี่ยวข้อง</h3>
              <Link
                href={`/requests/${invoice.request.id}`}
                className="flex items-center gap-3 p-3 bg-coffee-50 rounded-lg hover:bg-coffee-100 transition-colors"
              >
                <FileText className="w-5 h-5 text-coffee-600" />
                <span className="text-coffee-900">{invoice.request.title}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
