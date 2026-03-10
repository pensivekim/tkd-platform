'use client'

import { useState, useEffect, useCallback } from 'react'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import type { PoomsaeResult } from '@/app/api/poomsae/result/route'

type SortKey = 'created_at' | 'total_score'

const SCORE_COLOR = (s: number) =>
  s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-500'

const SCORE_BG = (s: number) =>
  s >= 80 ? 'bg-green-50 border-green-200' : s >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'

// ── 5항목 바 차트 모달 ────────────────────────────────────────
function DetailModal({ result, onClose }: { result: PoomsaeResult; onClose: () => void }) {
  const items = [
    { label: '정확도', value: result.accuracy ?? 0,    color: 'bg-red-500' },
    { label: '대칭도', value: result.symmetry ?? 0,    color: 'bg-yellow-500' },
    { label: '안정성', value: result.stability ?? 0,   color: 'bg-sky-400' },
    { label: '타이밍', value: result.timing ?? 0,      color: 'bg-green-500' },
    { label: '완성도', value: result.completeness ?? 0, color: 'bg-purple-500' },
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
            <p className="text-xs text-gray-400 mt-0.5">{result.student_name} · {new Date(result.created_at).toLocaleDateString('ko-KR')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="닫기"
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
            <p className="text-xs text-gray-400 mt-1">소요 시간: {result.duration_seconds}초</p>
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
  const [results,    setResults]    = useState<PoomsaeResult[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [sortKey,    setSortKey]    = useState<SortKey>('created_at')
  const [filterName, setFilterName] = useState('')
  const [filterPoomsae, setFilterPoomsae] = useState('')
  const [selected,   setSelected]   = useState<PoomsaeResult | null>(null)
  const [total,      setTotal]      = useState(0)

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
      setError('품새 기록을 불러오지 못했습니다.')
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
        <h1 className="text-xl font-bold text-gray-900">품새 기록</h1>
        <span className="text-sm text-gray-400">총 {total}건</span>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="총 연습 횟수"   value={`${total}회`} />
        <StatCard label="평균 점수"      value={avgScore}   sub="/100" />
        <StatCard label="최고 점수"      value={maxScore}   sub="/100" />
        <StatCard label="최다 연습 품새" value={topPoomsae} />
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="학생명 검색"
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-36"
        />
        <select
          value={filterPoomsae}
          onChange={e => setFilterPoomsae(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        >
          <option value="">전체 품새</option>
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
            최신순
          </button>
          <button
            onClick={() => setSortKey('total_score')}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              sortKey === 'total_score' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            점수순
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
          title="품새 기록이 없습니다"
          description="원생들이 품새 연습을 완료하면 여기에 기록됩니다."
        />
      ) : (
        <>
          {/* 데스크탑 테이블 */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                  <th className="text-left px-4 py-3">학생</th>
                  <th className="text-left px-4 py-3">품새</th>
                  <th className="text-center px-4 py-3">총점</th>
                  <th className="text-center px-4 py-3">정확도</th>
                  <th className="text-center px-4 py-3">대칭도</th>
                  <th className="text-center px-4 py-3">안정성</th>
                  <th className="text-left px-4 py-3">날짜</th>
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
                      {new Date(r.created_at).toLocaleDateString('ko-KR')}
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
                  <span>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 상세 모달 */}
      {selected && <DetailModal result={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
