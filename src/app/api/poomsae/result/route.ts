import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'
import { nanoid } from 'nanoid'

export interface PoomsaeResult {
  id:               string
  dojang_id:        string
  student_id:       string | null
  student_name:     string
  poomsae_id:       string
  poomsae_name:     string
  total_score:      number
  accuracy:         number | null
  symmetry:         number | null
  stability:        number | null
  timing:           number | null
  completeness:     number | null
  duration_seconds: number | null
  mode:             string
  created_at:       string
}

// POST /api/poomsae/result — 채점 결과 저장 (인증 선택적)
export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json() as {
      student_name:     string
      student_id?:      string
      poomsae_id:       string
      poomsae_name:     string
      total_score:      number
      accuracy?:        number
      symmetry?:        number
      stability?:       number
      timing?:          number
      completeness?:    number
      duration_seconds?: number
      mode?:            string
      dojang_id?:       string  // 비로그인 시 쿼리 또는 body로 전달
    }

    if (!body.student_name?.trim())  return Response.json({ error: '학생 이름이 필요합니다.' }, { status: 400 })
    if (!body.poomsae_id)            return Response.json({ error: 'poomsae_id가 필요합니다.' }, { status: 400 })
    if (body.total_score == null)    return Response.json({ error: 'total_score가 필요합니다.' }, { status: 400 })

    // dojang_id: JWT > body > 쿼리 파라미터 순으로 결정
    const jwtPayload = await authFromRequest()
    const dojanId = jwtPayload?.dojanId
      ?? body.dojang_id
      ?? new URL(req.url).searchParams.get('dojang_id')

    if (!dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 400 })

    // 도장 존재 확인
    const dojang = await db.prepare('SELECT id FROM dojangs WHERE id = ?').bind(dojanId).first()
    if (!dojang) return Response.json({ error: '도장을 찾을 수 없습니다.' }, { status: 404 })

    const id = nanoid()
    await db
      .prepare(`
        INSERT INTO poomsae_results
          (id, dojang_id, student_id, student_name, poomsae_id, poomsae_name,
           total_score, accuracy, symmetry, stability, timing, completeness,
           duration_seconds, mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        dojanId,
        body.student_id ?? null,
        body.student_name.trim(),
        body.poomsae_id,
        body.poomsae_name,
        body.total_score,
        body.accuracy      ?? null,
        body.symmetry      ?? null,
        body.stability     ?? null,
        body.timing        ?? null,
        body.completeness  ?? null,
        body.duration_seconds ?? null,
        body.mode ?? 'practice',
      )
      .run()

    return Response.json({ id, total_score: body.total_score }, { status: 201 })
  } catch (error) {
    captureException(error, { route: 'POST /api/poomsae/result' })
    return Response.json({ error: '결과 저장에 실패했습니다.' }, { status: 500 })
  }
}

// GET /api/poomsae/result — 결과 목록 조회 (도장 관리자 전용)
export async function GET(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const url        = new URL(req.url)
    const studentId  = url.searchParams.get('student_id')
    const poomsaeId  = url.searchParams.get('poomsae_id')
    const limit      = Math.min(Number(url.searchParams.get('limit')  ?? 50), 200)
    const offset     = Math.max(Number(url.searchParams.get('offset') ?? 0),  0)

    // 동적 WHERE 절 구성
    const conditions: string[] = ['dojang_id = ?']
    const binds: unknown[]     = [payload.dojanId]

    if (studentId) { conditions.push('student_id = ?');  binds.push(studentId) }
    if (poomsaeId) { conditions.push('poomsae_id = ?');  binds.push(poomsaeId) }

    const where = conditions.join(' AND ')

    const [rows, countRow] = await Promise.all([
      db.prepare(`SELECT * FROM poomsae_results WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(...binds, limit, offset)
        .all(),
      db.prepare(`SELECT COUNT(*) as cnt FROM poomsae_results WHERE ${where}`)
        .bind(...binds)
        .first() as Promise<{ cnt: number } | null>,
    ])

    return Response.json({
      results: (rows.results ?? []) as PoomsaeResult[],
      total:   countRow?.cnt ?? 0,
    })
  } catch (error) {
    captureException(error, { route: 'GET /api/poomsae/result' })
    return Response.json({ error: '결과 조회에 실패했습니다.' }, { status: 500 })
  }
}
