import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { getDB } from '@/lib/db'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { captureException } from '@/lib/sentry'

// GET /api/dashboard/team — 팀원 목록 (owner / manager)
export async function GET() {
  try {
    const me = await authFromRequest()
    if (!me || !me.dojanId || !['owner', 'manager'].includes(me.role)) {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const { results } = await db
      .prepare('SELECT id, name, email, role, created_at FROM users WHERE dojang_id = ? AND role != ? ORDER BY created_at ASC')
      .bind(me.dojanId, 'owner')
      .all()

    return Response.json({ members: results })
  } catch (err) {
    captureException(err, { route: 'GET /api/dashboard/team' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST /api/dashboard/team — 팀원 추가 (owner only)
export async function POST(req: NextRequest) {
  try {
    const me = await authFromRequest()
    if (!me || !me.dojanId || me.role !== 'owner') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const body = await req.json()
    const { name, email, role, password } = body

    if (!name || !email || !role || !password) {
      return Response.json({ error: '이름, 이메일, 역할, 초기 비밀번호를 모두 입력해주세요.' }, { status: 400 })
    }
    if (!['manager', 'staff', 'instructor'].includes(role)) {
      return Response.json({ error: '역할은 manager / staff / instructor 중 하나여야 합니다.' }, { status: 400 })
    }
    if (password.length < 6) {
      return Response.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existing = await db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(normalizedEmail)
      .first()
    if (existing) {
      return Response.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 })
    }

    const pwHash = await hash(password, 10)
    const userId = nanoid()
    const now    = new Date().toISOString()

    await db
      .prepare('INSERT INTO users (id, dojang_id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(userId, me.dojanId, normalizedEmail, pwHash, name, role, now)
      .run()

    return Response.json({ ok: true, member: { id: userId, name, email: normalizedEmail, role, created_at: now } }, { status: 201 })
  } catch (err) {
    captureException(err, { route: 'POST /api/dashboard/team' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}
