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

      if (!res.ok) {
        setError(data.error ?? '로그인에 실패했습니다.')
        return
      }

      const redirect = searchParams.get('redirect')
      if (redirect && redirect.startsWith('/')) {
        router.push(redirect)
      } else if (data.role === 'platform_manager') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      captureException(err, { action: 'login' })
      setError('서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A0A0F',
      fontFamily: "'Outfit', system-ui, sans-serif",
      padding: '0 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 36,
              letterSpacing: 4,
              color: '#E9C46A',
              lineHeight: 1,
            }}>TKP</span>
            <div style={{ fontSize: 11, color: '#404050', letterSpacing: 1, marginTop: 2 }}>DOJANGWAN</div>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#F0F0F5', margin: '0 0 6px' }}>
            {t('auth.loginTitle')}
          </h1>
          <p style={{ fontSize: 13, color: '#606070', margin: 0, wordBreak: 'keep-all' }}>
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} style={{
          background: '#0E0E18',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#909098', marginBottom: 6 }}>
              {t('auth.email')} <span style={{ color: '#E63946' }}>*</span>
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
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 14,
                color: '#F0F0F5',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = '#E63946'; e.target.style.boxShadow = '0 0 0 2px rgba(230,57,70,0.2)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#909098', marginBottom: 6 }}>
              {t('auth.password')} <span style={{ color: '#E63946' }}>*</span>
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
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 14,
                color: '#F0F0F5',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = '#E63946'; e.target.style.boxShadow = '0 0 0 2px rgba(230,57,70,0.2)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p style={{
              fontSize: 13,
              color: '#E63946',
              background: 'rgba(230,57,70,0.08)',
              border: '1px solid rgba(230,57,70,0.2)',
              borderRadius: 8,
              padding: '10px 12px',
              margin: 0,
              wordBreak: 'keep-all',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px',
              background: isLoading ? 'rgba(230,57,70,0.4)' : '#E63946',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 10,
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              marginTop: 4,
            }}
          >
            {isLoading ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                {t('auth.loggingIn')}
              </>
            ) : (
              t('auth.login')
            )}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#303040' }}>
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
