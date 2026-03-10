'use client'

import { useState, useEffect, useCallback } from 'react'
import { BELT_LIST } from '@/lib/constants'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import StudentModal from '@/components/students/StudentModal'
import type { Student } from '@/types/student'
import { useI18n } from '@/lib/i18n'

const BELT_COLORS: Record<string, string> = {
  '흰띠':  'bg-gray-100 text-gray-700',
  '노란띠': 'bg-yellow-100 text-yellow-700',
  '초록띠': 'bg-green-100 text-green-700',
  '파란띠': 'bg-blue-100 text-blue-700',
  '빨간띠': 'bg-red-100 text-red-700',
  '검은띠': 'bg-gray-800 text-white',
}

export default function StudentsPage() {
  const { t } = useI18n()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [beltFilter, setBeltFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status: 'active' })
      if (beltFilter) params.set('belt', beltFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/students?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '불러오기 실패')
      setStudents(data.students ?? [])
    } catch (err) {
      captureException(err, { action: 'fetch_students' })
      setError('원생 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [beltFilter, search])

  useEffect(() => {
    const timer = setTimeout(fetchStudents, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchStudents, search])

  async function handleDelete(id: string) {
    if (!confirm('이 원생을 삭제하시겠습니까? 출석 기록은 유지됩니다.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStudents((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      captureException(err, { action: 'delete_student', id })
      alert('삭제에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setDeletingId(null)
    }
  }

  function openCreate() { setEditingStudent(null); setShowModal(true) }
  function openEdit(s: Student) { setEditingStudent(s); setShowModal(true) }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">{t('dash.nav.students')}</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          <span>+</span> {t('dash.addStudent')}
        </button>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dash.search')}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <select
          value={beltFilter}
          onChange={(e) => setBeltFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
        >
          <option value="">{t('dash.all')}</option>
          {BELT_LIST.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* 본문 */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} retry={fetchStudents} />
      ) : students.length === 0 ? (
        <EmptyState
          icon="👥"
          title="등록된 원생이 없습니다"
          description={search || beltFilter ? '검색 조건에 맞는 원생이 없습니다.' : '첫 번째 원생을 등록해보세요.'}
          ctaLabel={(!search && !beltFilter) ? '원생 등록하기' : undefined}
          ctaHref={(!search && !beltFilter) ? undefined : undefined}
        />
      ) : (
        <>
          {/* 데스크탑: 테이블 */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[t('dash.name'), '띠', t('dash.contact'), t('dash.contact'), t('dash.joinDate'), ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BELT_COLORS[s.belt] ?? 'bg-gray-100 text-gray-600'}`}>
                        {s.belt}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.parent_phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{s.joined_at.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          {t('dash.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {t('dash.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 카드 */}
          <div className="md:hidden space-y-3">
            {students.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.joined_at.slice(0, 10)} 등록</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BELT_COLORS[s.belt] ?? 'bg-gray-100 text-gray-600'}`}>
                    {s.belt}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-500 mb-3">
                  {s.phone && <p>📱 {s.phone}</p>}
                  {s.parent_phone && <p>👨‍👩‍👧 {s.parent_phone}</p>}
                  {s.memo && <p className="text-xs text-gray-400 truncate">📝 {s.memo}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {t('dash.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="flex-1 py-2 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {t('dash.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-400 text-right">총 {students.length}명</p>
        </>
      )}

      {/* 모달 */}
      {showModal && (
        <StudentModal
          student={editingStudent}
          onClose={() => setShowModal(false)}
          onSuccess={fetchStudents}
        />
      )}
    </div>
  )
}
