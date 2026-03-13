import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { getDB } from '@/lib/db'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { captureException } from '@/lib/sentry'

// GET /api/admin/dojangs — 전체 도장 목록 (platform_manager)
export async function GET() {
  try {
    const me = await authFromRequest()
    if (!me || me.role !== 'platform_manager') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const { results: dojangs } = await db
      .prepare('SELECT id, name, owner_name, phone, region, plan, created_at FROM dojangs ORDER BY created_at DESC')
      .all()

    // 도장별 원생 수
    const counts = await db
      .prepare('SELECT dojang_id, COUNT(*) as cnt FROM students WHERE status = ? GROUP BY dojang_id')
      .bind('active')
      .all()

    const countMap: Record<string, number> = {}
    for (const row of counts.results as { dojang_id: string; cnt: number }[]) {
      countMap[row.dojang_id] = row.cnt
    }

    const list = (dojangs as { id: string; name: string; owner_name: string; phone: string; region: string; plan: string; created_at: string }[]).map((d) => ({
      ...d,
      student_count: countMap[d.id] ?? 0,
    }))

    return Response.json({ dojangs: list })
  } catch (err) {
    captureException(err, { route: 'GET /api/admin/dojangs' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST /api/admin/dojangs — 새 도장 + 관장 계정 생성 (platform_manager)
export async function POST(req: NextRequest) {
  try {
    const me = await authFromRequest()
    if (!me || me.role !== 'platform_manager') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const body = await req.json()
    const { dojang_name, owner_name, email, password, phone, region } = body

    if (!dojang_name || !owner_name || !email || !password) {
      return Response.json({ error: '도장명, 관장명, 이메일, 비밀번호는 필수입니다.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(normalizedEmail).first()
    if (existing) {
      return Response.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 })
    }

    const now      = new Date().toISOString()
    const dojangId = nanoid()
    const userId   = nanoid()
    const pwHash   = await hash(password, 10)

    await db
      .prepare('INSERT INTO dojangs (id, name, owner_name, phone, region, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(dojangId, dojang_name, owner_name, phone ?? null, region ?? null, 'free', now, now)
      .run()

    await db
      .prepare('INSERT INTO users (id, dojang_id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(userId, dojangId, normalizedEmail, pwHash, owner_name, 'owner', now)
      .run()

    return Response.json({ ok: true, dojang_id: dojangId }, { status: 201 })
  } catch (err) {
    captureException(err, { route: 'POST /api/admin/dojangs' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}
