import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

const PasswordSchema = z.object({
  current_password: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
  new_password:     z.string().min(6, '새 비밀번호는 6자 이상이어야 합니다.'),
})

// PATCH /api/settings/password — 비밀번호 변경
export async function PATCH(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload) return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json()
    const parsed = PasswordSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const user = await db
      .prepare('SELECT id, password_hash FROM users WHERE id = ?')
      .bind(payload.userId)
      .first() as { id: string; password_hash: string } | null

    if (!user || !user.password_hash) {
      return Response.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const isValid = await bcrypt.compare(parsed.data.current_password, user.password_hash)
    if (!isValid) {
      return Response.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 400 })
    }

    const newHash = await bcrypt.hash(parsed.data.new_password, 10)
    await db
      .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(newHash, payload.userId)
      .run()

    return Response.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'PATCH /api/settings/password' })
    return Response.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 500 })
  }
}
