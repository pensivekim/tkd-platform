'use client'

import { useState, useEffect, useCallback } from 'react'
import { captureException } from '@/lib/sentry'
import { ATTENDANCE_TYPES } from '@/lib/constants'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import type { Student } from '@/types/student'
import type { AttendanceType } from '@/lib/constants'
import type { Attendance } from '@/types/attendance'

// ATTENDANCE_TYPES 에서 AttendanceType 재정의 (타입 안전)
type AType = typeof ATTENDANCE_TYPES[number]

const TYPE_STYLE: Record<AType, { active: string; inactive: string; label: string }> = {
  '출석': { active: 'bg-green-500 text-white border-green-500',  inactive: 'border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-300', label: '출석' },
  '결석': { active: 'bg-red-500 text-white border-red-500',     inactive: 'border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-300',   label: '결석' },
  '조퇴': { active: 'bg-yellow-400 text-white border-yellow-400', inactive: 'border-gray-200 text-gray-500 hover:bg-yellow-50 hover:border-yellow-300', label: '조퇴' },
}

const toDateStr = (d: Date) => d.toISOString().slice(0, 10)

export default function AttendancePage() {
  const [date, setDate] = useState<string>(toDateStr(new Date()))
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Map<string, Attendance>>(new Map())
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  // 원생 목록 (최초 1회)
  const fetchStudents = useCallback(async () => {
    setIsLoadingStudents(true)
    setStudentsError(null)
    try {
      const res = await fetch('/api/students?status=active')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '원생 불러오기 실패')
      setStudents(data.students ?? [])
    } catch (err) {
      captureException(err, { action: 'fetch_students_for_attendance' })
      setStudentsError('원생 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoadingStudents(false)
    }
  }, [])

  // 선택 날짜 출석 기록
  const fetchAttendance = useCallback(async (d: string) => {
    setIsLoadingAttendance(true)
    setAttendanceError(null)
    try {
      const res = await fetch(`/api/attendance?date=${d}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '출석 불러오기 실패')
      const map = new Map<string, Attendance>()
      for (const record of (data.attendance ?? []) as Attendance[]) {
        map.set(record.student_id, record)
      }
      setAttendanceMap(map)
    } catch (err) {
      captureException(err, { action: 'fetch_attendance', date: d })
      setAttendanceError('출석 데이터를 불러오지 못했습니다.')
    } finally {
      setIsLoadingAttendance(false)
    }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => { fetchAttendance(date) }, [fetchAttendance, date])

  // 날짜 이동
  const moveDate = (delta: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    setDate(toDateStr(d))
  }

  // 출석 체크 (낙관적 업데이트)
  async function handleCheck(studentId: string, type: AType) {
    if (pendingIds.has(studentId)) return

    const prev = attendanceMap.get(studentId)

    // 같은 타입 클릭 → 삭제
    if (prev?.type === type) {
      setPendingIds((s) => new Set(s).add(studentId))
      // 낙관적: 즉시 제거
      setAttendanceMap((m) => { const next = new Map(m); next.delete(studentId); return next })
      try {
        const res = await fetch(`/api/attendance/${prev.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('삭제 실패')
      } catch (err) {
        captureException(err, { action: 'delete_attendance', id: prev.id })
        // 실패 시 롤백
        setAttendanceMap((m) => new Map(m).set(studentId, prev))
      } finally {
        setPendingIds((s) => { const next = new Set(s); next.delete(studentId); return next })
      }
      return
    }

    // 새로 체크 or 변경 → 낙관적 업데이트
    const optimistic: Attendance = {
      id: prev?.id ?? '__optimistic__',
      dojang_id: '',
      student_id: studentId,
      checked_at: new Date().toISOString(),
      type: type as AttendanceType,
      memo: null,
    }
    setPendingIds((s) => new Set(s).add(studentId))
    setAttendanceMap((m) => new Map(m).set(studentId, optimistic))

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '체크 실패')
      // 실제 레코드로 교체
      setAttendanceMap((m) => new Map(m).set(studentId, data.attendance))
    } catch (err) {
      captureException(err, { action: 'check_attendance', studentId })
      // 롤백
      setAttendanceMap((m) => {
        const next = new Map(m)
        if (prev) next.set(studentId, prev)
        else next.delete(studentId)
        return next
      })
    } finally {
      setPendingIds((s) => { const next = new Set(s); next.delete(studentId); return next })
    }
  }

  // 통계
  const stats = { '출석': 0, '결석': 0, '조퇴': 0 }
  for (const rec of attendanceMap.values()) {
    if (rec.type in stats) stats[rec.type as AType]++
  }

  const isToday = date === toDateStr(new Date())
  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div>
      {/* 헤더 */}
      <h1 className="text-xl font-bold text-gray-900 mb-5">출석 관리</h1>

      {/* 날짜 선택 */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-4">
        <button
          onClick={() => moveDate(-1)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="전날"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <p className="font-semibold text-gray-900 text-sm">{displayDate}</p>
          {isToday && (
            <span className="text-xs text-red-500 font-medium">오늘</span>
          )}
        </div>

        <button
          onClick={() => moveDate(1)}
          disabled={isToday}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="다음날"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {(Object.entries(stats) as [AType, number][]).map(([type, count]) => (
          <div key={type} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-2xl font-extrabold text-gray-900">{count}</p>
            <p className={`text-xs font-medium mt-0.5 ${
              type === '출석' ? 'text-green-600' :
              type === '결석' ? 'text-red-500' : 'text-yellow-500'
            }`}>{type}</p>
          </div>
        ))}
      </div>

      {/* 원생 출석 목록 */}
      {isLoadingStudents ? (
        <LoadingSpinner />
      ) : studentsError ? (
        <ErrorMessage message={studentsError} retry={fetchStudents} />
      ) : students.length === 0 ? (
        <EmptyState
          icon="👥"
          title="등록된 원생이 없습니다"
          description="먼저 원생을 등록해주세요."
          ctaLabel="원생 등록하러 가기"
          ctaHref="/dashboard/students"
        />
      ) : (
        <>
          {attendanceError && (
            <div className="mb-4">
              <ErrorMessage message={attendanceError} retry={() => fetchAttendance(date)} />
            </div>
          )}

          {isLoadingAttendance && (
            <div className="mb-3">
              <LoadingSpinner size="sm" />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {students.map((student) => {
              const record = attendanceMap.get(student.id)
              const isPending = pendingIds.has(student.id)

              return (
                <div
                  key={student.id}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-3 transition-opacity ${isPending ? 'opacity-60' : ''}`}
                >
                  {/* 원생 정보 */}
                  <div className="mb-3">
                    <p className="font-semibold text-gray-900 text-sm truncate">{student.name}</p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {student.belt}
                    </span>
                  </div>

                  {/* 출석 버튼 3개 */}
                  <div className="flex gap-1">
                    {ATTENDANCE_TYPES.map((type) => {
                      const isChecked = record?.type === type
                      const style = TYPE_STYLE[type]
                      return (
                        <button
                          key={type}
                          onClick={() => handleCheck(student.id, type)}
                          disabled={isPending}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            isChecked ? style.active : style.inactive
                          }`}
                        >
                          {style.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-xs text-gray-400 text-right">
            전체 {students.length}명 중 {attendanceMap.size}명 체크됨
          </p>
        </>
      )}
    </div>
  )
}
