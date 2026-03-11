import { NextRequest } from 'next/server'
import { getDB } from '@/lib/db'
import { z } from 'zod'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

const UpdateSchema = z.object({
  name:        z.string().min(1, '도장명을 입력해주세요.').max(50).optional(),
  owner_name:  z.string().min(1, '관장명을 입력해주세요.').max(30).optional(),
  phone:       z.string().max(20).optional(),
  address:     z.string().max(200).optional(),
  region:      z.string().max(20).optional(),
  city:        z.string().max(20).optional(),
  description: z.string().max(500).optional(),
})

// GET /api/settings/dojang — 도장 정보 조회
export async function GET() {
  try {
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const dojang = await db
      .prepare('SELECT id, name, owner_name, phone, address, region, city, description, plan, plan_expires_at FROM dojangs WHERE id = ?')
      .bind(payload.dojanId)
      .first()

    if (!dojang) return Response.json({ error: '도장 정보를 찾을 수 없습니다.' }, { status: 404 })

    const user = await db
      .prepare('SELECT name, email FROM users WHERE id = ?')
      .bind(payload.userId)
      .first()

    return Response.json({ dojang, user })
  } catch (error) {
    captureException(error, { route: 'GET /api/settings/dojang' })
    return Response.json({ error: '도장 정보를 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/settings/dojang — 도장 정보 수정
export async function PATCH(req: NextRequest) {
  try {
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const data = parsed.data
    const fields: string[]  = []
    const values: unknown[] = []

    if (data.name        !== undefined) { fields.push('name = ?');        values.push(data.name) }
    if (data.owner_name  !== undefined) { fields.push('owner_name = ?');  values.push(data.owner_name) }
    if (data.phone       !== undefined) { fields.push('phone = ?');       values.push(data.phone) }
    if (data.address     !== undefined) { fields.push('address = ?');     values.push(data.address) }
    if (data.region      !== undefined) { fields.push('region = ?');      values.push(data.region) }
    if (data.city        !== undefined) { fields.push('city = ?');        values.push(data.city) }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }

    if (fields.length === 0) return Response.json({ error: '변경할 내용이 없습니다.' }, { status: 400 })

    fields.push('updated_at = ?')
    values.push(new Date().toISOString(), payload.dojanId)

    await db
      .prepare(`UPDATE dojangs SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run()

    const dojang = await db
      .prepare('SELECT id, name, owner_name, phone, address, region, city, description, plan, plan_expires_at FROM dojangs WHERE id = ?')
      .bind(payload.dojanId)
      .first()

    return Response.json({ dojang })
  } catch (error) {
    captureException(error, { route: 'PATCH /api/settings/dojang' })
    return Response.json({ error: '도장 정보 저장에 실패했습니다.' }, { status: 500 })
  }
}
