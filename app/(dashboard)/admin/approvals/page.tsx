import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardCheck,
  FileText,
  Receipt,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  ChevronRight
} from 'lucide-react'
import ApprovalCard from './ApprovalCard'

export default async function ApprovalsPage() {
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

  // Fetch pending approvals
  const { data: pendingApprovals } = await supabase
    .from('approval_requests')
    .select(`
      *,
      requester:profiles!approval_requests_requested_by_fkey(id, name),
      logs:approval_logs(
        *,
        approver:profiles!approval_logs_approved_by_fkey(id, name)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  // Fetch recent completed approvals
  const { data: recentApprovals } = await supabase
    .from('approval_requests')
    .select(`
      *,
      requester:profiles!approval_requests_requested_by_fkey(id, name),
      logs:approval_logs(
        *,
        approver:profiles!approval_logs_approved_by_fkey(id, name)
      )
    `)
    .eq('organization_id', organizationId)
    .in('status', ['approved', 'rejected'])
    .order('completed_at', { ascending: false })
    .limit(10)

  // Get user's thresholds to check which approvals they can approve
  const { data: userThresholds } = await supabase
    .from('approval_thresholds')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .or(`approver_role.eq.${profile.role},approver_id.eq.${user.id}`)

  // Filter approvals user can actually approve
  const canApprove = (approval: { current_level: number; amount: number }) => {
    return userThresholds?.some(t =>
      t.approval_level === approval.current_level &&
      t.min_amount <= approval.amount &&
      (t.max_amount === null || approval.amount <= t.max_amount)
    )
  }

  const approvableItems = pendingApprovals?.filter(canApprove) || []
  const otherPendingItems = pendingApprovals?.filter(a => !canApprove(a)) || []

  const typeLabels: Record<string, string> = {
    invoice: 'บิลผู้ขาย',
    expense: 'ค่าใช้จ่าย',
    disbursement: 'ใบเบิกเงิน'
  }

  const typeIcons: Record<string, React.ReactNode> = {
    invoice: <FileText className="w-5 h-5" />,
    expense: <Receipt className="w-5 h-5" />,
    disbursement: <Wallet className="w-5 h-5" />
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  }

  const statusLabels: Record<string, string> = {
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ไม่อนุมัติ'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-coffee-900">รออนุมัติ</h1>
        <p className="text-coffee-500 text-sm mt-1">
          จัดการรายการที่รอการอนุมัติ
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-coffee-500">รอคุณอนุมัติ</p>
              <p className="text-2xl font-bold text-amber-600">{approvableItems.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-coffee-100 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-coffee-600" />
            </div>
            <div>
              <p className="text-sm text-coffee-500">รอผู้อื่นอนุมัติ</p>
              <p className="text-2xl font-bold text-coffee-600">{otherPendingItems.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-coffee-500">ดำเนินการแล้ว</p>
              <p className="text-2xl font-bold text-green-600">{recentApprovals?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approvals for current user */}
      {approvableItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-coffee-900 mb-4">
            รอคุณอนุมัติ ({approvableItems.length})
          </h2>
          <div className="grid gap-4">
            {approvableItems.map((approval: {
              id: string
              record_type: string
              record_id: string
              amount: number
              status: string
              current_level: number
              required_levels: number
              requested_at: string
              requester: { id: string; name: string } | null
            }) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                userId={user.id}
                typeLabels={typeLabels}
                typeIcons={typeIcons}
                canApprove={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other pending approvals */}
      {otherPendingItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-coffee-900 mb-4">
            รอผู้อื่นอนุมัติ ({otherPendingItems.length})
          </h2>
          <div className="grid gap-4">
            {otherPendingItems.map((approval: {
              id: string
              record_type: string
              record_id: string
              amount: number
              status: string
              current_level: number
              required_levels: number
              requested_at: string
              requester: { id: string; name: string } | null
            }) => (
              <div
                key={approval.id}
                className="card p-5 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-coffee-100 rounded-xl">
                      {typeIcons[approval.record_type]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-coffee-900">
                          {typeLabels[approval.record_type]}
                        </span>
                        <span className="text-sm text-coffee-400">
                          ระดับ {approval.current_level}/{approval.required_levels}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-coffee-500 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {approval.requester?.name || '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(approval.requested_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-coffee-900">
                      ฿{approval.amount.toLocaleString()}
                    </p>
                    <span className="text-sm text-coffee-400">รอระดับถัดไป</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {approvableItems.length === 0 && otherPendingItems.length === 0 && (
        <div className="card p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
          <h3 className="text-lg font-semibold text-coffee-900 mb-2">
            ไม่มีรายการรออนุมัติ
          </h3>
          <p className="text-coffee-500">
            ทุกรายการได้รับการดำเนินการเรียบร้อยแล้ว
          </p>
        </div>
      )}

      {/* Recent completed */}
      {recentApprovals && recentApprovals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-coffee-900 mb-4">
            ดำเนินการล่าสุด
          </h2>
          <div className="card divide-y divide-coffee-100">
            {recentApprovals.map((approval: {
              id: string
              record_type: string
              amount: number
              status: string
              completed_at: string | null
              requester: { name: string } | null
              logs: { approver: { name: string } | null }[]
            }) => (
              <div key={approval.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${approval.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {approval.status === 'approved' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-coffee-900">
                      {typeLabels[approval.record_type]}
                    </p>
                    <p className="text-sm text-coffee-500">
                      โดย {approval.logs?.[0]?.approver?.name || '-'} •{' '}
                      {approval.completed_at
                        ? new Date(approval.completed_at).toLocaleDateString('th-TH')
                        : '-'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-coffee-900">
                    ฿{approval.amount.toLocaleString()}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[approval.status]}`}>
                    {statusLabels[approval.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
