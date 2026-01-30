import { SupabaseClient } from '@supabase/supabase-js'
import {
  VendorInvoice,
  VendorInvoiceItem,
  ExpenseRecord,
  ExpenseCategory,
  ApprovalStatus
} from '@/types/database.types'

export interface CreateInvoiceParams {
  supabase: SupabaseClient
  organizationId: string
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string
  vendorId: string
  requestId?: string
  branchId?: string
  items: CreateInvoiceItemParams[]
  vatPercent?: number
  notes?: string
  attachmentUrl?: string
  createdBy: string
}

export interface CreateInvoiceItemParams {
  description: string
  categoryId?: string
  quantity: number
  unit?: string
  unitPrice: number
  requestId?: string
}

export interface InvoiceResult {
  success: boolean
  data?: VendorInvoice
  error?: string
}

export interface ExpenseResult {
  success: boolean
  data?: ExpenseRecord
  error?: string
}

// Calculate invoice totals
export function calculateInvoiceTotals(
  items: CreateInvoiceItemParams[],
  vatPercent: number = 7
): { subtotal: number; vatAmount: number; totalAmount: number } {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const vatAmount = Math.round((subtotal * vatPercent / 100) * 100) / 100
  const totalAmount = subtotal + vatAmount

  return { subtotal, vatAmount, totalAmount }
}

// Create a vendor invoice
export async function createInvoice(
  params: CreateInvoiceParams
): Promise<InvoiceResult> {
  const {
    supabase,
    organizationId,
    invoiceNumber,
    invoiceDate,
    dueDate,
    vendorId,
    requestId,
    branchId,
    items,
    vatPercent = 7,
    notes,
    attachmentUrl,
    createdBy
  } = params

  try {
    // Calculate totals
    const { subtotal, vatAmount, totalAmount } = calculateInvoiceTotals(items, vatPercent)

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('vendor_invoices')
      .insert({
        organization_id: organizationId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        vendor_id: vendorId,
        request_id: requestId,
        branch_id: branchId,
        subtotal,
        vat_percent: vatPercent,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        status: 'draft',
        notes,
        attachment_url: attachmentUrl,
        created_by: createdBy
      })
      .select()
      .single()

    if (invoiceError) {
      return { success: false, error: invoiceError.message }
    }

    // Create invoice items
    const invoiceItems = items.map((item, index) => ({
      invoice_id: invoice.id,
      description: item.description,
      category_id: item.categoryId,
      quantity: item.quantity,
      unit: item.unit || 'ชิ้น',
      unit_price: item.unitPrice,
      amount: item.quantity * item.unitPrice,
      request_id: item.requestId,
      sort_order: index
    }))

    const { error: itemsError } = await supabase
      .from('vendor_invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      // Rollback: delete the invoice
      await supabase.from('vendor_invoices').delete().eq('id', invoice.id)
      return { success: false, error: itemsError.message }
    }

    // Fetch complete invoice with items
    const { data: completeInvoice } = await supabase
      .from('vendor_invoices')
      .select(`
        *,
        vendor:vendors(*),
        items:vendor_invoice_items(*)
      `)
      .eq('id', invoice.id)
      .single()

    return { success: true, data: completeInvoice }
  } catch (err) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการสร้างบิล' }
  }
}

