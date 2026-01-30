import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { startDate, endDate, format: exportFormat } = await request.json()

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch requests data
    let query = supabase
      .from('maintenance_requests')
      .select(`
        id,
        title,
        category,
        priority,
        status,
        sla_hours,
        created_at,
        due_at,
        branches(name, code),
        profiles!maintenance_requests_created_by_fkey(name),
        profiles!maintenance_requests_assigned_user_id_fkey(name),
        vendors(company_name),
        cost_logs(amount)
      `)
      .order('created_at', { ascending: false })

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate + 'T23:59:59')
    }

    const { data: requests, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process data
    const processedData = requests?.map((req: any) => {
      const totalCost = req.cost_logs?.reduce((sum: number, log: any) => sum + (log.amount || 0), 0) || 0
      return {
        id: req.id.slice(0, 8),
        title: req.title,
        branch: req.branches?.name || '-',
        branch_code: req.branches?.code || '-',
        category: req.category || '-',
        priority: req.priority,
        status: req.status,
        created_by: req.profiles?.name || '-',
        assigned_to: req.profiles?.name || req.vendors?.company_name || '-',
        total_cost: totalCost,
        sla_hours: req.sla_hours || '-',
        created_at: req.created_at ? new Date(req.created_at).toLocaleDateString('th-TH') : '-',
        due_at: req.due_at ? new Date(req.due_at).toLocaleDateString('th-TH') : '-',
      }
    }) || []

    // Generate CSV
    if (exportFormat === 'csv') {
      const headers = [
        'รหัส',
        'หัวข้อ',
        'สาขา',
        'รหัสสาขา',
        'ประเภท',
        'ความสำคัญ',
        'สถานะ',
        'ผู้แจ้ง',
        'ผู้รับผิดชอบ',
        'ค่าใช้จ่าย',
        'SLA (ชม.)',
        'วันที่สร้าง',
        'กำหนดเสร็จ',
      ]

      const statusNames: Record<string, string> = {
        pending: 'รอดำเนินการ',
        assigned: 'มอบหมายแล้ว',
        in_progress: 'กำลังดำเนินการ',
        completed: 'เสร็จสิ้น',
        cancelled: 'ยกเลิก',
      }

      const priorityNames: Record<string, string> = {
        low: 'ต่ำ',
        medium: 'ปานกลาง',
        high: 'สูง',
        critical: 'เร่งด่วน',
      }

      const rows = processedData.map((row) => [
        row.id,
        row.title,
        row.branch,
        row.branch_code,
        row.category,
        priorityNames[row.priority] || row.priority,
        statusNames[row.status] || row.status,
        row.created_by,
        row.assigned_to,
        row.total_cost.toLocaleString(),
        row.sla_hours,
        row.created_at,
        row.due_at,
      ])

      // Add BOM for Thai characters in Excel
      const BOM = '\uFEFF'
      const csvContent = BOM + [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=maintenance-report-${new Date().toISOString().split('T')[0]}.csv`,
        },
      })
    }

    // Return JSON for other formats
    return NextResponse.json({ data: processedData })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
