import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export interface JwtPayload {
  userId: string
  dojanId: string | null
  role: string
  name: string
  isRoot?: boolean
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  const secret = process.env.JWT_SECRET
  if (!secret) return null

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

/** Route Handler에서 호출 — genomic_session 쿠키 자동 추출 + 검증 */
export async function authFromRequest(): Promise<JwtPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('genomic_session')?.value
  if (!token) return null
  return verifyJwt(token)
}
