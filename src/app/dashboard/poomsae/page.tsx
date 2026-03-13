'use client'

import { useState, useEffect, useCallback } from 'react'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { useI18n } from '@/lib/i18n'
import { POOMSAE_LIST } from '@/lib/poomsae-data'
import type { PoomsaeResult } from '@/app/api/poomsae/result/route'
import { Plus, Link2, X, Zap, Search } from 'lucide-react'

type SortKey = 'created_at' | 'total_score'
type Student = { id: string; name: string; belt: string }

const SCORE_COLOR = (s: number) =>
  s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-[#E63946]'

const SCORE_BG = (s: number) =>
  s >= 80
    ? 'bg-green-500/[0.06] border-green-500/20'
    : s >= 60
    ? 'bg-yellow-500/[0.06] border-yellow-500/20'
    : 'bg-[#E63946]/[0.06] border-[#E63946]/20'

// ── 상세 모달 ────────────────────────────────────────────────────
function DetailModal({ result, onClose }: { result: PoomsaeResult; onClose: () => void }) {
  const { t } = useI18n()
  const items = [
    { label: t('poomsae.accuracy'),     value: result.accuracy ?? 0,     color: 'bg-[#E63946]' },
    { label: t('poomsae.symmetry'),     value: result.symmetry ?? 0,     color: 'bg-yellow-500' },
    { label: t('poomsae.stability'),    value: result.stability ?? 0,    color: 'bg-sky-400' },
    { label: t('poomsae.timing'),       value: result.timing ?? 0,       color: 'bg-green-500' },
    { label: t('poomsae.completeness'), value: result.completeness ?? 0, color: 'bg-purple-500' },
  ]
  const scoreColor = SCORE_COLOR(result.total_score)

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#0E0E18] border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-[#F0F0F5]">{result.poomsae_name}</p>
            <p className="text-xs text-[#606070] mt-0.5">{result.student_name} · {new Date(result.created_at).toLocaleDateString()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#606070] hover:bg-white/[0.06] hover:text-[#F0F0F5] transition-colors cursor-pointer bg-transparent border-none"
            aria-label={t('dash.cancel')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-center mb-6">
          <span className={`text-6xl font-black ${scoreColor}`}>{Math.round(result.total_score)}</span>
          <span className="text-[#606070] text-base ml-1">/100</span>
          {result.duration_seconds != null && (
            <p className="text-xs text-[#606070] mt-1">{t('poomsae.duration')}: {result.duration_seconds}{t('poomsae.seconds')}</p>
          )}
        </div>

        <div className="space-y-3">
          {items.map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#606070]">{item.label}</span>
                <span className="font-semibold text-[#F0F0F5]">{Math.round(item.value)}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
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

// ── 연습 요청 모달 ────────────────────────────────────────────────
function InviteModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const [students,   setStudents]   = useState<Student[]>([])
  const [studentId,  setStudentId]  = useState('')
  const [poomsaeId,  setPoomsaeId]  = useState(POOMSAE_LIST[0].id)
  const [message,    setMessage]    = useState('')
  const [isLoading,  setIsLoading]  = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [inviteUrl,  setInviteUrl]  = useState<string | null>(null)
  const [copied,     setCopied]     = useState(false)

  const inputCls = 'w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-lg text-sm text-[#F0F0F5] placeholder:text-[#404050] focus:outline-none focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/20 transition-colors [&>option]:bg-[#0E0E18]'

  useEffect(() => {
    fetch('/api/students?status=active&limit=200')
      .then(r => r.json())
      .then((d: { students?: Student[] }) => {
        setStudents(d.students ?? [])
        if (d.students?.[0]) setStudentId(d.students[0].id)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  async function handleCreate() {
    if (!studentId || !poomsaeId) return
    setIsCreating(true)
    try {
      const res  = await fetch('/api/poomsae/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, poomsae_id: poomsaeId, message: message.trim() || undefined }),
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
    navigator.clipboard.writeText(inviteUrl).catch(() => alert(inviteUrl))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#0E0E18] border border-white/[0.1] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] sticky top-0 bg-[#0E0E18]">
          <h2 className="font-bold text-[#F0F0F5]">{t('poomsae.sendPracticeRequest')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#606070] hover:bg-white/[0.06] hover:text-[#F0F0F5] transition-colors cursor-pointer bg-transparent border-none">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {inviteUrl ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto mb-3">
                  <Link2 size={20} className="text-green-400" />
                </div>
                <p className="font-semibold text-[#F0F0F5]">{t('poomsae.linkCreated')}</p>
                <p className="text-xs text-[#606070] mt-1">{t('poomsae.linkValidDays')}</p>
              </div>
              <div className="flex gap-2">
                <input readOnly value={inviteUrl} className={`${inputCls} flex-1 min-w-0`} />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 cursor-pointer border-none ${
                    copied ? 'bg-green-500 text-white' : 'bg-[#E63946] hover:bg-[#C53030] text-white'
                  }`}
                >
                  {copied ? `✓ ${t('poomsae.copied')}` : t('poomsae.copy')}
                </button>
              </div>
              <button onClick={onClose} className="w-full py-2.5 border border-white/[0.1] text-[#909098] text-sm rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer bg-transparent">
                {t('dash.cancel')}
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#909098] mb-1.5">{t('poomsae.selectStudent')} <span className="text-[#E63946]">*</span></label>
                {isLoading ? (
                  <p className="text-sm text-[#606070]">{t('common.loading')}</p>
                ) : (
                  <select value={studentId} onChange={e => setStudentId(e.target.value)} className={inputCls}>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.belt})</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#909098] mb-1.5">{t('poomsae.selectPoomsae')} <span className="text-[#E63946]">*</span></label>
                <select value={poomsaeId} onChange={e => setPoomsaeId(e.target.value)} className={inputCls}>
                  {POOMSAE_LIST.map(p => <option key={p.id} value={p.id}>{p.nameKo} ({p.level})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#909098] mb-1.5">{t('poomsae.messageOptional')}</label>
                <input type="text" value={message} onChange={e => setMessage(e.target.value)} maxLength={100} className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-2.5 border border-white/[0.1] text-[#909098] text-sm font-medium rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer bg-transparent">
                  {t('dash.cancel')}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!studentId || isCreating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer border-none"
                >
                  {isCreating ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('poomsae.creating')}</>
                  ) : t('poomsae.createLink')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 요약 카드 ────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#0E0E18] border border-white/[0.07] rounded-2xl p-4">
      <p className="text-xs text-[#606070] mb-1">{label}</p>
      <p className="text-2xl font-black text-[#F0F0F5]">{value}</p>
      {sub && <p className="text-xs text-[#606070] mt-0.5">{sub}</p>}
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────────────────
export default function PoomsaeDashboard() {
  const { t } = useI18n()
  const [results,      setResults]      = useState<PoomsaeResult[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [sortKey,      setSortKey]      = useState<SortKey>('created_at')
  const [filterName,   setFilterName]   = useState('')
  const [filterPoomsae, setFilterPoomsae] = useState('')
  const [selected,     setSelected]     = useState<PoomsaeResult | null>(null)
  const [total,        setTotal]        = useState(0)
  const [showInvite,   setShowInvite]   = useState(false)

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

  const filtered = results
    .filter(r =>
      (!filterName     || r.student_name.includes(filterName)) &&
      (!filterPoomsae  || r.poomsae_id === filterPoomsae)
    )
    .sort((a, b) =>
      sortKey === 'total_score'
        ? b.total_score - a.total_score
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  const avgScore   = results.length ? Math.round(results.reduce((s, r) => s + r.total_score, 0) / results.length) : 0
  const maxScore   = results.length ? Math.round(Math.max(...results.map(r => r.total_score))) : 0
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
        <h1 className="text-xl font-bold text-[#F0F0F5]">{t('poomsae.records')}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#606070]">{t('dash.all')} {total}</span>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
          >
            <Plus size={15} strokeWidth={2.5} />
            {t('poomsae.requestPractice')}
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label={t('poomsae.totalPractice')} value={`${total}`} />
        <StatCard label={t('poomsae.avgScoreLabel')} value={avgScore}   sub="/100" />
        <StatCard label={t('poomsae.highScore')}     value={maxScore}   sub="/100" />
        <StatCard label={t('poomsae.mostPracticed')} value={topPoomsae} />
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]" />
          <input
            type="text"
            placeholder={t('poomsae.searchStudent')}
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            className="pl-8 pr-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-[#F0F0F5] placeholder:text-[#404050] focus:outline-none focus:border-[#E63946] w-36 transition-colors"
          />
        </div>
        <select
          value={filterPoomsae}
          onChange={e => setFilterPoomsae(e.target.value)}
          className="px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-[#F0F0F5] focus:outline-none focus:border-[#E63946] transition-colors [&>option]:bg-[#0E0E18]"
        >
          <option value="">{t('poomsae.allPoomsae')}</option>
          {poomsaeList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          {(['created_at', 'total_score'] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer border-none ${
                sortKey === key
                  ? 'bg-[#E63946] text-white'
                  : 'bg-white/[0.05] text-[#909098] hover:bg-white/[0.09]'
              }`}
            >
              {key === 'created_at' ? t('poomsae.sortRecent') : t('poomsae.sortScore')}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} retry={fetchResults} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Zap size={22} className="text-[#606070]" />}
          title={t('poomsae.noRecords')}
          description={t('poomsae.noRecordsDesc')}
        />
      ) : (
        <>
          {/* 데스크탑 테이블 */}
          <div className="hidden sm:block bg-[#0E0E18] border border-white/[0.07] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-[11px] text-[#606070] font-semibold uppercase tracking-wider">
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
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-[#F0F0F5]">{r.student_name}</td>
                    <td className="px-4 py-3 text-[#909098]">{r.poomsae_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-black text-base ${SCORE_COLOR(r.total_score)}`}>
                        {Math.round(r.total_score)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#606070]">{Math.round(r.accuracy ?? 0)}</td>
                    <td className="px-4 py-3 text-center text-[#606070]">{Math.round(r.symmetry ?? 0)}</td>
                    <td className="px-4 py-3 text-center text-[#606070]">{Math.round(r.stability ?? 0)}</td>
                    <td className="px-4 py-3 text-xs text-[#606070]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="sm:hidden space-y-2.5">
            {filtered.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelected(r)}
                className={`rounded-2xl border p-4 cursor-pointer ${SCORE_BG(r.total_score)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#F0F0F5] text-sm">{r.student_name}</span>
                  <span className={`font-black text-xl ${SCORE_COLOR(r.total_score)}`}>
                    {Math.round(r.total_score)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#606070]">
                  <span>{r.poomsae_name}</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selected    && <DetailModal result={selected} onClose={() => setSelected(null)} />}
      {showInvite  && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}
