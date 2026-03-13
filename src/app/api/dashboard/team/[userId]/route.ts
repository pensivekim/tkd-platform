import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { getDB } from '@/lib/db'
import { captureException } from '@/lib/sentry'

// DELETE /api/dashboard/team/[userId] — 팀원 삭제 (owner only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const me = await authFromRequest()
    if (!me || !me.dojanId || me.role !== 'owner') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { userId } = await params

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    // 같은 도장 소속이고 owner가 아닌 사용자만 삭제 가능
    const target = await db
      .prepare('SELECT id, role FROM users WHERE id = ? AND dojang_id = ?')
      .bind(userId, me.dojanId)
      .first() as { id: string; role: string } | null

    if (!target) {
      return Response.json({ error: '해당 팀원을 찾을 수 없습니다.' }, { status: 404 })
    }
    if (target.role === 'owner') {
      return Response.json({ error: '관장(owner) 계정은 삭제할 수 없습니다.' }, { status: 400 })
    }

    await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()

    return Response.json({ ok: true })
  } catch (err) {
    captureException(err, { route: 'DELETE /api/dashboard/team/[userId]' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}
