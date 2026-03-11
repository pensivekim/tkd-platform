import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { z } from 'zod'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'
import { BELT_LIST, generateCertNumber } from '@/lib/constants'

const UpdateStudentSchema = z.object({
  name:           z.string().min(1).max(50).optional(),
  birth_date:     z.string().nullable().optional(),
  phone:          z.string().nullable().optional(),
  parent_phone:   z.string().nullable().optional(),
  belt:           z.enum(BELT_LIST).optional(),
  memo:           z.string().nullable().optional(),
  status:         z.enum(['active', 'inactive']).optional(),
  grade_type:     z.enum(['dan', 'poom', 'gup']).nullable().optional(),
  dan_grade:      z.number().int().min(1).max(9).nullable().optional(),
  kukkiwon_id:    z.string().max(50).nullable().optional(),
  cert_number:    z.string().max(30).nullable().optional(),
  cert_issued_at: z.string().nullable().optional(),
})

type Params = { params: Promise<{ id: string }> }

// GET /api/students/[id] — 원생 상세
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const student = await db
      .prepare('SELECT * FROM students WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()

    if (!student) return Response.json({ error: '원생을 찾을 수 없습니다.' }, { status: 404 })
    return Response.json({ student })
  } catch (error) {
    captureException(error, { route: 'GET /api/students/[id]' })
    return Response.json({ error: '원생 정보를 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/students/[id] — 원생 수정
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json()
    const parsed = UpdateStudentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const existing = await db
      .prepare('SELECT id FROM students WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()
    if (!existing) return Response.json({ error: '원생을 찾을 수 없습니다.' }, { status: 404 })

    const data = parsed.data
    const fields: string[] = []
    const values: unknown[] = []

    if (data.name !== undefined)         { fields.push('name = ?');         values.push(data.name) }
    if (data.birth_date !== undefined)   { fields.push('birth_date = ?');   values.push(data.birth_date) }
    if (data.phone !== undefined)        { fields.push('phone = ?');        values.push(data.phone) }
    if (data.parent_phone !== undefined) { fields.push('parent_phone = ?'); values.push(data.parent_phone) }
    if (data.belt !== undefined)         { fields.push('belt = ?');         values.push(data.belt) }
    if (data.memo !== undefined)         { fields.push('memo = ?');         values.push(data.memo) }
    if (data.status !== undefined)       { fields.push('status = ?');       values.push(data.status) }
    if (data.grade_type !== undefined)   { fields.push('grade_type = ?');   values.push(data.grade_type) }
    if (data.dan_grade !== undefined)    { fields.push('dan_grade = ?');    values.push(data.dan_grade) }
    if (data.kukkiwon_id !== undefined)  { fields.push('kukkiwon_id = ?');  values.push(data.kukkiwon_id) }
    if (data.cert_issued_at !== undefined){ fields.push('cert_issued_at = ?'); values.push(data.cert_issued_at) }
    // cert_number: 자동 생성 or 수동 입력
    if (data.cert_number !== undefined) {
      let certNum = data.cert_number
      if (data.grade_type && !certNum) {
        const countRow = await db.prepare('SELECT COUNT(*) as cnt FROM students WHERE dojang_id = ? AND cert_number IS NOT NULL').bind(payload.dojanId).first() as { cnt: number } | null
        certNum = generateCertNumber(payload.dojanId ?? 'UNKN', (countRow?.cnt ?? 0) + 1)
      }
      fields.push('cert_number = ?')
      values.push(certNum)
    }

    if (fields.length === 0) return Response.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id, payload.dojanId)

    await db
      .prepare(`UPDATE students SET ${fields.join(', ')} WHERE id = ? AND dojang_id = ?`)
      .bind(...values)
      .run()

    const student = await db.prepare('SELECT * FROM students WHERE id = ?').bind(id).first()
    return Response.json({ student })
  } catch (error) {
    captureException(error, { route: 'PATCH /api/students/[id]' })
    return Response.json({ error: '원생 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/students/[id] — soft delete (status → inactive)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const existing = await db
      .prepare('SELECT id FROM students WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()
    if (!existing) return Response.json({ error: '원생을 찾을 수 없습니다.' }, { status: 404 })

    await db
      .prepare("UPDATE students SET status = 'inactive', updated_at = ? WHERE id = ? AND dojang_id = ?")
      .bind(new Date().toISOString(), id, payload.dojanId)
      .run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'DELETE /api/students/[id]' })
    return Response.json({ error: '원생 삭제에 실패했습니다.' }, { status: 500 })
  }
}
