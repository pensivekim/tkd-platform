import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ shareToken: string }> }

// GET /api/public/albums/[shareToken] — 공개 앨범 조회 (인증 불필요)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { shareToken } = await params

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const album = await db
      .prepare('SELECT * FROM albums WHERE share_token = ?')
      .bind(shareToken)
      .first()
    if (!album) return Response.json({ error: '앨범을 찾을 수 없습니다.' }, { status: 404 })

    const { results: photos } = await db
      .prepare('SELECT * FROM photos WHERE album_id = ? ORDER BY created_at ASC')
      .bind((album as { id: string }).id)
      .all()

    return Response.json({ album, photos: photos ?? [] })
  } catch (error) {
    captureException(error, { route: 'GET /api/public/albums/[shareToken]' })
    return Response.json({ error: '앨범을 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}
