'use client'

import { useState, useEffect, FormEvent } from 'react'
import { z } from 'zod'
import { captureException } from '@/lib/sentry'
import type { Notice } from '@/types/notice'

const Schema = z.object({
  title:     z.string().min(1, '제목을 입력해주세요.').max(100, '제목은 100자 이내로 입력해주세요.'),
  content:   z.string().min(1, '내용을 입력해주세요.'),
  is_pinned: z.boolean(),
})

type FormData = { title: string; content: string; is_pinned: boolean }
const EMPTY: FormData = { title: '', content: '', is_pinned: false }

interface NoticeModalProps {
  notice: Notice | null    // null = 등록, Notice = 수정
  onClose:   () => void
  onSuccess: () => void
}

export default function NoticeModal({ notice, onClose, onSuccess }: NoticeModalProps) {
  const isEdit = notice !== null
  const [form, setForm]           = useState<FormData>(EMPTY)
  const [errors, setErrors]       = useState<Partial<Record<keyof FormData, string>>>({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (notice) {
      setForm({ title: notice.title, content: notice.content, is_pinned: !!notice.is_pinned })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
    setServerError('')
  }, [notice])

  const setField =
    <K extends keyof FormData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = key === 'is_pinned'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')

    const parsed = Schema.safeParse(form)
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {}
      for (const [k, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        fieldErrors[k as keyof FormData] = msgs?.[0]
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const url    = isEdit ? `/api/notices/${notice!.id}` : '/api/notices'
      const method = isEdit ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const data = await res.json()
      if (!res.ok) { setServerError(data.error ?? '저장에 실패했습니다.'); return }
      onSuccess()
      onClose()
    } catch (err) {
      captureException(err, { action: isEdit ? 'update_notice' : 'create_notice' })
      setServerError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{isEdit ? '공지 수정' : '공지 등록'}</h2>
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

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={setField('title')}
              placeholder="공지사항 제목"
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={setField('content')}
              rows={6}
              placeholder="공지 내용을 입력하세요."
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 resize-none"
            />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
          </div>

          {/* 고정 여부 */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_pinned}
              onChange={setField('is_pinned')}
              disabled={isSubmitting}
              className="w-4 h-4 accent-red-600"
            />
            <span className="text-sm text-gray-700">
              📌 상단 고정 공지로 등록
            </span>
          </label>

          {/* 서버 에러 */}
          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" style={{ wordBreak: 'keep-all' }}>
              {serverError}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                isEdit ? '수정 완료' : '등록하기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
