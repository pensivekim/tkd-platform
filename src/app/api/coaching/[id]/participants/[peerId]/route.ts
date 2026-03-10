import { NextRequest } from 'next/server'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string; peerId: string }> }

// DELETE /api/coaching/[id]/participants/[peerId] — 참가자 퇴장 (left_at 업데이트)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id: sessionId, peerId } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const now = new Date().toISOString()
    await db
      .prepare('UPDATE coaching_participants SET left_at = ? WHERE session_id = ? AND peer_id = ? AND left_at IS NULL')
      .bind(now, sessionId, peerId)
      .run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'DELETE /api/coaching/[id]/participants/[peerId]' })
    return Response.json({ error: '퇴장 처리에 실패했습니다.' }, { status: 500 })
  }
}
