import { NextRequest } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { SignJWT } from 'jose'
import { nanoid } from 'nanoid'
import { captureException } from '@/lib/sentry'

const RegisterSchema = z.object({
  dojang_name: z.string().min(1, '도장명을 입력해주세요.').max(50),
  owner_name:  z.string().min(1, '관장명을 입력해주세요.').max(30),
  email:       z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password:    z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
  phone:       z.string().max(20).optional(),
  region:      z.string().max(20).optional(),
})

// POST /api/auth/register — 도장 회원가입
export async function POST(req: NextRequest) {
  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) throw new Error('JWT_SECRET is not configured')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) {
      return Response.json(
        { error: '데이터베이스에 연결할 수 없습니다. wrangler dev로 실행해주세요.' },
        { status: 503 },
      )
    }

    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { dojang_name, owner_name, email, password, phone, region } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    // 이메일 중복 체크
    const existing = await db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(normalizedEmail)
      .first()
    if (existing) {
      return Response.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 })
    }

    const now       = new Date().toISOString()
    const dojangId  = nanoid()
    const userId    = nanoid()
    const pwHash    = await hash(password, 10)

    // 도장 생성
    await db
      .prepare(
        'INSERT INTO dojangs (id, name, owner_name, phone, region, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(dojangId, dojang_name, owner_name, phone ?? null, region ?? null, 'free', now, now)
      .run()

    // 관리자 계정 생성
    await db
      .prepare(
        'INSERT INTO users (id, dojang_id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(userId, dojangId, normalizedEmail, pwHash, owner_name, 'owner', now)
      .run()

    // JWT 발급
    const secret = new TextEncoder().encode(jwtSecret)
    const token  = await new SignJWT({
      userId,
      dojanId: dojangId,
      role:    'owner',
      name:    owner_name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    const res = Response.json({ ok: true }, { status: 201 })
    res.headers.set(
      'Set-Cookie',
      `genomic_session=${token}; Path=/; Domain=.genomic.cc; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    )

    return res
  } catch (error) {
    captureException(error, { route: 'POST /api/auth/register' })
    return Response.json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }
}
