import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type AnalysisType =
  | 'request_summary'
  | 'root_cause'
  | 'solution_suggestion'
  | 'trend_analysis'
  | 'cost_prediction'
  | 'preventive_recommendation'

interface AnalysisRequest {
  request_id: string
  analysis_type: AnalysisType
  context: {
    title: string
    description: string | null
    category: string | null
    priority: string | null
    branch_id: string | null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: AnalysisRequest = await request.json()
    const { request_id, analysis_type, context } = body

    // Build prompt based on analysis type
    const prompt = buildPrompt(analysis_type, context)

    // For now, use a simple rule-based response
    // In production, this would call Claude API via Supabase Edge Function
    const analysis = generateAnalysis(analysis_type, context)

    // Store analysis result
    await supabase.from('ai_analyses').insert({
      request_id,
      analysis_type,
      input_data: { context, prompt },
      output_data: analysis,
      model_used: 'rule-based-v1', // Would be 'claude-3-haiku' in production
      confidence_score: analysis.confidence,
      created_by: user.id,
    } as never)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('AI analyze error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

function buildPrompt(type: AnalysisType, context: AnalysisRequest['context']): string {
  const baseContext = `
งานซ่อม: ${context.title}
รายละเอียด: ${context.description || 'ไม่ระบุ'}
หมวดหมู่: ${context.category || 'ไม่ระบุ'}
ความเร่งด่วน: ${context.priority || 'ไม่ระบุ'}
`.trim()

  const prompts: Record<AnalysisType, string> = {
    request_summary: `
สรุปงานซ่อมต่อไปนี้ให้กระชับ:
${baseContext}

กรุณาสรุป:
1. ปัญหาหลักคืออะไร
2. ความเร่งด่วน
3. สิ่งที่ต้องเตรียม
`,
    root_cause: `
วิเคราะห์สาเหตุของปัญหาต่อไปนี้:
${baseContext}

กรุณาวิเคราะห์:
1. สาเหตุที่เป็นไปได้
2. ปัจจัยที่อาจเกี่ยวข้อง
3. ความน่าจะเป็นของแต่ละสาเหตุ
`,
    solution_suggestion: `
แนะนำวิธีแก้ไขปัญหาต่อไปนี้:
${baseContext}

กรุณาแนะนำ:
1. ขั้นตอนการแก้ไข
2. อุปกรณ์ที่อาจต้องใช้
3. ข้อควรระวัง
`,
    trend_analysis: `
วิเคราะห์แนวโน้มจากข้อมูลที่ได้รับ
`,
    cost_prediction: `
คาดการณ์ค่าใช้จ่ายสำหรับงาน:
${baseContext}
`,
    preventive_recommendation: `
แนะนำการบำรุงรักษาเชิงป้องกันสำหรับ:
${baseContext}
`,
  }

  return prompts[type]
}

function generateAnalysis(
  type: AnalysisType,
  context: AnalysisRequest['context']
): { content: string; confidence: number; suggestions: string[] } {
  // Rule-based analysis responses
  // In production, this would be replaced with Claude API call

  const responses: Record<AnalysisType, () => { content: string; confidence: number; suggestions: string[] }> = {
    request_summary: () => ({
      content: `**สรุปงาน:** ${context.title}

**ปัญหาหลัก:** ${context.description?.slice(0, 100) || 'ตามหัวข้องาน'}
**หมวดหมู่:** ${context.category || 'ทั่วไป'}
**ความเร่งด่วน:** ${getPriorityLabel(context.priority)}

**สิ่งที่ควรเตรียม:**
- ตรวจสอบอุปกรณ์ที่เกี่ยวข้องกับ${context.category || 'งานนี้'}
- เตรียมเครื่องมือพื้นฐาน
- ติดต่อสาขาก่อนเข้าพื้นที่`,
      confidence: 0.85,
      suggestions: [
        'ตรวจสอบประวัติการซ่อมของอุปกรณ์',
        'เตรียมอะไหล่สำรอง',
        'ถ่ายรูปก่อนเริ่มงาน',
      ],
    }),

    root_cause: () => ({
      content: `**การวิเคราะห์สาเหตุ**

จากข้อมูลที่ได้รับ ปัญหา "${context.title}" อาจเกิดจากสาเหตุดังนี้:

${getCategoryRootCauses(context.category)}

**ปัจจัยที่อาจเกี่ยวข้อง:**
- อายุการใช้งานของอุปกรณ์
- ความถี่ในการใช้งาน
- สภาพแวดล้อม (ความชื้น, อุณหภูมิ)
- การบำรุงรักษาที่ผ่านมา`,
      confidence: 0.75,
      suggestions: [
        'ตรวจสอบประวัติการซ่อมที่ผ่านมา',
        'สอบถามผู้ใช้งานถึงอาการก่อนเสีย',
        'ตรวจสอบอุปกรณ์ที่เกี่ยวข้อง',
      ],
    }),

    solution_suggestion: () => ({
      content: `**แนะนำวิธีแก้ไข**

สำหรับปัญหา "${context.title}":

${getCategorySolutions(context.category)}

**ข้อควรระวัง:**
- ตรวจสอบความปลอดภัยก่อนเริ่มงาน
- บันทึกสถานะก่อนและหลังการแก้ไข
- ทดสอบการทำงานหลังซ่อมเสร็จ`,
      confidence: 0.8,
      suggestions: [
        'ดูคู่มือใน Knowledge Base',
        'ปรึกษาผู้เชี่ยวชาญหากไม่แน่ใจ',
        'เตรียมอะไหล่ทดแทนไว้',
      ],
    }),

    cost_prediction: () => ({
      content: `**คาดการณ์ค่าใช้จ่าย**

สำหรับงาน "${context.title}" (${context.category || 'ทั่วไป'}):

${getCostPrediction(context.category)}

*หมายเหตุ: ค่าใช้จ่ายจริงอาจแตกต่างตามสภาพจริง*`,
      confidence: 0.65,
      suggestions: [
        'ตรวจสอบราคาอะไหล่ล่าสุด',
        'สอบถามราคาจาก Vendor หลายราย',
        'พิจารณาการเปลี่ยนทดแทนหากซ่อมบ่อย',
      ],
    }),

    trend_analysis: () => ({
      content: `**วิเคราะห์แนวโน้ม**

จากข้อมูลที่มี สามารถสรุปแนวโน้มได้ดังนี้:
- ปัญหาที่พบบ่อยในหมวดหมู่นี้
- ช่วงเวลาที่มักเกิดปัญหา
- ความสัมพันธ์กับปัจจัยภายนอก`,
      confidence: 0.7,
      suggestions: ['ดูรายงานประจำเดือน', 'เปรียบเทียบกับช่วงเดียวกันของปีก่อน'],
    }),

    preventive_recommendation: () => ({
      content: `**คำแนะนำการบำรุงรักษาเชิงป้องกัน**

สำหรับ ${context.category || 'อุปกรณ์ทั่วไป'}:

${getPreventiveRecommendations(context.category)}

การบำรุงรักษาเชิงป้องกันจะช่วยลดความเสี่ยงและค่าใช้จ่ายในระยะยาว`,
      confidence: 0.8,
      suggestions: [
        'จัดตารางตรวจสอบประจำ',
        'อบรมผู้ใช้งานเรื่องการดูแลเบื้องต้น',
        'บันทึกประวัติการบำรุงรักษา',
      ],
    }),
  }

  return responses[type]()
}

function getPriorityLabel(priority: string | null): string {
  const labels: Record<string, string> = {
    low: 'ต่ำ - สามารถรอได้',
    medium: 'ปานกลาง - ควรดำเนินการภายในวัน',
    high: 'สูง - ควรดำเนินการโดยเร็ว',
    urgent: 'เร่งด่วน - ต้องดำเนินการทันที',
  }
  return labels[priority || 'medium'] || 'ปานกลาง'
}

function getCategoryRootCauses(category: string | null): string {
  const causes: Record<string, string> = {
    เครื่องชงกาแฟ: `
1. **หัวชง/Group Head** - อุดตันจากคราบกาแฟ (น่าจะเป็นได้สูง)
2. **ปั๊มน้ำ** - เสื่อมสภาพหรือขาดการบำรุง (ปานกลาง)
3. **วาล์วควบคุม** - รั่วหรือติดขัด (ปานกลาง)
4. **ระบบทำความร้อน** - Thermostat ผิดปกติ (ต่ำ)`,
    ระบบปรับอากาศ: `
1. **แผ่นกรองอากาศ** - อุดตันจากฝุ่น (น่าจะเป็นได้สูง)
2. **น้ำยาทำความเย็น** - รั่วหรือหมด (ปานกลาง)
3. **คอมเพรสเซอร์** - ทำงานผิดปกติ (ปานกลาง)
4. **แผงควบคุม** - บอร์ดเสียหาย (ต่ำ)`,
    ระบบไฟฟ้า: `
1. **สายไฟ/ขั้วต่อ** - หลวมหรือเสื่อมสภาพ (น่าจะเป็นได้สูง)
2. **ฟิวส์/เบรกเกอร์** - Trip จากกระแสเกิน (ปานกลาง)
3. **อุปกรณ์ไฟฟ้า** - ชำรุดภายใน (ปานกลาง)
4. **ระบบกราวด์** - มีปัญหา (ต่ำ)`,
  }
  return causes[category || ''] || `
1. การเสื่อมสภาพตามอายุการใช้งาน
2. ขาดการบำรุงรักษาที่เหมาะสม
3. การใช้งานเกินกำลัง
4. ปัจจัยภายนอก (สภาพแวดล้อม)`
}

function getCategorySolutions(category: string | null): string {
  const solutions: Record<string, string> = {
    เครื่องชงกาแฟ: `
**ขั้นตอนที่ 1:** ตรวจสอบการเชื่อมต่อไฟฟ้าและน้ำ
**ขั้นตอนที่ 2:** ล้าง Group Head และ Portafilter
**ขั้นตอนที่ 3:** ตรวจสอบแรงดันและอุณหภูมิ
**ขั้นตอนที่ 4:** Backflush ระบบ
**ขั้นตอนที่ 5:** ทดสอบการทำงาน

**อุปกรณ์ที่อาจต้องใช้:**
- น้ำยาล้างเครื่อง, แปรงทำความสะอาด, Gasket สำรอง`,
    ระบบปรับอากาศ: `
**ขั้นตอนที่ 1:** ตรวจสอบและทำความสะอาดแผ่นกรอง
**ขั้นตอนที่ 2:** วัดอุณหภูมิ inlet/outlet
**ขั้นตอนที่ 3:** ตรวจสอบระดับน้ำยาทำความเย็น
**ขั้นตอนที่ 4:** ทำความสะอาด Coil
**ขั้นตอนที่ 5:** ตรวจสอบระบบไฟฟ้า

**อุปกรณ์ที่อาจต้องใช้:**
- เกจวัดน้ำยา, เทอร์โมมิเตอร์, แผ่นกรองสำรอง`,
    ระบบไฟฟ้า: `
**ขั้นตอนที่ 1:** ตัดไฟก่อนเริ่มงาน
**ขั้นตอนที่ 2:** ตรวจสอบจุดเชื่อมต่อทั้งหมด
**ขั้นตอนที่ 3:** วัดค่าไฟฟ้าด้วยมัลติมิเตอร์
**ขั้นตอนที่ 4:** ซ่อม/เปลี่ยนส่วนที่เสียหาย
**ขั้นตอนที่ 5:** ทดสอบระบบก่อนเปิดใช้งาน

**อุปกรณ์ที่อาจต้องใช้:**
- มัลติมิเตอร์, คีมย้ำหางปลา, เทปพันสาย, สายไฟสำรอง`,
  }
  return solutions[category || ''] || `
**ขั้นตอนที่ 1:** ตรวจสอบสภาพอุปกรณ์
**ขั้นตอนที่ 2:** ระบุจุดที่มีปัญหา
**ขั้นตอนที่ 3:** ซ่อมหรือเปลี่ยนทดแทน
**ขั้นตอนที่ 4:** ทดสอบการทำงาน

**อุปกรณ์ที่อาจต้องใช้:**
- เครื่องมือช่างพื้นฐาน, อะไหล่ตามประเภทงาน`
}

function getCostPrediction(category: string | null): string {
  const costs: Record<string, string> = {
    เครื่องชงกาแฟ: `
**ค่าแรง:** ฿500 - ฿1,500
**ค่าอะไหล่ (ถ้ามี):**
- Gasket/Seal: ฿200 - ฿800
- Group Head Parts: ฿500 - ฿3,000
- ปั๊มน้ำ: ฿2,000 - ฿5,000

**รวมประมาณการ:** ฿700 - ฿10,000`,
    ระบบปรับอากาศ: `
**ค่าแรง:** ฿500 - ฿2,000
**ค่าอะไหล่/วัสดุ (ถ้ามี):**
- แผ่นกรอง: ฿200 - ฿500
- น้ำยาทำความเย็น: ฿800 - ฿2,500/kg
- คอมเพรสเซอร์: ฿5,000 - ฿15,000

**รวมประมาณการ:** ฿1,000 - ฿20,000`,
    ระบบไฟฟ้า: `
**ค่าแรง:** ฿300 - ฿1,500
**ค่าอะไหล่ (ถ้ามี):**
- สายไฟ/ขั้วต่อ: ฿100 - ฿500
- เบรกเกอร์: ฿200 - ฿1,000
- อุปกรณ์ไฟฟ้า: ตามชนิด

**รวมประมาณการ:** ฿500 - ฿5,000`,
  }
  return costs[category || ''] || `
**ค่าแรง:** ฿300 - ฿1,500
**ค่าอะไหล่:** ขึ้นอยู่กับประเภทงาน

**รวมประมาณการ:** ฿500 - ฿5,000`
}

function getPreventiveRecommendations(category: string | null): string {
  const recs: Record<string, string> = {
    เครื่องชงกาแฟ: `
**รายวัน:**
- ล้าง Group Head หลังใช้งาน
- เช็ดทำความสะอาดภายนอก

**รายสัปดาห์:**
- Backflush ด้วยน้ำยาทำความสะอาด
- ตรวจสอบแรงดัน

**รายเดือน:**
- เปลี่ยนน้ำในถัง
- ตรวจสอบ Gasket และ Seal

**ราย 3 เดือน:**
- ล้างระบบท่อน้ำ
- ตรวจสอบคุณภาพน้ำ`,
    ระบบปรับอากาศ: `
**รายเดือน:**
- ทำความสะอาด/เปลี่ยนแผ่นกรอง
- ตรวจสอบอุณหภูมิการทำงาน

**ราย 3 เดือน:**
- ล้าง Coil และพัดลม
- ตรวจสอบระบบระบายน้ำ

**ราย 6 เดือน:**
- ตรวจสอบน้ำยาทำความเย็น
- ตรวจสอบระบบไฟฟ้า`,
  }
  return recs[category || ''] || `
**รายสัปดาห์:**
- ตรวจสอบสภาพการทำงานทั่วไป
- ทำความสะอาดภายนอก

**รายเดือน:**
- ตรวจสอบจุดเชื่อมต่อ
- ทำความสะอาดอย่างละเอียด

**ราย 3 เดือน:**
- ตรวจสอบส่วนประกอบหลัก
- บำรุงรักษาตามคู่มือ`
}
