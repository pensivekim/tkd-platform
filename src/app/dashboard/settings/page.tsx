'use client'

import { useState, useEffect, FormEvent } from 'react'
import { z } from 'zod'
import { captureException } from '@/lib/sentry'
import { useI18n } from '@/lib/i18n'
import { REGION_LIST } from '@/lib/constants'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { subscribePush, unsubscribePush } from '@/lib/pushClient'
import TeamSection from './TeamSection'
import { Bell, BellOff, Check } from 'lucide-react'

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
    <div className="bg-[#0E0E18] border border-white/[0.07] rounded-2xl p-5 md:p-6">
      <h2 className="font-bold text-[#F0F0F5] mb-5">{title}</h2>
      {children}
    </div>
  )
}

// ─── 입력 필드 헬퍼 ──────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#909098] mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-[#E63946] mt-1">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-lg text-sm text-[#F0F0F5] placeholder:text-[#404050] focus:outline-none focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/20 disabled:opacity-50 transition-colors'
const selectCls = inputCls + ' [&>option]:bg-[#0E0E18]'

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { t } = useI18n()
  const [dojang, setDojang]       = useState<DojangInfo | null>(null)
  const [user, setUser]           = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [dojangForm, setDojangForm]     = useState({ name: '', owner_name: '', phone: '', address: '', region: '', city: '', description: '' })
  const [dojangErrors, setDojangErrors] = useState<Record<string, string>>({})
  const [dojangSaving, setDojangSaving] = useState(false)
  const [dojangMsg, setDojangMsg]       = useState('')

  const [pwForm, setPwForm]     = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg]       = useState('')

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

  const PLAN_INFO = {
    free:  {
      label: t('settings.plan.free'),
      color: 'bg-white/[0.06] text-[#909098]',
      features: [t('settings.plan.free') + ' · 30명', t('dash.attendance'), t('dash.notices') + ' 5'],
    },
    basic: {
      label: t('settings.plan.basic'),
      color: 'bg-blue-500/15 text-blue-400',
      features: ['100' + t('dash.students'), t('dash.attendance'), t('dash.notices'), 'SMS'],
    },
    pro: {
      label: t('settings.plan.pro'),
      color: 'bg-[#E63946]/15 text-[#E63946]',
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
        body: JSON.stringify({ current_password: parsed.data.current_password, new_password: parsed.data.new_password }),
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

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (loadError) return (
    <div>
      <h1 className="text-xl font-bold text-[#F0F0F5] mb-6">{t('dash.nav.settings')}</h1>
      <ErrorMessage message={loadError} retry={loadSettings} />
    </div>
  )

  const plan     = (dojang?.plan ?? 'free') as keyof typeof PLAN_INFO
  const planInfo = PLAN_INFO[plan] ?? PLAN_INFO.free

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#F0F0F5]">{t('dash.nav.settings')}</h1>

      {/* 섹션 1: 도장 기본 정보 */}
      <Section title={t('settings.dojangInfo')}>
        <form onSubmit={handleDojangSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={`${t('settings.dojangName')} *`} error={dojangErrors.name}>
              <input type="text" value={dojangForm.name} onChange={(e) => setDojangForm((p) => ({ ...p, name: e.target.value }))} disabled={dojangSaving} className={inputCls} />
            </Field>
            <Field label={`${t('settings.ownerName')} *`} error={dojangErrors.owner_name}>
              <input type="text" value={dojangForm.owner_name} onChange={(e) => setDojangForm((p) => ({ ...p, owner_name: e.target.value }))} disabled={dojangSaving} className={inputCls} />
            </Field>
            <Field label={t('settings.phone')} error={dojangErrors.phone}>
              <input type="tel" value={dojangForm.phone} onChange={(e) => setDojangForm((p) => ({ ...p, phone: e.target.value }))} disabled={dojangSaving} className={inputCls} />
            </Field>
            <Field label={t('settings.region')} error={dojangErrors.region}>
              <select value={dojangForm.region} onChange={(e) => setDojangForm((p) => ({ ...p, region: e.target.value }))} disabled={dojangSaving} className={selectCls}>
                <option value="">{t('auth.selectRegion')}</option>
                {REGION_LIST.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label={t('settings.cityDistrict')} error={dojangErrors.city}>
              <input type="text" value={dojangForm.city} onChange={(e) => setDojangForm((p) => ({ ...p, city: e.target.value }))} disabled={dojangSaving} className={inputCls} />
            </Field>
          </div>
          <Field label={t('settings.address')} error={dojangErrors.address}>
            <input type="text" value={dojangForm.address} onChange={(e) => setDojangForm((p) => ({ ...p, address: e.target.value }))} disabled={dojangSaving} className={inputCls} />
          </Field>
          <Field label={t('settings.dojangDesc')} error={dojangErrors.description}>
            <textarea value={dojangForm.description} onChange={(e) => setDojangForm((p) => ({ ...p, description: e.target.value }))} rows={3} disabled={dojangSaving} className={`${inputCls} resize-none`} />
          </Field>

          {dojangMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${dojangMsg.startsWith('✓') ? 'text-green-400 bg-green-500/[0.08] border border-green-500/20' : 'text-[#E63946] bg-[#E63946]/[0.08] border border-[#E63946]/20'}`}>
              {dojangMsg}
            </p>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={dojangSaving} className="flex items-center gap-2 px-5 py-2.5 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer border-none">
              {dojangSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('settings.save')}
            </button>
          </div>
        </form>
      </Section>

      {/* 섹션 2: 계정 정보 */}
      <Section title={t('settings.accountInfo')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-white/[0.06]">
          <div>
            <p className="text-xs text-[#606070] mb-1">{t('settings.name')}</p>
            <p className="text-sm font-medium text-[#F0F0F5]">{user?.name ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-[#606070] mb-1">{t('settings.email')}</p>
            <p className="text-sm font-medium text-[#F0F0F5]">{user?.email ?? '-'}</p>
          </div>
        </div>

        <p className="text-sm font-semibold text-[#909098] mb-3">{t('settings.changePassword')}</p>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Field label={t('settings.currentPassword')} error={pwErrors.current_password}>
            <input type="password" value={pwForm.current_password} onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))} disabled={pwSaving} className={inputCls} autoComplete="current-password" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t('settings.newPassword')} error={pwErrors.new_password}>
              <input type="password" value={pwForm.new_password} onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))} disabled={pwSaving} className={inputCls} autoComplete="new-password" />
            </Field>
            <Field label={t('settings.confirmNewPassword')} error={pwErrors.confirm_password}>
              <input type="password" value={pwForm.confirm_password} onChange={(e) => setPwForm((p) => ({ ...p, confirm_password: e.target.value }))} disabled={pwSaving} className={inputCls} autoComplete="new-password" />
            </Field>
          </div>

          {pwMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${pwMsg.startsWith('✓') ? 'text-green-400 bg-green-500/[0.08] border border-green-500/20' : 'text-[#E63946] bg-[#E63946]/[0.08] border border-[#E63946]/20'}`}>
              {pwMsg}
            </p>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={pwSaving} className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-[#F0F0F5] text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer border-none">
              {pwSaving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {t('settings.changePassword')}
            </button>
          </div>
        </form>
      </Section>

      {/* 섹션 3: 푸시 알림 */}
      <Section title="푸시 알림">
        <p className="text-sm text-[#606070] mb-4 leading-relaxed" style={{ wordBreak: 'keep-all' }}>
          출석 체크 시 학부모 기기에 알림을 보내거나, 공지사항 등록 시 구독자 전체에게 알림을 발송합니다.
          이 기기에서 알림을 허용하면 도장 구독자로 등록됩니다.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePushToggle}
            disabled={pushStatus === 'loading' || pushStatus === 'denied'}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer border-none ${
              pushStatus === 'granted'
                ? 'bg-white/[0.08] text-[#909098] hover:bg-white/[0.12]'
                : 'bg-[#E63946] text-white hover:bg-[#C53030]'
            }`}
          >
            {pushStatus === 'loading' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {pushStatus === 'granted' ? <BellOff size={15} /> : <Bell size={15} />}
            {pushStatus === 'granted' ? '알림 구독 중 (해제)' : pushStatus === 'denied' ? '알림 차단됨 (브라우저 설정에서 허용)' : '알림 허용하기'}
          </button>
          {pushStatus === 'granted' && (
            <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/[0.08] border border-green-500/20 px-3 py-1.5 rounded-full">
              <Check size={12} /> 출석 알림 · 공지 알림 수신 중
            </span>
          )}
        </div>
      </Section>

      {/* 섹션 4: 팀 관리 */}
      <TeamSection />

      {/* 섹션 5: 요금제 안내 */}
      <Section title={t('settings.planInfo')}>
        <div className="flex items-center gap-3 mb-5">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${planInfo.color}`}>
            {planInfo.label}
          </span>
          <span className="text-sm text-[#606070]">{t('settings.inUse')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {(Object.entries(PLAN_INFO) as [keyof typeof PLAN_INFO, typeof PLAN_INFO[keyof typeof PLAN_INFO]][]).map(([key, info]) => (
            <div
              key={key}
              className={`rounded-xl border p-4 ${
                plan === key
                  ? 'border-[#E63946]/30 bg-[#E63946]/[0.05]'
                  : 'border-white/[0.07] bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold ${plan === key ? 'text-[#E63946]' : 'text-[#909098]'}`}>
                  {info.label}
                </span>
                {plan === key && (
                  <span className="text-[10px] px-2 py-0.5 bg-[#E63946] text-white rounded-full font-semibold">{t('settings.currentBadge')}</span>
                )}
              </div>
              <ul className="space-y-1">
                {info.features.map((f) => (
                  <li key={f} className="text-xs text-[#606070] flex items-center gap-1.5">
                    <Check size={11} className="text-green-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {plan !== 'pro' && (
          <a
            href="mailto:admin@genomic.cc?subject=Taekwondo Platform upgrade inquiry"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-xl transition-colors no-underline"
          >
            {t('settings.upgradeInquiry')}
          </a>
        )}
      </Section>
    </div>
  )
}
