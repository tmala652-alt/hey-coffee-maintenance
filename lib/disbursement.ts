import { SupabaseClient } from '@supabase/supabase-js'
import {
  DisbursementRequest,
  DisbursementItem,
  DisbursementStatus,
  Database
} from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export interface CreateDisbursementParams {
  supabase: AnySupabaseClient
  organizationId: string
  payeeType: 'vendor' | 'employee'
  vendorId?: string
  employeeId?: string
  payeeName?: string
  bankAccountName?: string
  bankAccountNumber?: string
  bankName?: string
  items: {
    expenseId?: string
    invoiceId?: string
    description: string
    amount: number
  }[]
  notes?: string
  createdBy: string
}

export interface DisbursementResult {
  success: boolean
  data?: DisbursementRequest
  error?: string
}

// Generate document number
export async function generateDocumentNumber(
  supabase: AnySupabaseClient,
  organizationId: string
): Promise<string> {
  const today = new Date()
  const year = today.getFullYear().toString().slice(-2)
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const prefix = `DB${year}${month}`

  // Get the last document number for this prefix
  const { data } = await supabase
    .from('disbursement_requests')
    .select('document_number')
    .eq('organization_id', organizationId)
    .like('document_number', `${prefix}%`)
    .order('document_number', { ascending: false })
    .limit(1)
    .single()

  let sequence = 1
  if (data?.document_number) {
    const lastNum = parseInt(data.document_number.slice(-4))
    if (!isNaN(lastNum)) {
      sequence = lastNum + 1
    }
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`
}

// Create disbursement request
export async function createDisbursement(
  params: CreateDisbursementParams
): Promise<DisbursementResult> {
  const {
    supabase,
    organizationId,
    payeeType,
    vendorId,
    employeeId,
    payeeName,
    bankAccountName,
    bankAccountNumber,
    bankName,
    items,
    notes,
    createdBy
  } = params

  try {
    // Generate document number
    const documentNumber = await generateDocumentNumber(supabase, organizationId)

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    // Create disbursement request
    const { data: disbursement, error: disbursementError } = await supabase
      .from('disbursement_requests')
      .insert({
        organization_id: organizationId,
        document_number: documentNumber,
        document_date: new Date().toISOString().split('T')[0],
        payee_type: payeeType,
        vendor_id: vendorId,
        employee_id: employeeId,
        payee_name: payeeName,
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
        bank_name: bankName,
        total_amount: totalAmount,
        status: 'draft',
        approval_status: 'draft',
        notes,
        created_by: createdBy
      })
      .select()
      .single()

    if (disbursementError) {
      return { success: false, error: disbursementError.message }
    }

    // Create disbursement items
    const disbursementItems = items.map((item, index) => ({
      disbursement_id: disbursement.id,
      expense_id: item.expenseId,
      invoice_id: item.invoiceId,
      description: item.description,
      amount: item.amount,
      sort_order: index
    }))

    const { error: itemsError } = await supabase
      .from('disbursement_items')
      .insert(disbursementItems)

    if (itemsError) {
      // Rollback
      await supabase.from('disbursement_requests').delete().eq('id', disbursement.id)
      return { success: false, error: itemsError.message }
    }

    // Fetch complete disbursement
    const { data: completeDisbursement } = await supabase
      .from('disbursement_requests')
      .select(`
        *,
        vendor:vendors(*),
        employee:profiles!disbursement_requests_employee_id_fkey(*),
        items:disbursement_items(*)
      `)
      .eq('id', disbursement.id)
      .single()

    return { success: true, data: completeDisbursement }
  } catch (err) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการสร้างใบเบิก' }
  }
}

// Update disbursement status
export async function updateDisbursementStatus(
  supabase: AnySupabaseClient,
  disbursementId: string,
  status: DisbursementStatus,
  paidReference?: string
): Promise<DisbursementResult> {
  try {
    const updateData: Record<string, unknown> = { status }

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
      updateData.paid_reference = paidReference
    }

    const { data, error } = await supabase
      .from('disbursement_requests')
      .update(updateData)
      .eq('id', disbursementId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ' }
  }
}

// Submit disbursement to accounting
export async function submitDisbursement(
  supabase: AnySupabaseClient,
  disbursementId: string
): Promise<DisbursementResult> {
  try {
    const { data: disbursement, error: fetchError } = await supabase
      .from('disbursement_requests')
      .select('*')
      .eq('id', disbursementId)
      .single()

    if (fetchError || !disbursement) {
      return { success: false, error: 'ไม่พบใบเบิก' }
    }

    if (disbursement.status !== 'draft') {
      return { success: false, error: 'ใบเบิกนี้ถูกส่งแล้ว' }
    }

    if (disbursement.approval_status !== 'approved') {
      return { success: false, error: 'ใบเบิกนี้ยังไม่ได้รับการอนุมัติ' }
    }

    const { data, error } = await supabase
      .from('disbursement_requests')
      .update({ status: 'submitted' })
      .eq('id', disbursementId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการส่งใบเบิก' }
  }
}

// Get disbursements with filters
export async function getDisbursements(
  supabase: AnySupabaseClient,
  organizationId: string,
  filters?: {
    status?: DisbursementStatus
    startDate?: string
    endDate?: string
    vendorId?: string
  }
): Promise<DisbursementRequest[]> {
  let query = supabase
    .from('disbursement_requests')
    .select(`
      *,
      vendor:vendors(*),
      employee:profiles!disbursement_requests_employee_id_fkey(id, name),
      creator:profiles!disbursement_requests_created_by_fkey(id, name),
      items:disbursement_items(*)
    `)
    .eq('organization_id', organizationId)
    .order('document_date', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.startDate) {
    query = query.gte('document_date', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('document_date', filters.endDate)
  }
  if (filters?.vendorId) {
    query = query.eq('vendor_id', filters.vendorId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching disbursements:', error)
    return []
  }

  return data || []
}

// Get approved invoices available for disbursement
export async function getApprovedInvoicesForDisbursement(
  supabase: AnySupabaseClient,
  organizationId: string,
  vendorId?: string
): Promise<{ id: string; invoice_number: string; total_amount: number; vendor_id: string }[]> {
  let query = supabase
    .from('vendor_invoices')
    .select('id, invoice_number, total_amount, vendor_id')
    .eq('organization_id', organizationId)
    .eq('status', 'approved')

  if (vendorId) {
    query = query.eq('vendor_id', vendorId)
  }

  // Exclude invoices already in a disbursement
  const { data: existingItems } = await supabase
    .from('disbursement_items')
    .select('invoice_id')
    .not('invoice_id', 'is', null)

  const existingInvoiceIds = (existingItems || []).map(item => item.invoice_id)

  if (existingInvoiceIds.length > 0) {
    query = query.not('id', 'in', `(${existingInvoiceIds.join(',')})`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching approved invoices:', error)
    return []
  }

  return data || []
}

// Export disbursement to PDF data
export function generateDisbursementPDFData(
  disbursement: DisbursementRequest,
  organizationName: string
): {
  title: string
  documentNumber: string
  documentDate: string
  payeeName: string
  bankInfo: string
  items: { description: string; amount: string }[]
  totalAmount: string
  notes: string
} {
  const items = (disbursement.items || []).map(item => ({
    description: item.description,
    amount: `฿${item.amount.toLocaleString()}`
  }))

  const bankInfo = disbursement.bank_name
    ? `${disbursement.bank_name} - ${disbursement.bank_account_number} (${disbursement.bank_account_name})`
    : '-'

  return {
    title: `ใบขอเบิกเงิน - ${organizationName}`,
    documentNumber: disbursement.document_number,
    documentDate: new Date(disbursement.document_date).toLocaleDateString('th-TH'),
    payeeName: disbursement.payee_name ||
      (disbursement.vendor?.company_name) ||
      (disbursement.employee?.name) || '-',
    bankInfo,
    items,
    totalAmount: `฿${disbursement.total_amount.toLocaleString()}`,
    notes: disbursement.notes || '-'
  }
}

// Get disbursement summary
export async function getDisbursementSummary(
  supabase: AnySupabaseClient,
  organizationId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  totalAmount: number
  draftCount: number
  submittedCount: number
  processingCount: number
  paidCount: number
  paidAmount: number
}> {
  let query = supabase
    .from('disbursement_requests')
    .select('total_amount, status')
    .eq('organization_id', organizationId)

  if (startDate) query = query.gte('document_date', startDate)
  if (endDate) query = query.lte('document_date', endDate)

  const { data } = await query

  const summary = {
    totalAmount: 0,
    draftCount: 0,
    submittedCount: 0,
    processingCount: 0,
    paidCount: 0,
    paidAmount: 0
  }

  if (!data) return summary

  for (const d of data) {
    summary.totalAmount += d.total_amount || 0

    switch (d.status) {
      case 'draft':
        summary.draftCount++
        break
      case 'submitted':
        summary.submittedCount++
        break
      case 'processing':
        summary.processingCount++
        break
      case 'paid':
        summary.paidCount++
        summary.paidAmount += d.total_amount || 0
        break
    }
  }

  return summary
}
