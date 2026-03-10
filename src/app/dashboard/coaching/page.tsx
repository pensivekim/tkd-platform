'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import CoachingModal from '@/components/coaching/CoachingModal'
import type { CoachingSession } from '@/types/coaching'

type StatusFilter = 'all' | 'waiting' | 'active' | 'ended'

const STATUS_LABEL: Record<string, string>  = { waiting: '대기중', active: '진행중', ended: '종료' }
const STATUS_COLOR: Record<string, string>  = {
  waiting: 'bg-yellow-100 text-yellow-700',
  active:  'bg-green-100  text-green-700',
  ended:   'bg-gray-100   text-gray-500',
}
const TYPE_LABEL:   Record<string, string>  = { individual: '1:1 개인', group: '그룹' }
const FILTER_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all',     label: '전체' },
  { id: 'waiting', label: '대기중' },
  { id: 'active',  label: '진행중' },
  { id: 'ended',   label: '종료' },
]

export default function CoachingPage() {
  const router = useRouter()
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
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'waiting' }),
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
        <h1 className="text-xl font-bold text-gray-900">라이브 코칭</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          세션 만들기
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === tab.id ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} retry={fetchSessions} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={filter === 'all' ? '첫 코칭 세션을 만들어보세요' : `${STATUS_LABEL[filter] ?? filter} 세션이 없습니다`}
          description="원생과 1:1 또는 그룹으로 라이브 코칭을 진행하세요."
          ctaLabel={filter === 'all' ? '세션 만들기' : undefined}
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
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${
                  isDeleting || isReopening ? 'opacity-50 pointer-events-none' : ''
                } ${!isEnded ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={() => !isEnded && router.push(`/dashboard/coaching/${session.id}/coach`)}
              >
                {/* 상단: 배지들 */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[session.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[session.status] ?? session.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    {TYPE_LABEL[session.type] ?? session.type}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">최대 {session.max_participants}명</span>
                </div>

                {/* 제목 */}
                <p className="font-semibold text-gray-900 text-sm mb-1 truncate" style={{ wordBreak: 'keep-all' }}>
                  {session.title}
                </p>
                {session.description && (
                  <p className="text-xs text-gray-400 mb-2 truncate">{session.description}</p>
                )}
                <p className="text-xs text-gray-400 mb-3">
                  {new Date(session.created_at).toLocaleDateString('ko-KR')}
                </p>

                {/* 버튼 영역 */}
                <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {/* 입장 버튼 */}
                  {!isEnded && (
                    <button
                      onClick={() => router.push(`/dashboard/coaching/${session.id}/coach`)}
                      className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors min-w-0"
                    >
                      입장
                    </button>
                  )}

                  {/* 초대 링크 복사 */}
                  {!isEnded && (
                    <button
                      onClick={(e) => handleCopyInvite(session, e)}
                      className="px-3 py-2 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                      title="초대 링크 복사"
                    >
                      {isCopied ? '✓' : '🔗'}
                    </button>
                  )}

                  {/* 다시 열기 */}
                  {isEnded && (
                    <button
                      onClick={(e) => handleReopen(session, e)}
                      className="flex-1 py-2 border border-yellow-300 text-yellow-700 text-xs font-medium rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                      {isReopening ? '처리 중...' : '다시 열기'}
                    </button>
                  )}

                  {/* 삭제 */}
                  <button
                    onClick={(e) => handleDelete(session, e)}
                    className="px-3 py-2 border border-red-200 text-red-400 text-xs rounded-lg hover:bg-red-50 transition-colors"
                    title="삭제"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <CoachingModal
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchSessions()}
        />
      )}
    </div>
  )
}
