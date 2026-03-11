import { authFromRequest } from '@/lib/auth'
import { getDB } from '@/lib/db'
import { captureException } from '@/lib/sentry'

// GET /api/dashboard/stats — 대시보드 통계
export async function GET() {
  try {
    const payload = await authFromRequest()
    if (!payload)         return Response.json({ error: '인증이 필요합니다.' }, { status: 401 })
    if (!payload.dojanId) return Response.json({ error: '도장 정보가 없습니다.' }, { status: 403 })

    const db = await getDB()
    if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const monthStart = today.slice(0, 7) + '-01'        // YYYY-MM-01

    const [totalStudentsRow, todayAttendanceRow, monthlyNewRow, totalNoticesRow] = await Promise.all([
      db
        .prepare("SELECT COUNT(*) AS cnt FROM students WHERE dojang_id = ? AND status = 'active'")
        .bind(payload.dojanId)
        .first(),
      db
        .prepare("SELECT COUNT(*) AS cnt FROM attendance WHERE dojang_id = ? AND date = ? AND type = '출석'")
        .bind(payload.dojanId, today)
        .first(),
      db
        .prepare("SELECT COUNT(*) AS cnt FROM students WHERE dojang_id = ? AND created_at >= ? AND status = 'active'")
        .bind(payload.dojanId, monthStart)
        .first(),
      db
        .prepare('SELECT COUNT(*) AS cnt FROM notices WHERE dojang_id = ?')
        .bind(payload.dojanId)
        .first(),
    ])

    return Response.json({
      totalStudents:       (totalStudentsRow  as any)?.cnt ?? 0,
      todayAttendance:     (todayAttendanceRow as any)?.cnt ?? 0,
      monthlyNewStudents:  (monthlyNewRow      as any)?.cnt ?? 0,
      totalNotices:        (totalNoticesRow    as any)?.cnt ?? 0,
    })
  } catch (error) {
    captureException(error, { route: 'GET /api/dashboard/stats' })
    return Response.json({ error: '통계를 불러오는 데 실패했습니다.' }, { status: 500 })
  }
}
