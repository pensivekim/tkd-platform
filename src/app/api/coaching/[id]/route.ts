import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string }> }

// GET /api/coaching/[id] — 세션 요약 정보
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const session = await db
      .prepare('SELECT * FROM coaching_sessions WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()
    if (!session) return Response.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 })

    const participantCount = await db
      .prepare('SELECT COUNT(*) as cnt FROM coaching_participants WHERE session_id = ?')
      .bind(id)
      .first() as { cnt: number } | null

    // 세션 지속 시간 계산 (분)
    let durationMinutes: number | null = null
    if (session.started_at && session.ended_at) {
      const start = new Date(session.started_at as string).getTime()
      const end   = new Date(session.ended_at   as string).getTime()
      durationMinutes = Math.round((end - start) / 60000)
    }

    return Response.json({
      session,
      summary: {
        participant_count: participantCount?.cnt ?? 0,
        duration_minutes:  durationMinutes,
      },
    })
  } catch (error) {
    captureException(error, { route: 'GET /api/coaching/[id]' })
    return Response.json({ error: '세션 정보 조회에 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/coaching/[id] — 세션 상태 변경
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const session = await db
      .prepare('SELECT id FROM coaching_sessions WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()
    if (!session) return Response.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 })

    const body = await req.json() as { status?: 'active' | 'ended' | 'waiting' }
    if (!body.status || !['active', 'ended', 'waiting'].includes(body.status)) {
      return Response.json({ error: 'status는 active, ended, waiting 이어야 합니다.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    if (body.status === 'active') {
      await db
        .prepare('UPDATE coaching_sessions SET status = ?, started_at = ? WHERE id = ?')
        .bind('active', now, id)
        .run()
    } else if (body.status === 'ended') {
      await db
        .prepare('UPDATE coaching_sessions SET status = ?, ended_at = ? WHERE id = ?')
        .bind('ended', now, id)
        .run()
    } else {
      // waiting: 다시 열기 — ended_at 초기화
      await db
        .prepare('UPDATE coaching_sessions SET status = ?, started_at = NULL, ended_at = NULL WHERE id = ?')
        .bind('waiting', id)
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

    const db = await getDB()
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
