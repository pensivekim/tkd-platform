'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { captureException } from '@/lib/sentry'
import { useI18n } from '@/lib/i18n'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import CoachingModal from '@/components/coaching/CoachingModal'
import type { CoachingSession } from '@/types/coaching'
import { Plus, Video, Link2, Trash2, RefreshCw } from 'lucide-react'

type StatusFilter = 'all' | 'waiting' | 'active' | 'ended'

const STATUS_LABEL_KEYS: Record<string, string> = {
  waiting: 'coaching.pending',
  active:  'coaching.active',
  ended:   'coaching.completed',
}
const STATUS_COLOR: Record<string, string> = {
  waiting: 'bg-yellow-500/15 text-yellow-400',
  active:  'bg-green-500/15 text-green-400',
  ended:   'bg-white/[0.06] text-[#606070]',
}
const TYPE_LABEL_KEYS: Record<string, string> = {
  individual: 'coaching.individual',
  group:      'coaching.group',
}
const FILTER_TABS: { id: StatusFilter; tKey: string }[] = [
  { id: 'all',     tKey: 'coaching.all' },
  { id: 'waiting', tKey: 'coaching.pending' },
  { id: 'active',  tKey: 'coaching.active' },
  { id: 'ended',   tKey: 'coaching.completed' },
]

export default function CoachingPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [sessions,    setSessions]    = useState<CoachingSession[]>([])
  const [filter,      setFilter]      = useState<StatusFilter>('all')
  const [isLoading,   setIsLoading]   = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [showModal,   setShowModal]   = useState(false)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const [copiedId,    setCopiedId]    = useState<string | null>(null)
  const [reopeningId, setReopeningId] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/coaching')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '세션 불러오기 실패')
      setSessions(data.sessions ?? [])
    } catch (err) {
      captureException(err, { action: 'fetch_coaching_sessions' })
      setError('세션 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const filtered = filter === 'all' ? sessions : sessions.filter((s) => s.status === filter)

  async function handleDelete(session: CoachingSession, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`"${session.title}" 세션을 삭제할까요?`)) return
    setDeletingId(session.id)
    try {
      const res = await fetch(`/api/coaching/${session.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSessions((prev) => prev.filter((s) => s.id !== session.id))
    } catch (err) {
      captureException(err, { action: 'delete_coaching_session', sessionId: session.id })
      alert('삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleReopen(session: CoachingSession, e: React.MouseEvent) {
    e.stopPropagation()
    setReopeningId(session.id)
    try {
      const res  = await fetch(`/api/coaching/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'waiting' }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSessions((prev) => prev.map((s) => s.id === session.id ? data.session : s))
    } catch (err) {
      captureException(err, { action: 'reopen_coaching_session', sessionId: session.id })
      alert('다시 열기에 실패했습니다.')
    } finally {
      setReopeningId(null)
    }
  }

  async function handleCopyInvite(session: CoachingSession, e: React.MouseEvent) {
    e.stopPropagation()
    const url = `${window.location.origin}/coach/${session.invite_token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(session.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      alert(`초대 링크: ${url}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#F0F0F5]">{t('dash.nav.coaching')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
        >
          <Plus size={15} strokeWidth={2.5} />
          {t('coaching.createSession')}
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer border-none ${
              filter === tab.id
                ? 'bg-[#E63946] text-white'
                : 'bg-white/[0.05] text-[#909098] hover:bg-white/[0.09] hover:text-[#F0F0F5]'
            }`}
          >
            {t(tab.tKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} retry={fetchSessions} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Video size={22} className="text-[#606070]" />}
          title={filter === 'all' ? t('coaching.noSessions') : `${t(STATUS_LABEL_KEYS[filter] ?? '')} 세션이 없습니다`}
          description="원생과 1:1 또는 그룹으로 라이브 코칭을 진행하세요."
          ctaLabel={filter === 'all' ? t('coaching.createSession') : undefined}
          onCta={filter === 'all' ? () => setShowModal(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((session) => {
            const isDeleting  = deletingId  === session.id
            const isReopening = reopeningId === session.id
            const isCopied    = copiedId    === session.id
            const isEnded     = session.status === 'ended'
            return (
              <div
                key={session.id}
                className={`bg-[#0E0E18] border border-white/[0.07] rounded-2xl p-4 ${
                  isDeleting || isReopening ? 'opacity-50 pointer-events-none' : ''
                } ${!isEnded ? 'cursor-pointer hover:border-white/[0.12] transition-colors' : ''}`}
                onClick={() => !isEnded && router.push(`/dashboard/coaching/${session.id}/coach`)}
              >
                {/* 배지 */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[session.status] ?? 'bg-white/[0.06] text-[#606070]'}`}>
                    {t(STATUS_LABEL_KEYS[session.status] ?? 'coaching.active')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400">
                    {t(TYPE_LABEL_KEYS[session.type] ?? 'coaching.individual')}
                  </span>
                  <span className="text-xs text-[#606070] ml-auto">최대 {session.max_participants}명</span>
                </div>

                <p className="font-semibold text-[#F0F0F5] text-sm mb-1 truncate" style={{ wordBreak: 'keep-all' }}>
                  {session.title}
                </p>
                {session.description && (
                  <p className="text-xs text-[#606070] mb-1 truncate">{session.description}</p>
                )}
                <p className="text-xs text-[#606070] mb-4">
                  {new Date(session.created_at).toLocaleDateString('ko-KR')}
                </p>

                {/* 버튼 */}
                <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {!isEnded && (
                    <button
                      onClick={() => router.push(`/dashboard/coaching/${session.id}/coach`)}
                      className="flex-1 py-2 bg-[#E63946] hover:bg-[#C53030] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer border-none"
                    >
                      입장
                    </button>
                  )}
                  {!isEnded && (
                    <button
                      onClick={(e) => handleCopyInvite(session, e)}
                      className="p-2 border border-white/[0.1] text-[#606070] hover:text-[#F0F0F5] hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer bg-transparent"
                      title="초대 링크 복사"
                    >
                      <Link2 size={14} className={isCopied ? 'text-green-400' : ''} />
                    </button>
                  )}
                  {isEnded && (
                    <button
                      onClick={(e) => handleReopen(session, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-yellow-500/20 text-yellow-400 text-xs font-medium rounded-lg hover:bg-yellow-500/10 transition-colors cursor-pointer bg-transparent"
                    >
                      <RefreshCw size={12} className={isReopening ? 'animate-spin' : ''} />
                      {isReopening ? '처리 중...' : '다시 열기'}
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(session, e)}
                    className="p-2 border border-white/[0.1] text-[#606070] hover:text-[#E63946] hover:border-[#E63946]/20 hover:bg-[#E63946]/[0.08] rounded-lg transition-colors cursor-pointer bg-transparent"
                    title="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <CoachingModal onClose={() => setShowModal(false)} onSuccess={fetchSessions} />
      )}
    </div>
  )
}
