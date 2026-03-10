import { NextRequest } from 'next/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'
import { BELT_LIST, generateCertNumber } from '@/lib/constants'

const CreateStudentSchema = z.object({
  name:           z.string().min(1, '이름을 입력해주세요.').max(50),
  birth_date:     z.string().nullable().optional(),
  phone:          z.string().nullable().optional(),
  parent_phone:   z.string().nullable().optional(),
  belt:           z.enum(BELT_LIST).default('흰띠'),
  memo:           z.string().nullable().optional(),
  grade_type:     z.enum(['dan', 'poom', 'gup']).nullable().optional(),
  dan_grade:      z.number().int().min(1).max(9).nullable().optional(),
  kukkiwon_id:    z.string().max(50).nullable().optional(),
  cert_number:    z.string().max(30).nullable().optional(),
  cert_issued_at: z.string().nullable().optional(),
})

// GET /api/students — 원생 목록
export async function GET(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'active'
    const belt = searchParams.get('belt')
    const search = searchParams.get('search')

    let query = 'SELECT * FROM students WHERE dojang_id = ? AND status = ?'
    const params: unknown[] = [payload.dojanId, status]

    if (belt) {
      query += ' AND belt = ?'
      params.push(belt)
    }
    if (search) {
      query += ' AND name LIKE ?'
      params.push(`%${search}%`)
    }

    query += ' ORDER BY created_at DESC'

    const { results } = await db.prepare(query).bind(...params).all()

    return Response.json({ students: results ?? [], total: (results ?? []).length })
  } catch (error) {
    captureException(error, { route: 'GET /api/students' })
    return Response.json({ error: '원생 목록을 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/students — 원생 등록
export async function POST(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json()
    const parsed = CreateStudentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { name, birth_date, phone, parent_phone, belt, memo, grade_type, dan_grade, kukkiwon_id, cert_issued_at } = parsed.data
    const id = nanoid()
    const now = new Date().toISOString()

    // 단증 번호 자동 생성 (grade_type 있고 cert_number 미입력 시)
    let certNum = parsed.data.cert_number ?? null
    if (grade_type && !certNum) {
      const countRow = await db.prepare('SELECT COUNT(*) as cnt FROM students WHERE dojang_id = ? AND cert_number IS NOT NULL').bind(payload.dojanId).first() as { cnt: number } | null
      certNum = generateCertNumber(payload.dojanId, (countRow?.cnt ?? 0) + 1)
    }

    await db
      .prepare(
        `INSERT INTO students (id, dojang_id, name, birth_date, phone, parent_phone, belt, status, memo, joined_at, created_at, updated_at,
           grade_type, dan_grade, kukkiwon_id, cert_number, cert_issued_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, payload.dojanId, name, birth_date ?? null, phone ?? null, parent_phone ?? null, belt, memo ?? null, now, now, now,
        grade_type ?? null, dan_grade ?? null, kukkiwon_id ?? null, certNum, cert_issued_at ?? null)
      .run()

    const student = await db.prepare('SELECT * FROM students WHERE id = ?').bind(id).first()
    return Response.json({ student }, { status: 201 })
  } catch (error) {
    captureException(error, { route: 'POST /api/students' })
    return Response.json({ error: '원생 등록에 실패했습니다.' }, { status: 500 })
  }
}
