import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/coaching/[id] — 세션 상태 변경
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const session = await db
      .prepare('SELECT id FROM coaching_sessions WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()
    if (!session) return Response.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 })

    const body = await req.json() as { status?: 'active' | 'ended' }
    if (!body.status || !['active', 'ended'].includes(body.status)) {
      return Response.json({ error: 'status는 active 또는 ended 이어야 합니다.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    if (body.status === 'active') {
      await db
        .prepare('UPDATE coaching_sessions SET status = ?, started_at = ? WHERE id = ?')
        .bind('active', now, id)
        .run()
    } else {
      await db
        .prepare('UPDATE coaching_sessions SET status = ?, ended_at = ? WHERE id = ?')
        .bind('ended', now, id)
        .run()
    }

    const updated = await db.prepare('SELECT * FROM coaching_sessions WHERE id = ?').bind(id).first()
    return Response.json({ session: updated })
  } catch (error) {
    captureException(error, { route: 'PATCH /api/coaching/[id]' })
    return Response.json({ error: '세션 상태 변경에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/coaching/[id] — 세션 삭제
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const session = await db
      .prepare('SELECT id FROM coaching_sessions WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()
    if (!session) return Response.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 })

    // 연관 데이터 cascade 삭제
    await db.prepare('DELETE FROM coaching_signals    WHERE session_id = ?').bind(id).run()
    await db.prepare('DELETE FROM coaching_participants WHERE session_id = ?').bind(id).run()
    await db.prepare('DELETE FROM coaching_sessions   WHERE id = ?').bind(id).run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'DELETE /api/coaching/[id]' })
    return Response.json({ error: '세션 삭제에 실패했습니다.' }, { status: 500 })
  }
}
