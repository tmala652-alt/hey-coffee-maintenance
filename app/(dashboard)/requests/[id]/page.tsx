import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Building2, Clock, Banknote } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import RequestActions from './RequestActions'
import ChatSection from './ChatSection'
import ImageGallery from './ImageGallery'
import FeedbackPrompt from './FeedbackPrompt'
import AutoAssignSection from './AutoAssignSection'
import IncidentAlert from '@/components/incident/IncidentAlert'
import type { Profile, MaintenanceRequest, Attachment, StatusLog, Vendor } from '@/types/database.types'

type RequestWithRelations = MaintenanceRequest & {
  branch: { name: string; code: string; region: string } | null
  created_by_profile: { name: string; phone: string | null } | null
  assigned_user: { name: string; phone: string | null } | null
  assigned_vendor: Vendor | null
}

type StatusLogWithUser = StatusLog & {
  changed_by_profile: { name: string } | null
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

  const { data: request } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      branch:branches(*),
      created_by_profile:profiles!maintenance_requests_created_by_fkey(*),
      assigned_user:profiles!maintenance_requests_assigned_user_id_fkey(*),
      assigned_vendor:vendors(*)
    `)
    .eq('id', id)
    .single() as { data: RequestWithRelations | null }

  if (!request) notFound()

  const { data: attachments } = await supabase
    .from('attachments')
    .select('*')
    .eq('request_id', id)
    .order('created_at') as { data: Attachment[] | null }

  const { data: statusLogs } = await supabase
    .from('status_logs')
    .select('*, changed_by_profile:profiles!status_logs_changed_by_fkey(name)')
    .eq('request_id', id)
    .order('created_at', { ascending: false }) as { data: StatusLogWithUser[] | null }

  const { data: technicians } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'technician')
    .order('name') as { data: Profile[] | null }

  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .order('company_name') as { data: Vendor[] | null }

  const isAdmin = profile?.role === 'admin'
  const isTechnician = profile?.role === 'technician'
  const isAssigned = request.assigned_user_id === user.id
  const canEdit = isAdmin || isAssigned

  const branch = request.branch as { name: string; code: string; region: string } | null
  const createdBy = request.created_by_profile as { name: string; phone: string } | null
  const assignedUser = request.assigned_user as { name: string; phone: string } | null
  const assignedVendor = request.assigned_vendor as { company_name: string; contact_name: string; phone: string } | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Link href="/requests" className="btn-ghost btn-sm self-start">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-coffee-900">{request.title}</h1>
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
          </div>
          <p className="text-coffee-600">
            {branch?.name} • {request.category}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Alert - Check for repeat issues */}
          <IncidentAlert request={request} />

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-coffee-900 mb-4">รายละเอียด</h2>
            <p className="text-coffee-700 whitespace-pre-wrap">
              {request.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
            </p>
          </div>

          {/* Images & Videos */}
          {attachments && attachments.filter(a => a.type === 'image' || a.type === 'video').length > 0 && (
            <div className="card p-6" id="images">
              <h2 className="text-lg font-semibold text-coffee-900 mb-4">รูปภาพ / วิดีโอ</h2>
              <ImageGallery images={attachments.filter(a => a.type === 'image' || a.type === 'video')} />
            </div>
          )}

          {/* Chat */}
          <div className="card">
            <h2 className="text-lg font-semibold text-coffee-900 p-6 pb-0">แชท</h2>
            <ChatSection requestId={request.id} currentUserId={user.id} />
          </div>

          {/* Status History */}
          {statusLogs && statusLogs.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-coffee-900 mb-4">ประวัติสถานะ</h2>
              <div className="space-y-3">
                {statusLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 text-sm">
                    <StatusBadge status={log.status} />
                    <span className="text-coffee-600">
                      โดย {(log.changed_by_profile as { name: string } | null)?.name}
                    </span>
                    <span className="text-coffee-400">
                      {format(new Date(log.created_at!), 'd MMM yyyy HH:mm', { locale: th })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Prompt */}
          <FeedbackPrompt
            requestId={request.id}
            requestTitle={request.title}
            status={request.status}
            createdBy={request.created_by}
            currentUserId={user.id}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Auto Assign Panel - Show for admins when not assigned */}
          {isAdmin && !request.assigned_user_id && !request.assigned_vendor_id && request.status === 'pending' && (
            <AutoAssignSection request={request} />
          )}

          {/* Actions */}
          {canEdit && (
            <RequestActions
              request={request}
              technicians={technicians || []}
              vendors={vendors || []}
              isAdmin={isAdmin}
            />
          )}

          {/* Info Card */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-coffee-900">ข้อมูลงาน</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-coffee-400 mt-0.5" />
                <div>
                  <p className="text-sm text-coffee-500">สาขา</p>
                  <p className="font-medium text-coffee-900">{branch?.name}</p>
                  <p className="text-sm text-coffee-500">{branch?.region}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-coffee-400 mt-0.5" />
                <div>
                  <p className="text-sm text-coffee-500">แจ้งโดย</p>
                  <p className="font-medium text-coffee-900">{createdBy?.name}</p>
                  {createdBy?.phone && (
                    <p className="text-sm text-coffee-500">{createdBy.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-coffee-400 mt-0.5" />
                <div>
                  <p className="text-sm text-coffee-500">วันที่แจ้ง</p>
                  <p className="font-medium text-coffee-900">
                    {format(new Date(request.created_at!), 'd MMMM yyyy HH:mm น.', {
                      locale: th,
                    })}
                  </p>
                </div>
              </div>

              {request.due_at && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-coffee-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-coffee-500">กำหนดเสร็จ (SLA)</p>
                    <p className="font-medium text-coffee-900">
                      {format(new Date(request.due_at), 'd MMMM yyyy HH:mm น.', {
                        locale: th,
                      })}
                    </p>
                    <p className="text-sm text-coffee-500">{request.sla_hours} ชั่วโมง</p>
                  </div>
                </div>
              )}

              {(request.estimated_cost || request.actual_cost) && (
                <div className="flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-coffee-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-coffee-500">ค่าใช้จ่าย</p>
                    {request.estimated_cost && (
                      <p className="text-coffee-700">
                        ประมาณการ: ฿{Number(request.estimated_cost).toLocaleString()}
                      </p>
                    )}
                    {request.actual_cost && (
                      <p className="font-medium text-coffee-900">
                        จริง: ฿{Number(request.actual_cost).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Info */}
          {(assignedUser || assignedVendor) && (
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-coffee-900">ผู้รับผิดชอบ</h2>

              {assignedUser && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-matcha-500/20 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-matcha-600" />
                  </div>
                  <div>
                    <p className="font-medium text-coffee-900">{assignedUser.name}</p>
                    <p className="text-sm text-coffee-500">ช่างภายใน</p>
                    {assignedUser.phone && (
                      <p className="text-sm text-matcha-600">{assignedUser.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {assignedVendor && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-honey-500/20 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-honey-600" />
                  </div>
                  <div>
                    <p className="font-medium text-coffee-900">{assignedVendor.company_name}</p>
                    <p className="text-sm text-coffee-500">{assignedVendor.contact_name}</p>
                    {assignedVendor.phone && (
                      <p className="text-sm text-honey-600">{assignedVendor.phone}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
