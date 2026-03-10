import { NextRequest } from 'next/server'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ inviteToken: string }> }

// GET /api/public/coaching/[inviteToken] — 초대 토큰으로 세션 조회 (인증 불필요)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { inviteToken } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const session = await db
      .prepare(
        `SELECT cs.id, cs.title, cs.description, cs.type, cs.status, cs.max_participants, cs.invite_token, cs.started_at,
                d.name AS dojang_name
         FROM coaching_sessions cs
         JOIN dojangs d ON d.id = cs.dojang_id
         WHERE cs.invite_token = ?`,
      )
      .bind(inviteToken)
      .first()

    if (!session) return Response.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 })
    if ((session as { status: string }).status === 'ended') {
      return Response.json({ error: '종료된 세션입니다.' }, { status: 410 })
    }

    // 현재 참가자 수 포함
    const countRow = await db
      .prepare('SELECT COUNT(*) as cnt FROM coaching_participants WHERE session_id = ? AND left_at IS NULL')
      .bind((session as { id: string }).id)
      .first() as { cnt: number }

    return Response.json({ session: { ...session, current_participants: countRow?.cnt ?? 0 } })
  } catch (error) {
    captureException(error, { route: 'GET /api/public/coaching/[inviteToken]' })
    return Response.json({ error: '세션 정보를 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}
