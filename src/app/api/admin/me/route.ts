import { authFromRequest } from '@/lib/auth'

export async function GET() {
  const me = await authFromRequest()
  if (!me || me.role !== 'platform_manager') {
    return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
  }
  return Response.json({ isRoot: !!me.isRoot, name: me.name })
}
