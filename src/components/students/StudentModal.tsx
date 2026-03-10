'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { z } from 'zod'
import { BELT_LIST } from '@/lib/constants'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Student } from '@/types/student'

const PHOTOS_URL = process.env.NEXT_PUBLIC_PHOTOS_URL ?? ''

const Schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  birth_date: z.string().optional(),
  phone: z.string().optional(),
  parent_phone: z.string().optional(),
  belt: z.enum(BELT_LIST),
  memo: z.string().optional(),
})

type FormData = {
  name: string
  birth_date: string
  phone: string
  parent_phone: string
  belt: string
  memo: string
}

const EMPTY_FORM: FormData = {
  name: '',
  birth_date: '',
  phone: '',
  parent_phone: '',
  belt: '흰띠',
  memo: '',
}

interface StudentModalProps {
  student: Student | null   // null = 등록, Student = 수정
  onClose: () => void
  onSuccess: () => void
}

export default function StudentModal({ student, onClose, onSuccess }: StudentModalProps) {
  const isEdit = student !== null
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [faceFile, setFaceFile]           = useState<File | null>(null)
  const [facePreview, setFacePreview]     = useState<string | null>(null)
  const faceInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name,
        birth_date: student.birth_date ?? '',
        phone: student.phone ?? '',
        parent_phone: student.parent_phone ?? '',
        belt: student.belt,
        memo: student.memo ?? '',
      })
      setFacePreview(student.face_r2_key && PHOTOS_URL ? `${PHOTOS_URL}/${student.face_r2_key}` : null)
    } else {
      setForm(EMPTY_FORM)
      setFacePreview(null)
    }
    setFaceFile(null)
    setErrors({})
    setServerError('')
  }, [student])

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')

    // 클라이언트 유효성 검사
    const parsed = Schema.safeParse({
      ...form,
      birth_date: form.birth_date || undefined,
      phone: form.phone || undefined,
      parent_phone: form.parent_phone || undefined,
      memo: form.memo || undefined,
      belt: form.belt as typeof BELT_LIST[number],
    })
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {}
      for (const [key, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        fieldErrors[key as keyof FormData] = msgs?.[0]
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const url    = isEdit ? `/api/students/${student!.id}` : '/api/students'
      const method = isEdit ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error ?? '저장에 실패했습니다.')
        return
      }

      // 얼굴 사진 업로드 (파일이 선택된 경우)
      const savedId: string = isEdit ? student!.id : data.student?.id
      if (faceFile && savedId) {
        try {
          const form = new FormData()
          form.append('image', faceFile)
          await fetch(`/api/students/${savedId}/face`, { method: 'POST', body: form })
        } catch (faceErr) {
          captureException(faceErr, { action: 'upload_face', studentId: savedId })
          // 얼굴 업로드 실패는 치명적이지 않으므로 계속 진행
        }
      }

      onSuccess()
      onClose()
    } catch (err) {
      captureException(err, { action: isEdit ? 'update_student' : 'create_student' })
      setServerError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleFaceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFaceFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFacePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    /* 오버레이 */
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{isEdit ? '원생 수정' : '원생 등록'}</h2>
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
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="홍길동"
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={set('birth_date')}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          {/* 전화번호 / 학부모 전화 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="010-0000-0000"
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학부모 전화</label>
              <input
                type="tel"
                value={form.parent_phone}
                onChange={set('parent_phone')}
                placeholder="010-0000-0000"
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* 띠 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">띠</label>
            <select
              value={form.belt}
              onChange={set('belt')}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 bg-white"
            >
              {BELT_LIST.map((belt) => (
                <option key={belt} value={belt}>{belt}</option>
              ))}
            </select>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <textarea
              value={form.memo}
              onChange={set('memo')}
              rows={3}
              placeholder="특이사항, 알레르기 등"
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 resize-none"
            />
          </div>

          {/* 대표 얼굴 사진 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">대표 얼굴 사진 <span className="text-gray-400 font-normal">(AI 자동 분류용)</span></label>
            <div className="flex items-center gap-4">
              {/* 원형 미리보기 */}
              <div
                className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={() => faceInputRef.current?.click()}
              >
                {facePreview ? (
                  <img src={facePreview} alt="얼굴 미리보기" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => faceInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  {facePreview ? '사진 변경' : '사진 선택'}
                </button>
                <p className="text-xs text-gray-400 mt-1">정면 사진 1장 권장</p>
              </div>
            </div>
            <input
              ref={faceInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFaceChange}
            />
          </div>

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
