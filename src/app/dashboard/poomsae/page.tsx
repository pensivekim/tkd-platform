'use client'

import { useState, useEffect, useCallback } from 'react'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { useI18n } from '@/lib/i18n'
import { POOMSAE_LIST } from '@/lib/poomsae-data'
import type { PoomsaeResult } from '@/app/api/poomsae/result/route'

type SortKey = 'created_at' | 'total_score'
type Student = { id: string; name: string; belt: string }

const SCORE_COLOR = (s: number) =>
  s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-500'

const SCORE_BG = (s: number) =>
  s >= 80 ? 'bg-green-50 border-green-200' : s >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'

// ── 5항목 바 차트 모달 ────────────────────────────────────────
function DetailModal({ result, onClose }: { result: PoomsaeResult; onClose: () => void }) {
  const { t } = useI18n()
  const items = [
    { label: t('poomsae.accuracy'),     value: result.accuracy ?? 0,     color: 'bg-red-500' },
    { label: t('poomsae.symmetry'),     value: result.symmetry ?? 0,     color: 'bg-yellow-500' },
    { label: t('poomsae.stability'),    value: result.stability ?? 0,    color: 'bg-sky-400' },
    { label: t('poomsae.timing'),       value: result.timing ?? 0,       color: 'bg-green-500' },
    { label: t('poomsae.completeness'), value: result.completeness ?? 0, color: 'bg-purple-500' },
  ]
  const scoreColor = result.total_score >= 80 ? 'text-green-500' : result.total_score >= 60 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-gray-900">{result.poomsae_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{result.student_name} · {new Date(result.created_at).toLocaleDateString()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label={t('dash.cancel')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 총점 */}
        <div className="text-center mb-6">
          <span className={`text-6xl font-black ${scoreColor}`}>{Math.round(result.total_score)}</span>
          <span className="text-gray-400 text-base ml-1">/100</span>
          {result.duration_seconds != null && (
            <p className="text-xs text-gray-400 mt-1">{t('poomsae.duration')}: {result.duration_seconds}{t('poomsae.seconds')}</p>
          )}
        </div>

        {/* 5항목 바 */}
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{item.label}</span>
                <span className="font-semibold text-gray-700">{Math.round(item.value)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 연습 요청 모달 ─────────────────────────────────────────────
function InviteModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const [students,    setStudents]    = useState<Student[]>([])
  const [studentId,   setStudentId]   = useState('')
  const [poomsaeId,   setPoomsaeId]   = useState(POOMSAE_LIST[0].id)
  const [message,     setMessage]     = useState('')
  const [isLoading,   setIsLoading]   = useState(true)
  const [isCreating,  setIsCreating]  = useState(false)
  const [inviteUrl,   setInviteUrl]   = useState<string | null>(null)
  const [copied,      setCopied]      = useState(false)

  useEffect(() => {
    fetch('/api/students?status=active&limit=200')
      .then(r => r.json())
      .then((d: { students?: Student[] }) => { setStudents(d.students ?? []); if (d.students?.[0]) setStudentId(d.students[0].id) })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  async function handleCreate() {
    if (!studentId || !poomsaeId) return
    setIsCreating(true)
    try {
      const res  = await fetch('/api/poomsae/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ student_id: studentId, poomsae_id: poomsaeId, message: message.trim() || undefined }),
      })
      const data = await res.json() as { invite_url?: string; error?: string }
      if (!res.ok) { alert(data.error ?? t('common.error')); return }
      setInviteUrl(data.invite_url ?? null)
    } catch {
      alert(t('common.error'))
    } finally {
      setIsCreating(false)
    }
  }

  function handleCopy() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl).catch(() => alert(`${inviteUrl}`))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{t('poomsae.sendPracticeRequest')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" aria-label={t('dash.cancel')}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {inviteUrl ? (
            /* 링크 생성 완료 */
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🔗</div>
                <p className="font-semibold text-gray-900">{t('poomsae.linkCreated')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('poomsae.linkValidDays')}</p>
              </div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 min-w-0"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
                    copied ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {copied ? `✓ ${t('poomsae.copied')}` : t('poomsae.copy')}
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('dash.cancel')}
              </button>
            </div>
          ) : (
            /* 입력 폼 */
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('poomsae.selectStudent')} <span className="text-red-500">*</span></label>
                {isLoading ? (
                  <div className="py-2 text-sm text-gray-400">{t('common.loading')}</div>
                ) : (
                  <select
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.belt})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('poomsae.selectPoomsae')} <span className="text-red-500">*</span></label>
                <select
                  value={poomsaeId}
                  onChange={e => setPoomsaeId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {POOMSAE_LIST.map(p => (
                    <option key={p.id} value={p.id}>{p.nameKo} ({p.level})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('poomsae.messageOptional')}</label>
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('dash.cancel')}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!studentId || isCreating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {isCreating ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('poomsae.creating')}</>
                  ) : `🔗 ${t('poomsae.createLink')}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 요약 카드 ───────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────────────────
export default function PoomsaeDashboard() {
  const { t } = useI18n()
  const [results,    setResults]    = useState<PoomsaeResult[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [sortKey,    setSortKey]    = useState<SortKey>('created_at')
  const [filterName, setFilterName] = useState('')
  const [filterPoomsae, setFilterPoomsae] = useState('')
  const [selected,   setSelected]   = useState<PoomsaeResult | null>(null)
  const [total,      setTotal]      = useState(0)
  const [showInvite, setShowInvite] = useState(false)

  const fetchResults = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/poomsae/result?limit=200')
      const data = await res.json() as { results?: PoomsaeResult[]; total?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? '조회 실패')
      setResults(data.results ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      captureException(err, { action: 'fetch_poomsae_results' })
      setError(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchResults() }, [fetchResults])

  // 필터 + 정렬
  const filtered = results
    .filter(r =>
      (!filterName    || r.student_name.includes(filterName))  &&
      (!filterPoomsae || r.poomsae_id   === filterPoomsae)
    )
    .sort((a, b) =>
      sortKey === 'total_score'
        ? b.total_score - a.total_score
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  // 요약 통계
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.total_score, 0) / results.length)
    : 0
  const maxScore = results.length
    ? Math.round(Math.max(...results.map(r => r.total_score)))
    : 0
  const topPoomsae = results.length
    ? Object.entries(
        results.reduce((acc, r) => { acc[r.poomsae_name] = (acc[r.poomsae_name] ?? 0) + 1; return acc }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'
    : '-'

  const poomsaeList = [...new Set(results.map(r => r.poomsae_id))]
    .map(id => results.find(r => r.poomsae_id === id)!)
    .map(r => ({ id: r.poomsae_id, name: r.poomsae_name }))

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">{t('poomsae.records')}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{t('dash.all')} {total}</span>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('poomsae.requestPractice')}
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label={t('poomsae.totalPractice')}   value={`${total}`} />
        <StatCard label={t('poomsae.avgScoreLabel')}   value={avgScore}   sub="/100" />
        <StatCard label={t('poomsae.highScore')}       value={maxScore}   sub="/100" />
        <StatCard label={t('poomsae.mostPracticed')}   value={topPoomsae} />
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder={t('poomsae.searchStudent')}
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-36"
        />
        <select
          value={filterPoomsae}
          onChange={e => setFilterPoomsae(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        >
          <option value="">{t('poomsae.allPoomsae')}</option>
          {poomsaeList.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setSortKey('created_at')}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              sortKey === 'created_at' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('poomsae.sortRecent')}
          </button>
          <button
            onClick={() => setSortKey('total_score')}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              sortKey === 'total_score' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('poomsae.sortScore')}
          </button>
        </div>
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} retry={fetchResults} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🥋"
          title={t('poomsae.noRecords')}
          description={t('poomsae.noRecordsDesc')}
        />
      ) : (
        <>
          {/* 데스크탑 테이블 */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                  <th className="text-left px-4 py-3">{t('dash.name')}</th>
                  <th className="text-left px-4 py-3">{t('poomsae.title')}</th>
                  <th className="text-center px-4 py-3">{t('poomsae.totalScore')}</th>
                  <th className="text-center px-4 py-3">{t('poomsae.accuracy')}</th>
                  <th className="text-center px-4 py-3">{t('poomsae.symmetry')}</th>
                  <th className="text-center px-4 py-3">{t('poomsae.stability')}</th>
                  <th className="text-left px-4 py-3">{t('dash.date')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">{r.student_name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.poomsae_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-black text-base ${SCORE_COLOR(r.total_score)}`}>
                        {Math.round(r.total_score)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{Math.round(r.accuracy ?? 0)}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{Math.round(r.symmetry ?? 0)}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{Math.round(r.stability ?? 0)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="sm:hidden space-y-3">
            {filtered.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelected(r)}
                className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer ${SCORE_BG(r.total_score)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{r.student_name}</span>
                  <span className={`font-black text-xl ${SCORE_COLOR(r.total_score)}`}>
                    {Math.round(r.total_score)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{r.poomsae_name}</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 상세 모달 */}
      {selected && <DetailModal result={selected} onClose={() => setSelected(null)} />}

      {/* 연습 요청 모달 */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}
