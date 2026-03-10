import { jwtVerify } from 'jose'

export interface JwtPayload {
  userId: string
  dojanId: string | null
  role: string
  name: string
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
