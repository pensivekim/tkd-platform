import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { getDB } from '@/lib/db'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { captureException } from '@/lib/sentry'

// GET /api/admin/platform-managers — 자기 자신 제외한 부관리자 목록
export async function GET() {
  try {
    const me = await authFromRequest()
    if (!me || me.role !== 'platform_manager') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const { results } = await db
      .prepare('SELECT id, name, email, role, is_root, created_at FROM users WHERE role = ? AND id != ? ORDER BY created_at ASC')
      .bind('platform_manager', me.userId)
      .all()

    return Response.json({ managers: results })
  } catch (err) {
    captureException(err, { route: 'GET /api/admin/platform-managers' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST /api/admin/platform-managers — root만 부관리자 추가 가능
export async function POST(req: NextRequest) {
  try {
    const me = await authFromRequest()
    if (!me || me.role !== 'platform_manager') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
    if (!me.isRoot) {
      return Response.json({ error: '부관리자 추가는 최고관리자만 가능합니다.' }, { status: 403 })
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

    // 부관리자는 is_root = 0
    await db
      .prepare('INSERT INTO users (id, dojang_id, email, password_hash, name, role, is_root, created_at) VALUES (?, NULL, ?, ?, ?, ?, 0, ?)')
      .bind(userId, normalizedEmail, pwHash, name, 'platform_manager', now)
      .run()

    return Response.json({ ok: true, manager: { id: userId, name, email: normalizedEmail, role: 'platform_manager', is_root: 0, created_at: now } }, { status: 201 })
  } catch (err) {
    captureException(err, { route: 'POST /api/admin/platform-managers' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}

// DELETE /api/admin/platform-managers?id=xxx — root만 삭제 가능, is_root 계정 삭제 불가
export async function DELETE(req: NextRequest) {
  try {
    const me = await authFromRequest()
    if (!me || me.role !== 'platform_manager') {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
    if (!me.isRoot) {
      return Response.json({ error: '부관리자 삭제는 최고관리자만 가능합니다.' }, { status: 403 })
    }

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return Response.json({ error: 'id가 필요합니다.' }, { status: 400 })

    if (id === me.userId) {
      return Response.json({ error: '자신의 계정은 삭제할 수 없습니다.' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB 연결 실패' }, { status: 503 })

    const target = await db
      .prepare('SELECT id, is_root FROM users WHERE id = ? AND role = ?')
      .bind(id, 'platform_manager')
      .first<{ id: string; is_root: number }>()

    if (!target) return Response.json({ error: '해당 계정을 찾을 수 없습니다.' }, { status: 404 })
    if (target.is_root === 1) {
      return Response.json({ error: '최고관리자 계정은 삭제할 수 없습니다.' }, { status: 400 })
    }

    await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
    return Response.json({ ok: true })
  } catch (err) {
    captureException(err, { route: 'DELETE /api/admin/platform-managers' })
    return Response.json({ error: '서버 오류' }, { status: 500 })
  }
}
