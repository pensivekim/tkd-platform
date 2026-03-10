'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { captureException } from '@/lib/sentry'
import { REGION_LIST } from '@/lib/constants'

const Schema = z.object({
  dojang_name:      z.string().min(1, '도장명을 입력해주세요.').max(50),
  owner_name:       z.string().min(1, '관장명을 입력해주세요.').max(30),
  email:            z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password:         z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
  confirm_password: z.string(),
  phone:            z.string().max(20).optional(),
  region:           z.string().optional(),
}).refine((d) => d.password === d.confirm_password, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirm_password'],
})

type FormData = {
  dojang_name: string; owner_name: string; email: string
  password: string; confirm_password: string; phone: string; region: string
}

const EMPTY: FormData = {
  dojang_name: '', owner_name: '', email: '',
  password: '', confirm_password: '', phone: '', region: '',
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm]           = useState<FormData>(EMPTY)
  const [errors, setErrors]       = useState<Partial<Record<keyof FormData, string>>>({})
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function setField(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }))
      setErrors((p) => ({ ...p, [key]: undefined }))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')

    const parsed = Schema.safeParse(form)
    if (!parsed.success) {
      const errs: Partial<Record<keyof FormData, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormData
        if (!errs[key]) errs[key] = issue.message
      }
      setErrors(errs)
      return
    }

    setIsLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dojang_name: parsed.data.dojang_name,
          owner_name:  parsed.data.owner_name,
          email:       parsed.data.email,
          password:    parsed.data.password,
          phone:       parsed.data.phone || undefined,
          region:      parsed.data.region || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error ?? '회원가입에 실패했습니다.')
        return
      }
      router.push('/dashboard')
    } catch (err) {
      captureException(err, { action: 'register' })
      setServerError('서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="text-center mb-8">
          <span className="text-4xl">🥋</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">도장관 시작하기</h1>
          <p className="mt-1 text-sm text-gray-500" style={{ wordBreak: 'keep-all' }}>
            원생 30명까지 영구 무료
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">

          {/* 도장명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              도장명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.dojang_name}
              onChange={setField('dojang_name')}
              placeholder="예: 강남태권도도장"
              disabled={isLoading}
              className={inputCls}
              autoComplete="organization"
            />
            {errors.dojang_name && <p className="text-xs text-red-500 mt-1">{errors.dojang_name}</p>}
          </div>

          {/* 관장명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              관장명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.owner_name}
              onChange={setField('owner_name')}
              placeholder="예: 홍길동"
              disabled={isLoading}
              className={inputCls}
              autoComplete="name"
            />
            {errors.owner_name && <p className="text-xs text-red-500 mt-1">{errors.owner_name}</p>}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={setField('email')}
              placeholder="example@dojang.com"
              disabled={isLoading}
              className={inputCls}
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={setField('password')}
              placeholder="6자 이상"
              disabled={isLoading}
              className={inputCls}
              autoComplete="new-password"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.confirm_password}
              onChange={setField('confirm_password')}
              placeholder="비밀번호 재입력"
              disabled={isLoading}
              className={inputCls}
              autoComplete="new-password"
            />
            {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password}</p>}
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input
              type="tel"
              value={form.phone}
              onChange={setField('phone')}
              placeholder="예: 02-1234-5678"
              disabled={isLoading}
              className={inputCls}
              autoComplete="tel"
            />
          </div>

          {/* 지역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
            <select
              value={form.region}
              onChange={setField('region')}
              disabled={isLoading}
              className={inputCls}
            >
              <option value="">선택하세요</option>
              {REGION_LIST.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* 서버 에러 */}
          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" style={{ wordBreak: 'keep-all' }}>
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                가입 중...
              </>
            ) : (
              '무료로 시작하기'
            )}
          </button>
        </form>

        {/* 로그인 링크 */}
        <p className="mt-5 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-red-600 font-semibold hover:underline">
            로그인
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          &copy; 2025 Genomic Inc. All rights reserved.
        </p>
      </div>
    </div>
  )
}
