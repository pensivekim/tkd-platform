'use client'

import { useState, useEffect, FormEvent } from 'react'
import { z } from 'zod'
import { captureException } from '@/lib/sentry'
import { useI18n } from '@/lib/i18n'
import { REGION_LIST } from '@/lib/constants'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { subscribePush, unsubscribePush } from '@/lib/pushClient'

// ─── 타입 ───────────────────────────────────────────────────────────────────
interface DojangInfo {
  id: string; name: string; owner_name: string; phone: string
  address: string; region: string; city: string; description: string
  plan: string; plan_expires_at: string | null
}
interface UserInfo { name: string; email: string }

// ─── Zod 스키마 ──────────────────────────────────────────────────────────────
const DojangSchema = z.object({
  name:        z.string().min(1).max(50),
  owner_name:  z.string().min(1).max(30),
  phone:       z.string().max(20).optional(),
  address:     z.string().max(200).optional(),
  region:      z.string().max(20).optional(),
  city:        z.string().max(20).optional(),
  description: z.string().max(500).optional(),
})

const PasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password:     z.string().min(6),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  path: ['confirm_password'],
})

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
  const { t } = useI18n()
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

  // 푸시 알림 상태
  const [pushStatus, setPushStatus] = useState<'idle' | 'granted' | 'denied' | 'loading'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'granted') setPushStatus('granted')
    else if (Notification.permission === 'denied') setPushStatus('denied')
  }, [])

  async function handlePushToggle() {
    if (pushStatus === 'granted') {
      await unsubscribePush()
      setPushStatus('idle')
    } else {
      setPushStatus('loading')
      const ok = await subscribePush()
      setPushStatus(ok ? 'granted' : 'denied')
    }
  }

  // 요금제 정보 (번역)
  const PLAN_INFO = {
    free:  {
      label: t('settings.plan.free'),
      color: 'bg-gray-100 text-gray-700',
      features: [t('settings.plan.free') + ' · 30명', t('dash.attendance'), t('dash.notices') + ' 5'],
    },
    basic: {
      label: t('settings.plan.basic'),
      color: 'bg-blue-100 text-blue-700',
      features: ['100' + t('dash.students'), t('dash.attendance'), t('dash.notices'), 'SMS'],
    },
    pro: {
      label: t('settings.plan.pro'),
      color: 'bg-red-100 text-red-700',
      features: [t('dash.students'), t('dash.attendance'), t('dash.notices'), 'SMS', t('dash.nav.poomsaeAdmin'), t('training.title')],
    },
  }

  async function loadSettings() {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res  = await fetch('/api/settings/dojang')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('common.error'))
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
      setLoadError(t('common.error'))
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
      if (!res.ok) { setDojangMsg(data.error ?? t('settings.saveFail')); return }
      setDojang(data.dojang)
      setDojangMsg(t('settings.saved'))
    } catch (err) {
      captureException(err, { action: 'save_dojang_settings' })
      setDojangMsg(t('settings.serverError'))
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
      if (!res.ok) { setPwMsg(data.error ?? t('settings.saveFail')); return }
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
      setPwMsg(t('settings.saved'))
    } catch (err) {
      captureException(err, { action: 'change_password' })
      setPwMsg(t('settings.serverError'))
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
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t('dash.nav.settings')}</h1>
      <ErrorMessage message={loadError} retry={loadSettings} />
    </div>
  )

  const plan     = (dojang?.plan ?? 'free') as keyof typeof PLAN_INFO
  const planInfo = PLAN_INFO[plan] ?? PLAN_INFO.free

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">{t('dash.nav.settings')}</h1>

      {/* ── 섹션 1: 도장 기본 정보 ── */}
      <Section title={t('settings.dojangInfo')}>
        <form onSubmit={handleDojangSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={`${t('settings.dojangName')} *`} error={dojangErrors.name}>
              <input
                type="text"
                value={dojangForm.name}
                onChange={(e) => setDojangForm((p) => ({ ...p, name: e.target.value }))}
                disabled={dojangSaving}
                className={inputCls}
              />
            </Field>
            <Field label={`${t('settings.ownerName')} *`} error={dojangErrors.owner_name}>
              <input
                type="text"
                value={dojangForm.owner_name}
                onChange={(e) => setDojangForm((p) => ({ ...p, owner_name: e.target.value }))}
                disabled={dojangSaving}
                className={inputCls}
              />
            </Field>
            <Field label={t('settings.phone')} error={dojangErrors.phone}>
              <input
                type="tel"
                value={dojangForm.phone}
                onChange={(e) => setDojangForm((p) => ({ ...p, phone: e.target.value }))}
                disabled={dojangSaving}
                className={inputCls}
              />
            </Field>
            <Field label={t('settings.region')} error={dojangErrors.region}>
              <select
                value={dojangForm.region}
                onChange={(e) => setDojangForm((p) => ({ ...p, region: e.target.value }))}
                disabled={dojangSaving}
                className={inputCls}
              >
                <option value="">{t('auth.selectRegion')}</option>
                {REGION_LIST.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label={t('settings.cityDistrict')} error={dojangErrors.city}>
              <input
                type="text"
                value={dojangForm.city}
                onChange={(e) => setDojangForm((p) => ({ ...p, city: e.target.value }))}
                disabled={dojangSaving}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label={t('settings.address')} error={dojangErrors.address}>
            <input
              type="text"
              value={dojangForm.address}
              onChange={(e) => setDojangForm((p) => ({ ...p, address: e.target.value }))}
              disabled={dojangSaving}
              className={inputCls}
            />
          </Field>

          <Field label={t('settings.dojangDesc')} error={dojangErrors.description}>
            <textarea
              value={dojangForm.description}
              onChange={(e) => setDojangForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
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
              {t('settings.save')}
            </button>
          </div>
        </form>
      </Section>

      {/* ── 섹션 2: 계정 정보 ── */}
      <Section title={t('settings.accountInfo')}>
        {/* 읽기 전용 계정 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">{t('settings.name')}</p>
            <p className="text-sm font-medium text-gray-900">{user?.name ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t('settings.email')}</p>
            <p className="text-sm font-medium text-gray-900">{user?.email ?? '-'}</p>
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <p className="text-sm font-semibold text-gray-700 mb-3">{t('settings.changePassword')}</p>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Field label={t('settings.currentPassword')} error={pwErrors.current_password}>
            <input
              type="password"
              value={pwForm.current_password}
              onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))}
              disabled={pwSaving}
              className={inputCls}
              autoComplete="current-password"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('settings.newPassword')} error={pwErrors.new_password}>
              <input
                type="password"
                value={pwForm.new_password}
                onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                disabled={pwSaving}
                className={inputCls}
                autoComplete="new-password"
              />
            </Field>
            <Field label={t('settings.confirmNewPassword')} error={pwErrors.confirm_password}>
              <input
                type="password"
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm_password: e.target.value }))}
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
              {t('settings.changePassword')}
            </button>
          </div>
        </form>
      </Section>

      {/* ── 섹션 3: 푸시 알림 ── */}
      <Section title="푸시 알림">
        <p className="text-sm text-gray-500 mb-4" style={{ wordBreak: 'keep-all' }}>
          출석 체크 시 학부모 기기에 알림을 보내거나, 공지사항 등록 시 구독자 전체에게 알림을 발송합니다.<br />
          이 기기에서 알림을 허용하면 도장 구독자로 등록됩니다.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handlePushToggle}
            disabled={pushStatus === 'loading' || pushStatus === 'denied'}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
              pushStatus === 'granted'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {pushStatus === 'loading' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {pushStatus === 'granted' ? '🔔 알림 구독 중 (해제하기)' : pushStatus === 'denied' ? '🚫 알림 차단됨 (브라우저 설정에서 허용)' : '🔔 알림 허용하기'}
          </button>
          {pushStatus === 'granted' && (
            <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              ✓ 출석 알림 · 공지 알림 수신 중
            </span>
          )}
        </div>
      </Section>

      {/* ── 섹션 4: 요금제 안내 ── */}
      <Section title={t('settings.planInfo')}>
        {/* 현재 플랜 배지 */}
        <div className="flex items-center gap-3 mb-5">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${planInfo.color}`}>
            {planInfo.label}
          </span>
          <span className="text-sm text-gray-500">{t('settings.inUse')}</span>
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
                  {info.label}
                </span>
                {plan === key && (
                  <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-full">{t('settings.currentBadge')}</span>
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
            href="mailto:admin@genomic.cc?subject=Taekwondo Platform upgrade inquiry"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('settings.upgradeInquiry')}
          </a>
        )}
      </Section>
    </div>
  )
}
