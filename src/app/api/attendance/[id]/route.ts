import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/attendance/[id] — 출석 기록 삭제
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const existing = await db
      .prepare('SELECT id FROM attendance WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()

    if (!existing) return Response.json({ error: '출석 기록을 찾을 수 없습니다.' }, { status: 404 })

    await db.prepare('DELETE FROM attendance WHERE id = ?').bind(id).run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'DELETE /api/attendance/[id]' })
    return Response.json({ error: '출석 기록 삭제에 실패했습니다.' }, { status: 500 })
  }
}
