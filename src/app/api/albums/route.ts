import { NextRequest } from 'next/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

const CreateAlbumSchema = z.object({
  title:       z.string().min(1, '제목을 입력해주세요.').max(100),
  description: z.string().max(500).optional(),
  event_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다.'),
  type:        z.enum(['training', 'competition']).default('training'),
})

// GET /api/albums — 앨범 목록
export async function GET() {
  try {
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const { results } = await db
      .prepare('SELECT * FROM albums WHERE dojang_id = ? ORDER BY event_date DESC, created_at DESC')
      .bind(payload.dojanId)
      .all()

    return Response.json({ albums: results ?? [] })
  } catch (error) {
    captureException(error, { route: 'GET /api/albums' })
    return Response.json({ error: '앨범 목록을 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/albums — 앨범 생성
export async function POST(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json()
    const parsed = CreateAlbumSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { title, description, event_date, type } = parsed.data
    const id          = nanoid()
    const share_token = nanoid(12)
    const now         = new Date().toISOString()

    await db
      .prepare(
        'INSERT INTO albums (id, dojang_id, title, description, event_date, type, share_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, payload.dojanId, title, description ?? null, event_date, type, share_token, now, now)
      .run()

    const album = await db.prepare('SELECT * FROM albums WHERE id = ?').bind(id).first()
    return Response.json({ album }, { status: 201 })
  } catch (error) {
    captureException(error, { route: 'POST /api/albums' })
    return Response.json({ error: '앨범 생성에 실패했습니다.' }, { status: 500 })
  }
}
