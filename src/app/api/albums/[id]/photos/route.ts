import { NextRequest } from 'next/server'
import { getDB, getR2 } from '@/lib/db'
import { nanoid } from 'nanoid'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string }> }

// GET /api/albums/[id]/photos — 사진 목록
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: albumId } = await params
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const album = await db
      .prepare('SELECT id FROM albums WHERE id = ? AND dojang_id = ?')
      .bind(albumId, payload.dojanId)
      .first()
    if (!album) return Response.json({ error: '앨범을 찾을 수 없습니다.' }, { status: 404 })

    const { results } = await db
      .prepare('SELECT * FROM photos WHERE album_id = ? ORDER BY created_at ASC')
      .bind(albumId)
      .all()

    return Response.json({ photos: results ?? [] })
  } catch (error) {
    captureException(error, { route: 'GET /api/albums/[id]/photos' })
    return Response.json({ error: '사진 목록을 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/albums/[id]/photos — 사진 업로드
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: albumId } = await params
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })
    const r2 = await getR2()
    if (!r2) return Response.json({ error: 'R2를 사용할 수 없습니다.' }, { status: 503 })

    const album = await db
      .prepare('SELECT id FROM albums WHERE id = ? AND dojang_id = ?')
      .bind(albumId, payload.dojanId)
      .first()
    if (!album) return Response.json({ error: '앨범을 찾을 수 없습니다.' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return Response.json({ error: '이미지 파일이 없습니다.' }, { status: 400 })

    const photoId = nanoid()
    const r2Key   = `${payload.dojanId}/${albumId}/${photoId}.jpg`
    const now     = new Date().toISOString()

    // R2에 저장
    const arrayBuffer = await file.arrayBuffer()
    await r2.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType: 'image/jpeg' },
    })

    // DB 레코드 생성
    await db
      .prepare(
        'INSERT INTO photos (id, album_id, dojang_id, r2_key, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(photoId, albumId, payload.dojanId, r2Key, now)
      .run()

    // albums.photo_count 업데이트
    await db
      .prepare('UPDATE albums SET photo_count = photo_count + 1, updated_at = ? WHERE id = ?')
      .bind(now, albumId)
      .run()

    const photo = await db.prepare('SELECT * FROM photos WHERE id = ?').bind(photoId).first()
    const photosBase = process.env.NEXT_PUBLIC_PHOTOS_URL ?? ''
    const url = photosBase ? `${photosBase}/${r2Key}` : r2Key
    return Response.json({ photo, url }, { status: 201 })
  } catch (error) {
    captureException(error, { route: 'POST /api/albums/[id]/photos' })
    return Response.json({ error: '사진 업로드에 실패했습니다.' }, { status: 500 })
  }
}
