'use client'

import { useState, useEffect, useCallback } from 'react'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useI18n } from '@/lib/i18n'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import NoticeModal from '@/components/notices/NoticeModal'
import type { Notice } from '@/types/notice'
import { Bell, Plus, Pin } from 'lucide-react'

export default function NoticesPage() {
  const { t } = useI18n()
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
      alert('삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  function openCreate() { setEditingNotice(null); setShowModal(true) }
  function openEdit(n: Notice) { setEditingNotice(n); setShowModal(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#F0F0F5]">{t('dash.nav.notices')}</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
        >
          <Plus size={15} strokeWidth={2.5} />
          {t('dash.addNotice')}
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} retry={fetchNotices} />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} className="text-[#606070]" />}
          title="등록된 공지사항이 없습니다"
          description="첫 번째 공지사항을 등록해보세요."
          ctaLabel={t('dash.addNotice')}
          onCta={openCreate}
        />
      ) : (
        <div className="space-y-2.5">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`rounded-2xl border p-4 md:p-5 ${
                notice.is_pinned
                  ? 'bg-[#E63946]/[0.05] border-[#E63946]/20'
                  : 'bg-[#0E0E18] border-white/[0.07]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {!!notice.is_pinned && (
                    <Pin size={13} className="text-[#E63946] flex-shrink-0" />
                  )}
                  <h3
                    className="font-semibold text-[#F0F0F5] truncate"
                    style={{ wordBreak: 'keep-all' }}
                  >
                    {notice.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(notice)}
                    className="text-xs px-3 py-1.5 border border-white/[0.1] rounded-lg text-[#909098] hover:bg-white/[0.06] hover:text-[#F0F0F5] transition-colors cursor-pointer bg-transparent"
                  >
                    {t('dash.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    disabled={deletingId === notice.id}
                    className="text-xs px-3 py-1.5 border border-[#E63946]/20 rounded-lg text-[#E63946]/70 hover:bg-[#E63946]/[0.08] hover:text-[#E63946] transition-colors disabled:opacity-40 cursor-pointer bg-transparent"
                  >
                    {t('dash.delete')}
                  </button>
                </div>
              </div>

              <p
                className="text-sm text-[#909098] line-clamp-2 leading-relaxed"
                style={{ wordBreak: 'keep-all' }}
              >
                {notice.content}
              </p>

              <p className="text-xs text-[#606070] mt-2">
                {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
                {notice.updated_at !== notice.created_at && ' (수정됨)'}
              </p>
            </div>
          ))}
        </div>
      )}

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
