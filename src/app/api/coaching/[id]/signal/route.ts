import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { nanoid } from 'nanoid'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string }> }

// POST /api/coaching/[id]/signal — 시그널 전송 (인증 불필요)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: sessionId } = await params

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json() as {
      from_peer: string
      to_peer:   string
      type:      string
      payload:   unknown
    }

    if (!body.from_peer || !body.to_peer || !body.type || body.payload === undefined) {
      return Response.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const id  = nanoid()
    const now = new Date().toISOString()

    await db
      .prepare(
        'INSERT INTO coaching_signals (id, session_id, from_peer, to_peer, type, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, sessionId, body.from_peer, body.to_peer, body.type, JSON.stringify(body.payload), now)
      .run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'POST /api/coaching/[id]/signal' })
    return Response.json({ error: '시그널 전송에 실패했습니다.' }, { status: 500 })
  }
}

// GET /api/coaching/[id]/signal?peer_id=xxx — 시그널 수신 후 삭제 (폴링)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: sessionId } = await params
    const peerId = new URL(req.url).searchParams.get('peer_id')
    if (!peerId) return Response.json({ error: 'peer_id가 필요합니다.' }, { status: 400 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const { results } = await db
      .prepare('SELECT * FROM coaching_signals WHERE session_id = ? AND to_peer = ? ORDER BY created_at ASC')
      .bind(sessionId, peerId)
      .all() as { results: { id: string; from_peer: string; type: string; payload: string; created_at: string }[] }

    if (results?.length) {
      const ids = results.map((r) => `'${r.id}'`).join(',')
      await db.prepare(`DELETE FROM coaching_signals WHERE id IN (${ids})`).run()
    }

    const signals = (results ?? []).map((r) => ({
      id:         r.id,
      from_peer:  r.from_peer,
      type:       r.type,
      payload:    JSON.parse(r.payload),
      created_at: r.created_at,
    }))

    return Response.json({ signals })
  } catch (error) {
    captureException(error, { route: 'GET /api/coaching/[id]/signal' })
    return Response.json({ error: '시그널 수신에 실패했습니다.' }, { status: 500 })
  }
}
