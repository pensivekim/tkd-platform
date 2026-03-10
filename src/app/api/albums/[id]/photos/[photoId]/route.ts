import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string; photoId: string }> }

// DELETE /api/albums/[id]/photos/[photoId] — 사진 삭제
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id: albumId, photoId } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const photo = await db
      .prepare('SELECT id, r2_key FROM photos WHERE id = ? AND album_id = ? AND dojang_id = ?')
      .bind(photoId, albumId, payload.dojanId)
      .first() as { id: string; r2_key: string } | null
    if (!photo) return Response.json({ error: '사진을 찾을 수 없습니다.' }, { status: 404 })

    // R2에서 파일 삭제
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r2 = (process as any).env?.PHOTOS as any
    if (r2) {
      await r2.delete(photo.r2_key).catch(() => null)
    }

    // DB 삭제
    const now = new Date().toISOString()
    await db.prepare('DELETE FROM photos WHERE id = ?').bind(photoId).run()
    await db
      .prepare('UPDATE albums SET photo_count = MAX(0, photo_count - 1), updated_at = ? WHERE id = ?')
      .bind(now, albumId)
      .run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'DELETE /api/albums/[id]/photos/[photoId]' })
    return Response.json({ error: '사진 삭제에 실패했습니다.' }, { status: 500 })
  }
}
