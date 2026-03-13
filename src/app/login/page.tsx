'use client'

import { Suspense, useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { captureException } from '@/lib/sentry'
import { useI18n } from '@/lib/i18n'

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '로그인에 실패했습니다.'); return }
      const redirect = searchParams.get('redirect')
      if (redirect && redirect.startsWith('/')) router.push(redirect)
      else if (data.role === 'platform_manager') router.push('/admin')
      else router.push('/dashboard')
    } catch (err) {
      captureException(err, { action: 'login' })
      setError('서버와 통신 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E63946] mb-4">
            <span className="text-white font-black text-lg tracking-wider">TK</span>
          </div>
          <h1 className="text-xl font-bold text-[#F0F0F5] mb-1">{t('auth.loginTitle')}</h1>
          <p className="text-sm text-[#606070]" style={{ wordBreak: 'keep-all' }}>{t('auth.loginSubtitle')}</p>
        </div>

        {/* 폼 */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#0E0E18] border border-white/[0.07] rounded-2xl p-7 flex flex-col gap-4"
        >
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-[#909098] mb-2">
              {t('auth.email')} <span className="text-[#E63946]">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="example@dojang.com"
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-lg text-sm text-[#F0F0F5] placeholder:text-[#404050] focus:outline-none focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/20 disabled:opacity-50 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-[#909098] mb-2">
              {t('auth.password')} <span className="text-[#E63946]">*</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-lg text-sm text-[#F0F0F5] placeholder:text-[#404050] focus:outline-none focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/20 disabled:opacity-50 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-[#E63946] bg-[#E63946]/[0.08] border border-[#E63946]/20 rounded-lg px-3 py-2.5" style={{ wordBreak: 'keep-all' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#E63946] hover:bg-[#C53030] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer border-none mt-1"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isLoading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#303040]">
          &copy; 2025 Genomic Inc. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}
