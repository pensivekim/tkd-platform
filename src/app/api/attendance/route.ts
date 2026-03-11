import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'
import { ATTENDANCE_TYPES } from '@/lib/constants'

const today = () => new Date().toISOString().slice(0, 10)

const CheckSchema = z.object({
  student_id: z.string().min(1, 'student_id가 필요합니다.'),
  type: z.enum(ATTENDANCE_TYPES),
  memo: z.string().nullable().optional(),
})

// GET /api/attendance?date=YYYY-MM-DD&student_id?
export async function GET(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || today()
    const studentId = searchParams.get('student_id')

    let query = `
      SELECT a.*, s.name AS student_name, s.belt AS student_belt
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.dojang_id = ?
        AND date(a.checked_at) = ?
    `
    const params: unknown[] = [payload.dojanId, date]

    if (studentId) {
      query += ' AND a.student_id = ?'
      params.push(studentId)
    }

    query += ' ORDER BY s.name ASC'

    const { results } = await db.prepare(query).bind(...params).all()

    return Response.json({ attendance: results ?? [], date })
  } catch (error) {
    captureException(error, { route: 'GET /api/attendance' })
    return Response.json({ error: '출석 목록을 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/attendance — 출석 체크 (upsert)
export async function POST(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json()
    const parsed = CheckSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { student_id, type, memo } = parsed.data
    const dateStr = today()
    const now = new Date().toISOString()

    // 같은 날 기존 기록 조회 (upsert)
    const existing = await db
      .prepare(
        "SELECT id FROM attendance WHERE dojang_id = ? AND student_id = ? AND date(checked_at) = ?",
      )
      .bind(payload.dojanId, student_id, dateStr)
      .first() as { id: string } | null

    let id: string

    if (existing) {
      // 업데이트
      id = existing.id
      await db
        .prepare('UPDATE attendance SET type = ?, memo = ?, checked_at = ? WHERE id = ?')
        .bind(type, memo ?? null, now, id)
        .run()
    } else {
      // 신규 삽입
      id = nanoid()
      await db
        .prepare(
          'INSERT INTO attendance (id, dojang_id, student_id, checked_at, type, memo) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind(id, payload.dojanId, student_id, now, type, memo ?? null)
        .run()
    }

    const record = await db.prepare('SELECT * FROM attendance WHERE id = ?').bind(id).first()
    return Response.json({ attendance: record, updated: !!existing }, { status: existing ? 200 : 201 })
  } catch (error) {
    captureException(error, { route: 'POST /api/attendance' })
    return Response.json({ error: '출석 체크에 실패했습니다.' }, { status: 500 })
  }
}
