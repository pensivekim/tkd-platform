import { NextRequest } from 'next/server'
import { getDB, getR2, getAI } from '@/lib/db'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string }> }

// 코사인 유사도 계산
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

// resnet-50 결과를 벡터로 변환 (label hash + score)
function embeddingFromResults(results: { label: string; score: number }[]): number[] {
  return results.map((r) => r.score)
}

// POST /api/albums/[id]/classify — 앨범 일괄 AI 분류
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id: albumId } = await params
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })
    const r2 = await getR2()
    if (!r2) return Response.json({ error: 'R2를 사용할 수 없습니다.' }, { status: 503 })
    const ai = await getAI()
    if (!ai) return Response.json({ error: 'Cloudflare AI를 사용할 수 없습니다.' }, { status: 503 })

    const album = await db
      .prepare('SELECT id FROM albums WHERE id = ? AND dojang_id = ?')
      .bind(albumId, payload.dojanId)
      .first()
    if (!album) return Response.json({ error: '앨범을 찾을 수 없습니다.' }, { status: 404 })

    // 미분류 사진 목록
    const { results: unclassified } = await db
      .prepare('SELECT id, r2_key FROM photos WHERE album_id = ? AND student_id IS NULL')
      .bind(albumId)
      .all() as { results: { id: string; r2_key: string }[] }

    // 도장 원생 중 face_embedding 있는 것만
    const { results: students } = await db
      .prepare('SELECT id, name, face_embedding FROM students WHERE dojang_id = ? AND face_embedding IS NOT NULL AND status = ?')
      .bind(payload.dojanId, 'active')
      .all() as { results: { id: string; name: string; face_embedding: string }[] }

    if (!students?.length) {
      return Response.json({ classified: 0, unclassified: unclassified?.length ?? 0, message: '얼굴 등록된 원생이 없습니다.' })
    }

    // 원생 임베딩 파싱
    const studentVectors = students.map((s) => ({
      id:     s.id,
      vector: embeddingFromResults(JSON.parse(s.face_embedding)),
    }))

    let classified = 0
    const now = new Date().toISOString()

    for (const photo of (unclassified ?? [])) {
      try {
        // R2에서 사진 가져오기
        const obj = await r2.get(photo.r2_key)
        if (!obj) continue
        const arrayBuffer = await obj.arrayBuffer()
        const uint8 = new Uint8Array(arrayBuffer)

        // Cloudflare AI 분류
        const result = await ai.run('@cf/microsoft/resnet-50', { image: [...uint8] })
        if (!result?.results?.length) continue

        const photoVector = embeddingFromResults(result.results)

        // 원생별 유사도 계산
        let bestStudentId: string | null  = null
        let bestScore = 0
        for (const sv of studentVectors) {
          if (sv.vector.length !== photoVector.length) continue
          const sim = cosineSimilarity(photoVector, sv.vector)
          if (sim > bestScore) { bestScore = sim; bestStudentId = sv.id }
        }

        // 유사도 0.7 이상이면 분류
        if (bestStudentId && bestScore >= 0.7) {
          await db
            .prepare('UPDATE photos SET student_id = ?, face_confidence = ?, classified_at = ? WHERE id = ?')
            .bind(bestStudentId, bestScore, now, photo.id)
            .run()
          classified++
        }
      } catch (photoErr) {
        captureException(photoErr, { action: 'classify_photo', photoId: photo.id })
        // 개별 사진 실패는 계속 진행
      }
    }

    return Response.json({
      classified,
      unclassified: (unclassified?.length ?? 0) - classified,
    })
  } catch (error) {
    captureException(error, { route: 'POST /api/albums/[id]/classify' })
    return Response.json({ error: 'AI 분류에 실패했습니다.' }, { status: 500 })
  }
}
