import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ token: string }> }

// PATCH /api/poomsae/invite/[token] — 사용 완료 기록
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const { token } = await params

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const invite = await db
      .prepare('SELECT id, used_at FROM poomsae_invites WHERE invite_token = ?')
      .bind(token)
      .first()
    if (!invite) return Response.json({ error: '초대를 찾을 수 없습니다.' }, { status: 404 })

    const now = new Date().toISOString()
    await db
      .prepare('UPDATE poomsae_invites SET used_at = ? WHERE invite_token = ?')
      .bind(now, token)
      .run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'PATCH /api/poomsae/invite/[token]' })
    return Response.json({ error: '사용 처리에 실패했습니다.' }, { status: 500 })
  }
}
