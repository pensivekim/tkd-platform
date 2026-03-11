import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

const CreateSchema = z.object({
  title:            z.string().min(1, '제목을 입력해주세요.').max(100),
  description:      z.string().max(500).optional(),
  type:             z.enum(['individual', 'group']).default('individual'),
  max_participants: z.number().int().min(1).max(50).default(10),
})

// GET /api/coaching — 세션 목록
export async function GET() {
  try {
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const { results } = await db
      .prepare('SELECT * FROM coaching_sessions WHERE dojang_id = ? ORDER BY created_at DESC')
      .bind(payload.dojanId)
      .all()

    return Response.json({ sessions: results ?? [] })
  } catch (error) {
    captureException(error, { route: 'GET /api/coaching' })
    return Response.json({ error: '세션 목록을 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/coaching — 세션 생성
export async function POST(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body   = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { title, description, type, max_participants } = parsed.data
    const id           = nanoid()
    const invite_token = nanoid(10)
    const now          = new Date().toISOString()

    await db
      .prepare(
        `INSERT INTO coaching_sessions
          (id, dojang_id, coach_id, title, description, type, status, invite_token, max_participants, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?, ?, ?)`,
      )
      .bind(id, payload.dojanId, payload.userId, title, description ?? null, type, invite_token, max_participants, now)
      .run()

    const session = await db.prepare('SELECT * FROM coaching_sessions WHERE id = ?').bind(id).first()
    return Response.json({ session }, { status: 201 })
  } catch (error) {
    captureException(error, { route: 'POST /api/coaching' })
    return Response.json({ error: '세션 생성에 실패했습니다.' }, { status: 500 })
  }
}
