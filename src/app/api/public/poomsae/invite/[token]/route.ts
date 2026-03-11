import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { captureException } from '@/lib/sentry'
import { POOMSAE_LIST } from '@/lib/poomsae-data'

type Params = { params: Promise<{ token: string }> }

type InviteRow = {
  student_id:   string
  student_name: string
  poomsae_id:   string
  message:      string | null
  used_at:      string | null
  expires_at:   string | null
  dojang_name:  string
}

// GET /api/public/poomsae/invite/[token] — 초대 정보 조회 (인증 불필요)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { token } = await params

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const row = await db
      .prepare(`
        SELECT
          pi.student_id,
          s.name  AS student_name,
          pi.poomsae_id,
          pi.message,
          pi.used_at,
          pi.expires_at,
          d.name  AS dojang_name
        FROM poomsae_invites pi
        JOIN students s ON s.id = pi.student_id
        JOIN dojangs  d ON d.id = pi.dojang_id
        WHERE pi.invite_token = ?
      `)
      .bind(token)
      .first() as InviteRow | null

    if (!row) return Response.json({ error: '초대를 찾을 수 없습니다.' }, { status: 404 })

    const expired =
      !!row.used_at ||
      (!!row.expires_at && new Date(row.expires_at) < new Date())

    const poomsae = POOMSAE_LIST.find(p => p.id === row.poomsae_id)

    return Response.json({
      student_id:   row.student_id,
      student_name: row.student_name,
      poomsae_id:   row.poomsae_id,
      poomsae_name: poomsae?.nameKo ?? row.poomsae_id,
      dojang_name:  row.dojang_name,
      message:      row.message,
      expired,
    })
  } catch (error) {
    captureException(error, { route: 'GET /api/public/poomsae/invite/[token]' })
    return Response.json({ error: '초대 조회에 실패했습니다.' }, { status: 500 })
  }
}
