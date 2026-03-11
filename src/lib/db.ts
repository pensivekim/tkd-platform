import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function getDB(): Promise<any> {
  const ctx = await getCloudflareContext({ async: true })
  const db = (ctx.env as any).DB
  if (!db) throw new Error('D1 DB binding not found')
  return db
}

export async function getR2(): Promise<any> {
  const ctx = await getCloudflareContext({ async: true })
  return (ctx.env as any).PHOTOS
}

export async function getAI(): Promise<any> {
  const ctx = await getCloudflareContext({ async: true })
  return (ctx.env as any).AI
}
