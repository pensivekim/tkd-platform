import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'
import { sendPushToStudent } from '@/lib/push'

type Params = { params: Promise<{ id: string }> }

// POST /api/albums/[id]/notify — 앨범 사진 확인된 원생 학부모에게 푸시 알림 발송
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id: albumId } = await params
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    // 앨범 확인
    const album = await db
      .prepare('SELECT id, title, share_token FROM albums WHERE id = ? AND dojang_id = ?')
      .bind(albumId, payload.dojanId)
      .first() as { id: string; title: string; share_token: string | null } | null
    if (!album) return Response.json({ error: '앨범을 찾을 수 없습니다.' }, { status: 404 })

    // 도장명 조회
    const dojang = await db
      .prepare('SELECT name FROM dojangs WHERE id = ?')
      .bind(payload.dojanId)
      .first() as { name: string } | null

    // confirmed 사진의 student_id 목록 (중복 제거)
    const { results: photos } = await db
      .prepare('SELECT DISTINCT student_id FROM photos WHERE album_id = ? AND is_confirmed = 1 AND student_id IS NOT NULL')
      .bind(albumId)
      .all() as { results: { student_id: string }[] }

    const studentIds = (photos ?? []).map((p) => p.student_id)
    if (!studentIds.length) {
      return Response.json({ sent: 0, failed: 0, message: '확인된 원생 사진이 없습니다.' })
    }

    const shareUrl  = album.share_token
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tkd.genomic.cc'}/share/${album.share_token}`
      : `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://tkd.genomic.cc'}/dashboard/albums/${albumId}`
    const dojanName = dojang?.name ?? '도장'

    let totalSent   = 0
    let totalFailed = 0

    for (const studentId of studentIds) {
      try {
        const result = await sendPushToStudent(db, studentId, {
          title: `[${dojanName}] 사진이 도착했어요! 📸`,
          body:  `${album.title} 앨범에 새 사진이 등록되었습니다.`,
          url:   shareUrl,
          icon:  '/icon-192.png',
        })
        totalSent   += result.sent
        totalFailed += result.failed
      } catch (studentErr) {
        captureException(studentErr, { action: 'notify_student', studentId })
        totalFailed++
      }
    }

    return Response.json({ sent: totalSent, failed: totalFailed })
  } catch (error) {
    captureException(error, { route: 'POST /api/albums/[id]/notify' })
    return Response.json({ error: '알림 발송에 실패했습니다.' }, { status: 500 })
  }
}
