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
import { Users, Search, Plus } from 'lucide-react'

const BELT_COLORS: Record<string, string> = {
  '흰띠':  'bg-white/[0.08] text-[#D0D0D8]',
  '노란띠': 'bg-yellow-500/15 text-yellow-400',
  '초록띠': 'bg-green-500/15 text-green-400',
  '파란띠': 'bg-blue-500/15 text-blue-400',
  '빨간띠': 'bg-red-500/15 text-red-400',
  '검은띠': 'bg-white/[0.12] text-[#F0F0F5]',
}

function GradeBadge({ s }: { s: Student }) {
  if (!s.grade_type || !s.dan_grade) return null
  const label =
    s.grade_type === 'dan'  ? `${s.dan_grade}단` :
    s.grade_type === 'poom' ? `${s.dan_grade}품` :
                              `${s.dan_grade}급`
  const cls =
    s.grade_type === 'dan'  ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
    s.grade_type === 'poom' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
                              'bg-white/[0.06] text-[#909098] border border-white/[0.08]'
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
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
      alert('삭제에 실패했습니다.')
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
        <h1 className="text-xl font-bold text-[#F0F0F5]">{t('dash.nav.students')}</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
        >
          <Plus size={15} strokeWidth={2.5} />
          {t('dash.addStudent')}
        </button>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dash.search')}
            className="w-full pl-9 pr-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-[#F0F0F5] placeholder:text-[#404050] focus:outline-none focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/20 transition-colors"
          />
        </div>
        <select
          value={beltFilter}
          onChange={(e) => setBeltFilter(e.target.value)}
          className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-[#F0F0F5] focus:outline-none focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/20 transition-colors"
        >
          <option value="" className="bg-[#0E0E18]">{t('dash.all')}</option>
          {BELT_LIST.map((b) => <option key={b} value={b} className="bg-[#0E0E18]">{b}</option>)}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} retry={fetchStudents} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={<Users size={22} className="text-[#606070]" />}
          title="등록된 원생이 없습니다"
          description={search || beltFilter ? '검색 조건에 맞는 원생이 없습니다.' : '첫 번째 원생을 등록해보세요.'}
          ctaLabel={(!search && !beltFilter) ? '원생 등록하기' : undefined}
          onCta={(!search && !beltFilter) ? openCreate : undefined}
        />
      ) : (
        <>
          {/* 데스크탑: 테이블 */}
          <div className="hidden md:block bg-[#0E0E18] rounded-2xl border border-white/[0.07] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] border-b border-white/[0.07]">
                <tr>
                  {[t('dash.name'), '띠 / 등급', t('dash.contact'), '학부모 연락처', t('dash.joinDate'), ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold text-[#606070] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#F0F0F5]">{s.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BELT_COLORS[s.belt] ?? 'bg-white/[0.06] text-[#909098]'}`}>
                          {s.belt}
                        </span>
                        <GradeBadge s={s} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#606070]">{s.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-[#606070]">{s.parent_phone ?? '—'}</td>
                    <td className="px-4 py-3 text-[#606070]">{s.joined_at.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-xs px-3 py-1.5 border border-white/[0.1] rounded-lg text-[#909098] hover:bg-white/[0.06] hover:text-[#F0F0F5] transition-colors cursor-pointer bg-transparent"
                        >
                          {t('dash.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="text-xs px-3 py-1.5 border border-[#E63946]/20 rounded-lg text-[#E63946]/70 hover:bg-[#E63946]/[0.08] hover:text-[#E63946] transition-colors disabled:opacity-40 cursor-pointer bg-transparent"
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
          <div className="md:hidden space-y-2.5">
            {students.map((s) => (
              <div key={s.id} className="bg-[#0E0E18] rounded-2xl border border-white/[0.07] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-[#F0F0F5]">{s.name}</p>
                    <p className="text-xs text-[#606070] mt-0.5">{s.joined_at.slice(0, 10)} 등록</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BELT_COLORS[s.belt] ?? 'bg-white/[0.06] text-[#909098]'}`}>
                      {s.belt}
                    </span>
                    <GradeBadge s={s} />
                  </div>
                </div>
                <div className="space-y-1 text-sm text-[#606070] mb-3">
                  {s.phone && <p>{s.phone}</p>}
                  {s.parent_phone && <p className="text-xs">{s.parent_phone} (보호자)</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex-1 py-2 border border-white/[0.1] rounded-xl text-sm text-[#909098] hover:bg-white/[0.05] transition-colors cursor-pointer bg-transparent"
                  >
                    {t('dash.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="flex-1 py-2 border border-[#E63946]/20 rounded-xl text-sm text-[#E63946]/70 hover:bg-[#E63946]/[0.08] transition-colors disabled:opacity-40 cursor-pointer bg-transparent"
                  >
                    {t('dash.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-[#606070] text-right">총 {students.length}명</p>
        </>
      )}

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
