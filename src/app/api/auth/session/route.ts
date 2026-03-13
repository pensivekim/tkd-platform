import { authFromRequest } from '@/lib/auth'

export async function GET() {
  const me = await authFromRequest()
  if (!me) return Response.json({ loggedIn: false })
  return Response.json({ loggedIn: true, role: me.role })
}
