import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ certNumber: string }> }

// GET /api/public/cert/[certNumber] — 공개 단증 검증 (인증 불필요)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { certNumber } = await params
    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const student = await db
      .prepare(`
        SELECT s.name, s.grade_type, s.dan_grade, s.cert_number, s.cert_issued_at,
               s.kukkiwon_id, s.nft_token_id, s.nft_tx_hash, s.nft_issued_at,
               d.name AS dojang_name
        FROM students s
        JOIN dojangs d ON d.id = s.dojang_id
        WHERE s.cert_number = ? AND s.status = 'active'
      `)
      .bind(certNumber)
      .first()

    if (!student) return Response.json({ error: '단증을 찾을 수 없습니다.' }, { status: 404 })

    return Response.json({ cert: student })
  } catch (error) {
    captureException(error, { route: 'GET /api/public/cert/[certNumber]' })
    return Response.json({ error: '단증 조회에 실패했습니다.' }, { status: 500 })
  }
}
