import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { z } from 'zod'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

const UpdateSchema = z.object({
  title:     z.string().min(1).max(100).optional(),
  content:   z.string().min(1).optional(),
  is_pinned: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

// PATCH /api/notices/[id] — 공지 수정
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const existing = await db
      .prepare('SELECT id FROM notices WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()
    if (!existing) return Response.json({ error: '공지사항을 찾을 수 없습니다.' }, { status: 404 })

    const data = parsed.data
    const fields: string[]  = []
    const values: unknown[] = []

    if (data.title     !== undefined) { fields.push('title = ?');     values.push(data.title) }
    if (data.content   !== undefined) { fields.push('content = ?');   values.push(data.content) }
    if (data.is_pinned !== undefined) { fields.push('is_pinned = ?'); values.push(data.is_pinned ? 1 : 0) }

    if (fields.length === 0) return Response.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })

    fields.push('updated_at = ?')
    values.push(new Date().toISOString(), id, payload.dojanId)

    await db
      .prepare(`UPDATE notices SET ${fields.join(', ')} WHERE id = ? AND dojang_id = ?`)
      .bind(...values)
      .run()

    const notice = await db.prepare('SELECT * FROM notices WHERE id = ?').bind(id).first()
    return Response.json({ notice })
  } catch (error) {
    captureException(error, { route: 'PATCH /api/notices/[id]' })
    return Response.json({ error: '공지 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/notices/[id] — 공지 삭제
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const existing = await db
      .prepare('SELECT id FROM notices WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()
    if (!existing) return Response.json({ error: '공지사항을 찾을 수 없습니다.' }, { status: 404 })

    await db.prepare('DELETE FROM notices WHERE id = ?').bind(id).run()
    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'DELETE /api/notices/[id]' })
    return Response.json({ error: '공지 삭제에 실패했습니다.' }, { status: 500 })
  }
}
