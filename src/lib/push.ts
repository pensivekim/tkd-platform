import webpush from 'web-push'
import { captureException } from '@/lib/sentry'

function initVapid() {
  const publicKey  = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email      = process.env.VAPID_EMAIL ?? 'mailto:contact@genomic.cc'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(email, publicKey, privateKey)
  return true
}

type PushPayload = {
  title: string
  body:  string
  url:   string
  icon?: string
}

type Subscription = {
  endpoint: string
  p256dh:   string
  auth:     string
}

async function send(sub: Subscription, payload: PushPayload): Promise<'ok' | 'gone' | 'error'> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    )
    return 'ok'
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
      return 'gone'
    }
    captureException(err, { action: 'webpush_send', endpoint: sub.endpoint })
    return 'error'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any

export async function sendPushToStudent(
  db: AnyDb,
  studentId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  if (!initVapid()) return { sent: 0, failed: 0 }

  const { results } = await db
    .prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE student_id = ?')
    .bind(studentId)
    .all() as { results: Subscription[] }

  return dispatch(db, results ?? [], payload)
}

export async function sendPushToDojang(
  db: AnyDb,
  dojanId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  if (!initVapid()) return { sent: 0, failed: 0 }

  const { results } = await db
    .prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE dojang_id = ?')
    .bind(dojanId)
    .all() as { results: Subscription[] }

  return dispatch(db, results ?? [], payload)
}

async function dispatch(db: AnyDb, subs: Subscription[], payload: PushPayload) {
  let sent = 0
  let failed = 0
  for (const sub of subs) {
    const result = await send(sub, payload)
    if (result === 'ok') {
      sent++
    } else if (result === 'gone') {
      // 만료된 구독 자동 삭제
      await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(sub.endpoint).run().catch(() => null)
      failed++
    } else {
      failed++
    }
  }
  return { sent, failed }
}
