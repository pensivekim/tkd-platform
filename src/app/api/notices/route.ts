import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

const NoticeSchema = z.object({
  title:     z.string().min(1, '제목을 입력해주세요.').max(100),
  content:   z.string().min(1, '내용을 입력해주세요.'),
  is_pinned: z.boolean().default(false),
})

// GET /api/notices — 공지 목록
export async function GET() {
  try {
    const payload = await authFromRequest()
    if (!payload)          return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId)  return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const { results } = await db
      .prepare(
        'SELECT * FROM notices WHERE dojang_id = ? ORDER BY is_pinned DESC, created_at DESC',
      )
      .bind(payload.dojanId)
      .all()

    return Response.json({ notices: results ?? [] })
  } catch (error) {
    captureException(error, { route: 'GET /api/notices' })
    return Response.json({ error: '공지사항을 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/notices — 공지 등록
export async function POST(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload)          return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId)  return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json()
    const parsed = NoticeSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { title, content, is_pinned } = parsed.data
    const id  = nanoid()
    const now = new Date().toISOString()

    await db
      .prepare(
        'INSERT INTO notices (id, dojang_id, title, content, is_pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, payload.dojanId, title, content, is_pinned ? 1 : 0, now, now)
      .run()

    const notice = await db.prepare('SELECT * FROM notices WHERE id = ?').bind(id).first()
    return Response.json({ notice }, { status: 201 })
  } catch (error) {
    captureException(error, { route: 'POST /api/notices' })
    return Response.json({ error: '공지 등록에 실패했습니다.' }, { status: 500 })
  }
}
