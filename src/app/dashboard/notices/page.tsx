'use client'

import { useState, useEffect, useCallback } from 'react'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import NoticeModal from '@/components/notices/NoticeModal'
import type { Notice } from '@/types/notice'

export default function NoticesPage() {
  const [notices, setNotices]             = useState<Notice[]>([])
  const [isLoading, setIsLoading]         = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [showModal, setShowModal]         = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)

  const fetchNotices = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/notices')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '불러오기 실패')
      setNotices(data.notices ?? [])
    } catch (err) {
      captureException(err, { action: 'fetch_notices' })
      setError('공지사항을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotices() }, [fetchNotices])

  async function handleDelete(id: string) {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return
    setDeletingId(id)
    try {
      const res  = await fetch(`/api/notices/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNotices((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      captureException(err, { action: 'delete_notice', id })
      alert('삭제에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setDeletingId(null)
    }
  }

  function openCreate() { setEditingNotice(null); setShowModal(true) }
  function openEdit(n: Notice) { setEditingNotice(n); setShowModal(true) }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">공지사항</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          <span>+</span> 공지 등록
        </button>
      </div>

      {/* 본문 */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} retry={fetchNotices} />
      ) : notices.length === 0 ? (
        <EmptyState
          icon="📢"
          title="등록된 공지사항이 없습니다"
          description="첫 번째 공지사항을 등록해보세요."
        />
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 md:p-5 ${
                notice.is_pinned ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
              }`}
            >
              {/* 제목 행 */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {!!notice.is_pinned && (
                    <span className="text-red-500 text-sm flex-shrink-0" aria-label="고정 공지">📌</span>
                  )}
                  <h3
                    className="font-semibold text-gray-900 truncate"
                    style={{ wordBreak: 'keep-all' }}
                  >
                    {notice.title}
                  </h3>
                </div>
                {/* 액션 버튼 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(notice)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    disabled={deletingId === notice.id}
                    className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === notice.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>

              {/* 내용 미리보기 */}
              <p
                className="text-sm text-gray-600 line-clamp-2 leading-relaxed"
                style={{ wordBreak: 'keep-all' }}
              >
                {notice.content}
              </p>

              {/* 등록일 */}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
                {notice.updated_at !== notice.created_at && ' (수정됨)'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <NoticeModal
          notice={editingNotice}
          onClose={() => setShowModal(false)}
          onSuccess={fetchNotices}
        />
      )}
    </div>
  )
}
