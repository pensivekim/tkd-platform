'use client'

import { useState, useEffect, FormEvent } from 'react'
import { z } from 'zod'
import { captureException } from '@/lib/sentry'
import { REGION_LIST } from '@/lib/constants'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

// ─── 타입 ───────────────────────────────────────────────────────────────────
interface DojangInfo {
  id: string; name: string; owner_name: string; phone: string
  address: string; region: string; city: string; description: string
  plan: string; plan_expires_at: string | null
}
interface UserInfo { name: string; email: string }

// ─── Zod 스키마 ──────────────────────────────────────────────────────────────
const DojangSchema = z.object({
  name:        z.string().min(1, '도장명을 입력해주세요.').max(50),
  owner_name:  z.string().min(1, '관장명을 입력해주세요.').max(30),
  phone:       z.string().max(20).optional(),
  address:     z.string().max(200).optional(),
  region:      z.string().max(20).optional(),
  city:        z.string().max(20).optional(),
  description: z.string().max(500).optional(),
})

const PasswordSchema = z.object({
  current_password: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
  new_password:     z.string().min(6, '새 비밀번호는 6자 이상이어야 합니다.'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: '새 비밀번호가 일치하지 않습니다.',
  path: ['confirm_password'],
})

// ─── 요금제 정보 ─────────────────────────────────────────────────────────────
const PLAN_INFO = {
  free:  { label: '무료', color: 'bg-gray-100 text-gray-700',   features: ['원생 최대 30명', '출석 기록', '공지사항 5건'] },
  basic: { label: '기본', color: 'bg-blue-100 text-blue-700',   features: ['원생 최대 100명', '출석 기록', '공지사항 무제한', '문자 알림'] },
  pro:   { label: '프로', color: 'bg-red-100 text-red-700',     features: ['원생 무제한', '출석 기록', '공지사항 무제한', '문자 알림', 'AI 품새 채점', '온라인 연수'] },
}

// ─── 섹션 래퍼 ───────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
      <h2 className="font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

// ─── 입력 필드 헬퍼 ──────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50'

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [dojang, setDojang]       = useState<DojangInfo | null>(null)
  const [user, setUser]           = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 도장 정보 폼
  const [dojangForm, setDojangForm]     = useState({ name: '', owner_name: '', phone: '', address: '', region: '', city: '', description: '' })
  const [dojangErrors, setDojangErrors] = useState<Record<string, string>>({})
  const [dojangSaving, setDojangSaving] = useState(false)
  const [dojangMsg, setDojangMsg]       = useState('')

  // 비밀번호 폼
  const [pwForm, setPwForm]     = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg]       = useState('')

  async function loadSettings() {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res  = await fetch('/api/settings/dojang')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '불러오기 실패')
      setDojang(data.dojang)
      setUser(data.user)
      setDojangForm({
        name:        data.dojang.name        ?? '',
        owner_name:  data.dojang.owner_name  ?? '',
        phone:       data.dojang.phone       ?? '',
        address:     data.dojang.address     ?? '',
        region:      data.dojang.region      ?? '',
        city:        data.dojang.city        ?? '',
        description: data.dojang.description ?? '',
      })
    } catch (err) {
      captureException(err, { action: 'load_settings' })
      setLoadError('설정 정보를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadSettings() }, [])

  // ── 도장 정보 저장 ──────────────────────────────────────────────────────────
  async function handleDojangSave(e: FormEvent) {
    e.preventDefault()
    setDojangMsg('')

    const parsed = DojangSchema.safeParse(dojangForm)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const [k, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
        errs[k] = (msgs as string[])?.[0] ?? ''
      }
      setDojangErrors(errs)
      return
    }
    setDojangErrors({})
    setDojangSaving(true)
    try {
      const res  = await fetch('/api/settings/dojang', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const data = await res.json()
      if (!res.ok) { setDojangMsg(data.error ?? '저장에 실패했습니다.'); return }
      setDojang(data.dojang)
      setDojangMsg('✓ 저장되었습니다.')
    } catch (err) {
      captureException(err, { action: 'save_dojang_settings' })
      setDojangMsg('서버 오류가 발생했습니다.')
    } finally {
      setDojangSaving(false)
    }
  }

  // ── 비밀번호 변경 ───────────────────────────────────────────────────────────
  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    setPwMsg('')

    const parsed = PasswordSchema.safeParse(pwForm)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        if (!errs[key]) errs[key] = issue.message
      }
      setPwErrors(errs)
      return
    }
    setPwErrors({})
    setPwSaving(true)
    try {
      const res  = await fetch('/api/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: parsed.data.current_password,
          new_password:     parsed.data.new_password,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setPwMsg(data.error ?? '변경에 실패했습니다.'); return }
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
      setPwMsg('✓ 비밀번호가 변경되었습니다.')
    } catch (err) {
      captureException(err, { action: 'change_password' })
      setPwMsg('서버 오류가 발생했습니다.')
    } finally {
      setPwSaving(false)
    }
  }

  // ── 렌더 ────────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  )

  if (loadError) return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">설정</h1>
      <ErrorMessage message={loadError} retry={loadSettings} />
    </div>
  )

  const plan     = (dojang?.plan ?? 'free') as keyof typeof PLAN_INFO
  const planInfo = PLAN_INFO[plan] ?? PLAN_INFO.free

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">설정</h1>

      {/* ── 섹션 1: 도장 기본 정보 ── */}
      <Section title="도장 기본 정보">
        <form onSubmit={handleDojangSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="도장명 *" error={dojangErrors.name}>
              <input
                type="text"
                value={dojangForm.name}
                onChange={(e) => setDojangForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="예: 강남태권도도장"
                disabled={dojangSaving}
                className={inputCls}
              />
            </Field>
            <Field label="관장명 *" error={dojangErrors.owner_name}>
              <input
                type="text"
                value={dojangForm.owner_name}
                onChange={(e) => setDojangForm((p) => ({ ...p, owner_name: e.target.value }))}
                placeholder="예: 홍길동"
                disabled={dojangSaving}
                className={inputCls}
              />
            </Field>
            <Field label="전화번호" error={dojangErrors.phone}>
              <input
                type="tel"
                value={dojangForm.phone}
                onChange={(e) => setDojangForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="예: 02-1234-5678"
                disabled={dojangSaving}
                className={inputCls}
              />
            </Field>
            <Field label="지역" error={dojangErrors.region}>
              <select
                value={dojangForm.region}
                onChange={(e) => setDojangForm((p) => ({ ...p, region: e.target.value }))}
                disabled={dojangSaving}
                className={inputCls}
              >
                <option value="">선택하세요</option>
                {REGION_LIST.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="시/군/구" error={dojangErrors.city}>
              <input
                type="text"
                value={dojangForm.city}
                onChange={(e) => setDojangForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="예: 강남구"
                disabled={dojangSaving}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="주소" error={dojangErrors.address}>
            <input
              type="text"
              value={dojangForm.address}
              onChange={(e) => setDojangForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="예: 서울특별시 강남구 테헤란로 123"
              disabled={dojangSaving}
              className={inputCls}
            />
          </Field>

          <Field label="도장 소개" error={dojangErrors.description}>
            <textarea
              value={dojangForm.description}
              onChange={(e) => setDojangForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="도장을 간단히 소개해주세요."
              disabled={dojangSaving}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {dojangMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${dojangMsg.startsWith('✓') ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
              {dojangMsg}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={dojangSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              {dojangSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              저장
            </button>
          </div>
        </form>
      </Section>

      {/* ── 섹션 2: 계정 정보 ── */}
      <Section title="계정 정보">
        {/* 읽기 전용 계정 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">이름</p>
            <p className="text-sm font-medium text-gray-900">{user?.name ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">이메일</p>
            <p className="text-sm font-medium text-gray-900">{user?.email ?? '-'}</p>
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <p className="text-sm font-semibold text-gray-700 mb-3">비밀번호 변경</p>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Field label="현재 비밀번호" error={pwErrors.current_password}>
            <input
              type="password"
              value={pwForm.current_password}
              onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))}
              placeholder="현재 비밀번호 입력"
              disabled={pwSaving}
              className={inputCls}
              autoComplete="current-password"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="새 비밀번호" error={pwErrors.new_password}>
              <input
                type="password"
                value={pwForm.new_password}
                onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                placeholder="6자 이상"
                disabled={pwSaving}
                className={inputCls}
                autoComplete="new-password"
              />
            </Field>
            <Field label="새 비밀번호 확인" error={pwErrors.confirm_password}>
              <input
                type="password"
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm_password: e.target.value }))}
                placeholder="새 비밀번호 재입력"
                disabled={pwSaving}
                className={inputCls}
                autoComplete="new-password"
              />
            </Field>
          </div>

          {pwMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${pwMsg.startsWith('✓') ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
              {pwMsg}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-60"
            >
              {pwSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              비밀번호 변경
            </button>
          </div>
        </form>
      </Section>

      {/* ── 섹션 3: 요금제 안내 ── */}
      <Section title="요금제">
        {/* 현재 플랜 배지 */}
        <div className="flex items-center gap-3 mb-5">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${planInfo.color}`}>
            {planInfo.label} 플랜
          </span>
          <span className="text-sm text-gray-500">현재 이용 중</span>
        </div>

        {/* 플랜 비교 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {(Object.entries(PLAN_INFO) as [keyof typeof PLAN_INFO, typeof PLAN_INFO[keyof typeof PLAN_INFO]][]).map(([key, info]) => (
            <div
              key={key}
              className={`rounded-xl border p-4 ${plan === key ? 'border-red-300 bg-red-50/30' : 'border-gray-100 bg-gray-50'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold ${plan === key ? 'text-red-700' : 'text-gray-700'}`}>
                  {info.label} 플랜
                </span>
                {plan === key && (
                  <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-full">현재</span>
                )}
              </div>
              <ul className="space-y-1">
                {info.features.map((f) => (
                  <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {plan !== 'pro' && (
          <a
            href="mailto:contact@genomic.cc?subject=도장관 요금제 업그레이드 문의"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            업그레이드 문의
          </a>
        )}
      </Section>
    </div>
  )
}
