import { NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string }> }

// GET /api/coaching/[id]/participants — 현재 접속 중인 참가자 목록
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: sessionId } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const { results } = await db
      .prepare('SELECT * FROM coaching_participants WHERE session_id = ? AND left_at IS NULL ORDER BY joined_at ASC')
      .bind(sessionId)
      .all()

    return Response.json({ participants: results ?? [] })
  } catch (error) {
    captureException(error, { route: 'GET /api/coaching/[id]/participants' })
    return Response.json({ error: '참가자 목록을 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/coaching/[id]/participants — 참가자 등록 (인증 불필요, invite_token 검증)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: sessionId } = await params
    const url         = new URL(req.url)
    const inviteToken = url.searchParams.get('invite_token')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    // invite_token 검증
    const session = await db
      .prepare('SELECT id, status, max_participants, invite_token FROM coaching_sessions WHERE id = ?')
      .bind(sessionId)
      .first() as { id: string; status: string; max_participants: number; invite_token: string } | null

    if (!session) return Response.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 })
    if (session.status === 'ended') return Response.json({ error: '종료된 세션입니다.' }, { status: 410 })
    if (session.invite_token !== inviteToken) {
      return Response.json({ error: '유효하지 않은 초대 링크입니다.' }, { status: 403 })
    }

    // 현재 참가자 수 확인
    const countRow = await db
      .prepare('SELECT COUNT(*) as cnt FROM coaching_participants WHERE session_id = ? AND left_at IS NULL')
      .bind(sessionId)
      .first() as { cnt: number }
    if ((countRow?.cnt ?? 0) >= session.max_participants) {
      return Response.json({ error: '참가 인원이 가득 찼습니다.' }, { status: 409 })
    }

    const body = await req.json() as { peer_id: string; display_name: string; student_id?: string }
    if (!body.peer_id || !body.display_name) {
      return Response.json({ error: 'peer_id와 display_name은 필수입니다.' }, { status: 400 })
    }

    const id  = nanoid()
    const now = new Date().toISOString()

    await db
      .prepare(
        'INSERT INTO coaching_participants (id, session_id, student_id, peer_id, display_name, joined_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(id, sessionId, body.student_id ?? null, body.peer_id, body.display_name, now)
      .run()

    const participant = await db
      .prepare('SELECT * FROM coaching_participants WHERE id = ?')
      .bind(id)
      .first()

    return Response.json({ participant }, { status: 201 })
  } catch (error) {
    captureException(error, { route: 'POST /api/coaching/[id]/participants' })
    return Response.json({ error: '참가자 등록에 실패했습니다.' }, { status: 500 })
  }
}
