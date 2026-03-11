import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'
import { captureException } from '@/lib/sentry'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return Response.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured')
    }

    // D1 바인딩은 Cloudflare 런타임에서만 가능
    // 로컬 개발 시 wrangler dev로 실행해야 env.DB 사용 가능
    const db = await getDB()
    if (!db) {
      return Response.json(
        { error: '데이터베이스에 연결할 수 없습니다. wrangler dev로 실행해주세요.' },
        { status: 503 },
      )
    }

    const user = await db
      .prepare('SELECT id, dojang_id, email, password_hash, name, role FROM users WHERE email = ?')
      .bind(email.toLowerCase().trim())
      .first() as {
        id: string
        dojang_id: string | null
        email: string
        password_hash: string
        name: string
        role: string
      } | null

    if (!user || !user.password_hash) {
      return Response.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    const passwordValid = await compare(password, user.password_hash)
    if (!passwordValid) {
      return Response.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(jwtSecret)
    const token = await new SignJWT({
      userId: user.id,
      dojanId: user.dojang_id,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    const res = Response.json({ ok: true, role: user.role })

    // genomic.cc 생태계 통합 로그인 쿠키
    res.headers.set(
      'Set-Cookie',
      `genomic_session=${token}; Path=/; Domain=.genomic.cc; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    )

    return res
  } catch (error) {
    captureException(error, { route: '/api/auth/login' })
    return Response.json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }
}
