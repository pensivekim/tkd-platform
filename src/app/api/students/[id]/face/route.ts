import { NextRequest } from 'next/server'
import { authFromRequest } from '@/lib/auth'
import { captureException } from '@/lib/sentry'

type Params = { params: Promise<{ id: string }> }

// POST /api/students/[id]/face — 얼굴 사진 업로드 + AI 임베딩 생성
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: studentId } = await params
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process as any).env?.DB as any
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r2 = (process as any).env?.PHOTOS as any
    if (!r2) return Response.json({ error: 'R2를 사용할 수 없습니다.' }, { status: 503 })

    const student = await db
      .prepare('SELECT id FROM students WHERE id = ? AND dojang_id = ?')
      .bind(studentId, payload.dojanId)
      .first()
    if (!student) return Response.json({ error: '원생을 찾을 수 없습니다.' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return Response.json({ error: '이미지 파일이 없습니다.' }, { status: 400 })

    // R2에 얼굴 사진 저장
    const r2Key      = `${payload.dojanId}/faces/${studentId}.jpg`
    const arrayBuffer = await file.arrayBuffer()
    await r2.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType: 'image/jpeg' },
    })

    // Cloudflare AI로 임베딩 생성
    let embeddingJson: string | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = (process as any).env?.AI as any
    if (ai) {
      try {
        const uint8 = new Uint8Array(arrayBuffer)
        // @cf/microsoft/resnet-50 은 분류 모델 — 상위 분류 스코어를 특징 벡터로 활용
        const result = await ai.run('@cf/microsoft/resnet-50', { image: [...uint8] })
        if (result?.results) {
          embeddingJson = JSON.stringify(result.results)
        }
      } catch (aiErr) {
        captureException(aiErr, { action: 'face_embedding', studentId })
        // AI 실패해도 사진 저장은 성공으로 처리
      }
    }

    const now = new Date().toISOString()
    await db
      .prepare('UPDATE students SET face_r2_key = ?, face_embedding = ?, updated_at = ? WHERE id = ?')
      .bind(r2Key, embeddingJson, now, studentId)
      .run()

    return Response.json({ ok: true, face_r2_key: r2Key, has_embedding: !!embeddingJson })
  } catch (error) {
    captureException(error, { route: 'POST /api/students/[id]/face' })
    return Response.json({ error: '얼굴 사진 등록에 실패했습니다.' }, { status: 500 })
  }
}
