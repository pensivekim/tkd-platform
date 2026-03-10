import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'
import { nanoid } from 'nanoid'

// POST /api/push/subscribe — 웹 푸시 구독 등록
export async function POST(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json() as {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
      student_id?: string
    }

    const { endpoint, keys } = body.subscription ?? {}
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return Response.json({ error: '구독 정보가 올바르지 않습니다.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const id  = nanoid()

    // upsert: 같은 endpoint면 갱신
    await db
      .prepare(`
        INSERT INTO push_subscriptions (id, dojang_id, student_id, endpoint, p256dh, auth, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET
          student_id = excluded.student_id,
          p256dh     = excluded.p256dh,
          auth       = excluded.auth
      `)
      .bind(id, payload.dojanId ?? null, body.student_id ?? null, endpoint, keys.p256dh, keys.auth, now)
      .run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'POST /api/push/subscribe' })
    return Response.json({ error: '구독 등록에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/push/subscribe — 구독 해제
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { endpoint: string }
    if (!body.endpoint) return Response.json({ error: 'endpoint가 필요합니다.' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(body.endpoint).run()
    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'DELETE /api/push/subscribe' })
    return Response.json({ error: '구독 해제에 실패했습니다.' }, { status: 500 })
  }
}
