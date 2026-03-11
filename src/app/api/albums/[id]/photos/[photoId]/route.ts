import { NextRequest } from 'next/server'
import { getDB, getR2 } from '@/lib/db'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string; photoId: string }> }

// PATCH /api/albums/[id]/photos/[photoId] — 수동 태깅 / 확인 처리
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: albumId, photoId } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const photo = await db
      .prepare('SELECT id FROM photos WHERE id = ? AND album_id = ? AND dojang_id = ?')
      .bind(photoId, albumId, payload.dojanId)
      .first()
    if (!photo) return Response.json({ error: '사진을 찾을 수 없습니다.' }, { status: 404 })

    const body = await req.json() as { student_id?: string | null; is_confirmed?: boolean }
    const sets: string[] = []
    const binds: unknown[] = []

    if ('student_id' in body) {
      sets.push('student_id = ?')
      binds.push(body.student_id ?? null)
      sets.push('face_confidence = ?')
      binds.push(body.student_id ? 1.0 : null)
      sets.push('classified_at = ?')
      binds.push(body.student_id ? new Date().toISOString() : null)
    }
    if ('is_confirmed' in body) {
      sets.push('is_confirmed = ?')
      binds.push(body.is_confirmed ? 1 : 0)
    }
    if (sets.length === 0) return Response.json({ error: '변경할 항목이 없습니다.' }, { status: 400 })

    binds.push(photoId)
    await db.prepare(`UPDATE photos SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'PATCH /api/albums/[id]/photos/[photoId]' })
    return Response.json({ error: '태깅에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/albums/[id]/photos/[photoId] — 사진 삭제
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id: albumId, photoId } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const photo = await db
      .prepare('SELECT id, r2_key FROM photos WHERE id = ? AND album_id = ? AND dojang_id = ?')
      .bind(photoId, albumId, payload.dojanId)
      .first() as { id: string; r2_key: string } | null
    if (!photo) return Response.json({ error: '사진을 찾을 수 없습니다.' }, { status: 404 })

    // R2에서 파일 삭제
    const r2 = await getR2()
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
