'use client'

import { useState, FormEvent } from 'react'
import { z } from 'zod'
import { captureException } from '@/lib/sentry'

const Schema = z.object({
  title:            z.string().min(1, '제목을 입력해주세요.').max(100),
  description:      z.string().max(500).optional(),
  type:             z.enum(['individual', 'group']),
  max_participants: z.number().int().min(1).max(30),
})

type FormData = {
  title:            string
  description:      string
  type:             'individual' | 'group'
  max_participants: number
}

const EMPTY: FormData = { title: '', description: '', type: 'individual', max_participants: 1 }

interface CoachingModalProps {
  onClose:   () => void
  onSuccess: (inviteToken: string) => void
}

export default function CoachingModal({ onClose, onSuccess }: CoachingModalProps) {
  const [form, setForm]               = useState<FormData>(EMPTY)
  const [errors, setErrors]           = useState<Partial<Record<keyof FormData, string>>>({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setField<K extends keyof FormData>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = key === 'max_participants' ? Number(e.target.value) : e.target.value
      setForm((prev) => ({ ...prev, [key]: val }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
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
      const res  = await fetch('/api/coaching', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(parsed.data),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error ?? '세션 생성에 실패했습니다.')
        return
      }

      // 초대 링크 자동 복사
      const inviteToken = data.session?.invite_token
      if (inviteToken) {
        const url = `${window.location.origin}/coach/${inviteToken}`
        navigator.clipboard.writeText(url).catch(() => {})
      }

      onSuccess(inviteToken)
      onClose()
    } catch (err) {
      captureException(err, { action: 'create_coaching_session' })
      setServerError('서버 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">코칭 세션 만들기</h2>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              세션 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={setField('title')}
              placeholder="예: 태극 1장 품새 지도"
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              value={form.description}
              onChange={setField('description')}
              rows={2}
              placeholder="세션 목표나 준비사항 등"
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 resize-none"
            />
          </div>

          {/* 유형 + 최대 참가자 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
              <select
                value={form.type}
                onChange={setField('type')}
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 bg-white"
              >
                <option value="individual">1:1 개인</option>
                <option value="group">그룹</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최대 인원</label>
              <input
                type="number"
                value={form.max_participants}
                onChange={setField('max_participants')}
                min={1}
                max={30}
                disabled={isSubmitting || form.type === 'individual'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
              />
              {form.type === 'individual' && (
                <p className="text-xs text-gray-400 mt-1">1:1은 자동으로 1명</p>
              )}
            </div>
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" style={{ wordBreak: 'keep-all' }}>
              {serverError}
            </p>
          )}

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
                  생성 중...
                </>
              ) : '세션 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
