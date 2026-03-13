import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { getDB } from '@/lib/db'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { captureException } from '@/lib/sentry'

// GET /api/admin/users?dojang_id=xxx — 도장 내 사용자 목록 (platform_manager)
export async function GET(req: NextRequest) {
  try {
    const me = await authFromRequest()
    if (!me || me.role !== 'platform_manager') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const dojangId = req.nextUrl.searchParams.get('dojang_id')
    if (!dojangId) {
      return Response.json({ error: 'dojang_id 파라미터가 필요합니다.' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const { results } = await db
      .prepare('SELECT id, name, email, role, created_at FROM users WHERE dojang_id = ? ORDER BY created_at ASC')
      .bind(dojangId)
      .all()

    return Response.json({ users: results })
  } catch (err) {
    captureException(err, { route: 'GET /api/admin/users' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST /api/admin/users — 특정 도장에 사용자 추가 (platform_manager)
export async function POST(req: NextRequest) {
  try {
    const me = await authFromRequest()
    if (!me || me.role !== 'platform_manager') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const body = await req.json()
    const { dojang_id, name, email, role, password } = body

    if (!dojang_id || !name || !email || !role || !password) {
      return Response.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
    }
    if (!['owner', 'manager', 'staff', 'instructor'].includes(role)) {
      return Response.json({ error: '올바르지 않은 역할입니다.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(normalizedEmail).first()
    if (existing) {
      return Response.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 })
    }

    const pwHash = await hash(password, 10)
    const userId = nanoid()
    const now    = new Date().toISOString()

    await db
      .prepare('INSERT INTO users (id, dojang_id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(userId, dojang_id, normalizedEmail, pwHash, name, role, now)
      .run()

    return Response.json({ ok: true, user: { id: userId, name, email: normalizedEmail, role } }, { status: 201 })
  } catch (err) {
    captureException(err, { route: 'POST /api/admin/users' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}
