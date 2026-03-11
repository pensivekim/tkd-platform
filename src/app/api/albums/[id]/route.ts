import { NextRequest } from 'next/server'
import { getDB, getR2 } from '@/lib/db'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/albums/[id] — 앨범 삭제 (사진 R2 전부 삭제 후 DB 삭제)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const album = await db
      .prepare('SELECT id FROM albums WHERE id = ? AND dojang_id = ?')
      .bind(id, payload.dojanId)
      .first()
    if (!album) return Response.json({ error: '앨범을 찾을 수 없습니다.' }, { status: 404 })

    // 앨범 내 사진 R2 키 목록 조회
    const { results: photoRows } = await db
      .prepare('SELECT r2_key FROM photos WHERE album_id = ?')
      .bind(id)
      .all()

    // R2에서 사진 파일 일괄 삭제
    const r2 = await getR2()
    if (r2 && photoRows?.length) {
      await Promise.all(
        (photoRows as { r2_key: string }[]).map((row) => r2.delete(row.r2_key).catch(() => null)),
      )
    }

    // DB 삭제 (photos → album 순서)
    await db.prepare('DELETE FROM photos WHERE album_id = ?').bind(id).run()
    await db.prepare('DELETE FROM albums WHERE id = ?').bind(id).run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'DELETE /api/albums/[id]' })
    return Response.json({ error: '앨범 삭제에 실패했습니다.' }, { status: 500 })
  }
}
