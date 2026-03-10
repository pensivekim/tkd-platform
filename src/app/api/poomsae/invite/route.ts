import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'
import { nanoid } from 'nanoid'
import { POOMSAE_LIST } from '@/lib/poomsae-data'

const BASE_URL = 'https://tkd.genomic.cc'

// POST /api/poomsae/invite — 연습 초대 링크 생성
export async function POST(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json() as {
      student_id: string
      poomsae_id: string
      message?:   string
    }

    if (!body.student_id) return Response.json({ error: 'student_id가 필요합니다.' }, { status: 400 })
    if (!body.poomsae_id) return Response.json({ error: 'poomsae_id가 필요합니다.' }, { status: 400 })

    // poomsae_id 유효성 확인
    const poomsae = POOMSAE_LIST.find(p => p.id === body.poomsae_id)
    if (!poomsae) return Response.json({ error: '유효하지 않은 poomsae_id입니다.' }, { status: 400 })

    // 학생 존재 확인
    const student = await db
      .prepare('SELECT id FROM students WHERE id = ? AND dojang_id = ?')
      .bind(body.student_id, payload.dojanId)
      .first()
    if (!student) return Response.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 })

    const id           = nanoid()
    const inviteToken  = nanoid(10)
    const expiresAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await db
      .prepare(`
        INSERT INTO poomsae_invites
          (id, dojang_id, student_id, poomsae_id, invite_token, message, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, payload.dojanId, body.student_id, body.poomsae_id, inviteToken, body.message ?? null, expiresAt)
      .run()

    const inviteUrl = `${BASE_URL}/poomsae/${body.poomsae_id}?token=${inviteToken}`
    return Response.json({ id, invite_url: inviteUrl, invite_token: inviteToken }, { status: 201 })
  } catch (error) {
    captureException(error, { route: 'POST /api/poomsae/invite' })
    return Response.json({ error: '초대 생성에 실패했습니다.' }, { status: 500 })
  }
}