// Update an invoice
export async function updateInvoice(
  supabase: SupabaseClient,
  invoiceId: string,
  updates: Partial<CreateInvoiceParams>,
  newItems?: CreateInvoiceItemParams[]
): Promise<InvoiceResult> {
  try {
    // Get current invoice
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('vendor_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (fetchError || !currentInvoice) {
      return { success: false, error: 'ไม่พบบิล' }
    }

    if (currentInvoice.status !== 'draft') {
      return { success: false, error: 'ไม่สามารถแก้ไขบิลที่ส่งขออนุมัติแล้วได้' }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    if (updates.invoiceNumber) updateData.invoice_number = updates.invoiceNumber
    if (updates.invoiceDate) updateData.invoice_date = updates.invoiceDate
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate
    if (updates.vendorId) updateData.vendor_id = updates.vendorId
    if (updates.requestId !== undefined) updateData.request_id = updates.requestId
    if (updates.branchId !== undefined) updateData.branch_id = updates.branchId
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.attachmentUrl !== undefined) updateData.attachment_url = updates.attachmentUrl
    if (updates.vatPercent !== undefined) updateData.vat_percent = updates.vatPercent

    // If new items, recalculate totals
    if (newItems) {
      const vatPercent = updates.vatPercent ?? currentInvoice.vat_percent
      const { subtotal, vatAmount, totalAmount } = calculateInvoiceTotals(newItems, vatPercent)
      updateData.subtotal = subtotal
      updateData.vat_amount = vatAmount
      updateData.total_amount = totalAmount

      // Delete old items and insert new ones
      await supabase
        .from('vendor_invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)

      const invoiceItems = newItems.map((item, index) => ({
        invoice_id: invoiceId,
        description: item.description,
        category_id: item.categoryId,
        quantity: item.quantity,
        unit: item.unit || 'ชิ้น',
        unit_price: item.unitPrice,
        amount: item.quantity * item.unitPrice,
        request_id: item.requestId,
        sort_order: index
      }))

      await supabase.from('vendor_invoice_items').insert(invoiceItems)
    }

    // Update invoice
    const { error: updateError } = await supabase
      .from('vendor_invoices')
      .update(updateData)
      .eq('id', invoiceId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Fetch updated invoice
    const { data: updatedInvoice } = await supabase
      .from('vendor_invoices')
      .select(`
        *,
        vendor:vendors(*),
        items:vendor_invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single()

    return { success: true, data: updatedInvoice }
  } catch (err) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัพเดทบิล' }
  }
}

// Delete an invoice
export async function deleteInvoice(
  supabase: SupabaseClient,
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: invoice, error: fetchError } = await supabase
    .from('vendor_invoices')
    .select('status')
    .eq('id', invoiceId)
    .single()

  if (fetchError || !invoice) {
    return { success: false, error: 'ไม่พบบิล' }
  }

  if (invoice.status !== 'draft') {
    return { success: false, error: 'ไม่สามารถลบบิลที่ส่งขออนุมัติแล้วได้' }
  }

  const { error } = await supabase
    .from('vendor_invoices')
    .delete()
    .eq('id', invoiceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Get expenses by request
export async function getExpensesByRequest(
  supabase: SupabaseClient,
  requestId: string
): Promise<ExpenseRecord[]> {
  const { data, error } = await supabase
    .from('expense_records')
    .select(`
      *,
      category:expense_categories(*),
      vendor:vendors(*)
    `)
    .eq('request_id', requestId)
    .order('expense_date', { ascending: false })

  if (error) {
    console.error('Error fetching expenses:', error)
    return []
  }

  return data || []
}

// Get invoices by request
export async function getInvoicesByRequest(
  supabase: SupabaseClient,
  requestId: string
): Promise<VendorInvoice[]> {
  const { data, error } = await supabase
    .from('vendor_invoices')
    .select(`
      *,
      vendor:vendors(*),
      items:vendor_invoice_items(*)
    `)
    .eq('request_id', requestId)
    .order('invoice_date', { ascending: false })

  if (error) {
    console.error('Error fetching invoices:', error)
    return []
  }

  return data || []
}

// Get expense categories
export async function getExpenseCategories(
  supabase: SupabaseClient,
  organizationId: string
): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

// Create direct expense record
export async function createExpenseRecord(
  supabase: SupabaseClient,
  params: {
    organizationId: string
    categoryId?: string
    requestId?: string
    branchId?: string
    vendorId?: string
    description: string
    amount: number
    expenseDate: string
    createdBy: string
  }
): Promise<ExpenseResult> {
  try {
    const { data, error } = await supabase
      .from('expense_records')
      .insert({
        organization_id: params.organizationId,
        category_id: params.categoryId,
        source_type: 'direct',
        request_id: params.requestId,
        branch_id: params.branchId,
        vendor_id: params.vendorId,
        description: params.description,
        amount: params.amount,
        expense_date: params.expenseDate,
        status: 'draft',
        created_by: params.createdBy
      })
      .select(`
        *,
        category:expense_categories(*),
        vendor:vendors(*)
      `)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการสร้างค่าใช้จ่าย' }
  }
}

// Get expense summary for dashboard
export async function getExpenseSummary(
  supabase: SupabaseClient,
  organizationId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  totalExpenses: number
  pendingApproval: number
  approved: number
  paid: number
  byCategory: Record<string, number>
}> {
  let query = supabase
    .from('vendor_invoices')
    .select('total_amount, status, items:vendor_invoice_items(category_id, amount)')
    .eq('organization_id', organizationId)

  if (startDate) query = query.gte('invoice_date', startDate)
  if (endDate) query = query.lte('invoice_date', endDate)

  const { data: invoices } = await query

  const summary = {
    totalExpenses: 0,
    pendingApproval: 0,
    approved: 0,
    paid: 0,
    byCategory: {} as Record<string, number>
  }

  if (!invoices) return summary

  for (const invoice of invoices) {
    summary.totalExpenses += invoice.total_amount || 0

    if (invoice.status === 'pending') {
      summary.pendingApproval += invoice.total_amount || 0
    } else if (invoice.status === 'approved') {
      summary.approved += invoice.total_amount || 0
    } else if (invoice.status === 'paid') {
      summary.paid += invoice.total_amount || 0
    }

    // Group by category
    for (const item of (invoice.items || [])) {
      const categoryId = item.category_id || 'uncategorized'
      summary.byCategory[categoryId] = (summary.byCategory[categoryId] || 0) + (item.amount || 0)
    }
  }

  return summary
}
