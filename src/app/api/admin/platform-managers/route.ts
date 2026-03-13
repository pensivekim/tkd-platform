import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { getDB } from '@/lib/db'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { captureException } from '@/lib/sentry'

// GET /api/admin/platform-managers
export async function GET() {
  try {
    const me = await authFromRequest()
    if (!me || me.role !== 'platform_manager') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const { results } = await db
      .prepare('SELECT id, name, email, role, created_at FROM users WHERE role = ? ORDER BY created_at ASC')
      .bind('platform_manager')
      .all()

    return Response.json({ managers: results })
  } catch (err) {
    captureException(err, { route: 'GET /api/admin/platform-managers' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST /api/admin/platform-managers
export async function POST(req: NextRequest) {
  try {
    const me = await authFromRequest()
    if (!me || me.role !== 'platform_manager') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const { name, email, password } = await req.json()
    if (!name || !email || !password) {
      return Response.json({ error: '이름, 이메일, 비밀번호를 모두 입력해주세요.' }, { status: 400 })
    }
    if (password.length < 6) {
      return Response.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
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
      .prepare('INSERT INTO users (id, dojang_id, email, password_hash, name, role, created_at) VALUES (?, NULL, ?, ?, ?, ?, ?)')
      .bind(userId, normalizedEmail, pwHash, name, 'platform_manager', now)
      .run()

    return Response.json({ ok: true, manager: { id: userId, name, email: normalizedEmail, role: 'platform_manager', created_at: now } }, { status: 201 })
  } catch (err) {
    captureException(err, { route: 'POST /api/admin/platform-managers' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}

// DELETE /api/admin/platform-managers?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const me = await authFromRequest()
    if (!me || me.role !== 'platform_manager') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return Response.json({ error: 'id가 필요합니다.' }, { status: 400 })

    // 자기 자신은 삭제 불가
    if (id === me.userId) {
      return Response.json({ error: '자신의 계정은 삭제할 수 없습니다.' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const target = await db
      .prepare('SELECT id, role FROM users WHERE id = ? AND role = ?')
      .bind(id, 'platform_manager')
      .first()

    if (!target) return Response.json({ error: '해당 계정을 찾을 수 없습니다.' }, { status: 404 })

    await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
    return Response.json({ ok: true })
  } catch (err) {
    captureException(err, { route: 'DELETE /api/admin/platform-managers' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}
