'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Brain, Link2, Video, Camera, Building2, User, Globe, CheckCircle2 } from 'lucide-react'
import { useI18n, LANG_FLAGS, Lang } from '@/lib/i18n'

const LANGS: Lang[] = ['ko', 'en', 'th', 'es']

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

export default function LandingPage() {
  const { t, lang, setLang } = useI18n()
  const [activeTab, setActiveTab] = useState(0)

  const features = [
    { Icon: Brain,  titleKey: 'landing.feat1Title', descKey: 'landing.feat1Desc', tag: 'MediaPipe Pose' },
    { Icon: Link2,  titleKey: 'landing.feat2Title', descKey: 'landing.feat2Desc', tag: 'Polygon SBT' },
    { Icon: Video,  titleKey: 'landing.feat3Title', descKey: 'landing.feat3Desc', tag: 'WebRTC SFU' },
    { Icon: Camera, titleKey: 'landing.feat4Title', descKey: 'landing.feat4Desc', tag: 'Face Recognition' },
  ]

  const tabs = [
    { Icon: Building2, labelKey: 'landing.tab1', titleKey: 'landing.tab1Title', points: ['landing.tab1Point1', 'landing.tab1Point2', 'landing.tab1Point3'] },
    { Icon: User,      labelKey: 'landing.tab2', titleKey: 'landing.tab2Title', points: ['landing.tab2Point1', 'landing.tab2Point2', 'landing.tab2Point3'] },
    { Icon: Globe,     labelKey: 'landing.tab3', titleKey: 'landing.tab3Title', points: ['landing.tab3Point1', 'landing.tab3Point2', 'landing.tab3Point3'] },
  ]

  const techStack = [
    { name: 'Cloudflare Workers', descKey: 'landing.tech1Desc', initial: 'C', color: '#F6821F' },
    { name: 'Polygon',            descKey: 'landing.tech2Desc', initial: 'P', color: '#8247E5' },
    { name: 'MediaPipe',          descKey: 'landing.tech3Desc', initial: 'M', color: '#4285F4' },
    { name: 'WebRTC',             descKey: 'landing.tech4Desc', initial: 'W', color: '#34A853' },
  ]

  const stats = [
    { value: '210', suffix: '', labelKey: 'landing.stat1Label' },
    { value: '33',  suffix: '', labelKey: 'landing.stat2Label' },
    { value: '<500', suffix: 'ms', labelKey: 'landing.stat3Label' },
    { value: '$0.001', suffix: '', labelKey: 'landing.stat4Label' },
  ]

  const statsAnim   = useInView()
  const featuresAnim = useInView()
  const targetsAnim  = useInView()
  const techAnim     = useInView()
  const ctaAnim      = useInView()

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* ─── NAV ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🥋</span>
            <span className="font-bold text-sm tracking-tight">
              <span className="text-white">TKP</span>
              <span className="text-[#E53E3E] mx-1.5">·</span>
              <span className="text-white/40 font-normal">DOJANGWAN</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  title={l.toUpperCase()}
                  className={`text-base leading-none transition-opacity ${lang === l ? 'opacity-100' : 'opacity-25 hover:opacity-60'}`}
                >
                  {LANG_FLAGS[l]}
                </button>
              ))}
            </div>
            <Link
              href="/login"
              className="text-xs px-4 py-1.5 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-semibold"
            >
              {t('auth.login')}
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-14">
        {/* dot grid */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        {/* red glow center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(229,62,62,0.12) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
          {/* badge */}
          <div className="inline-flex items-center gap-2 border border-white/[0.1] bg-white/[0.04] rounded-full px-4 py-1.5 text-xs text-white/50 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E53E3E] animate-pulse shrink-0" />
            {t('landing.badge')}
          </div>

          {/* headline */}
          <h1
            className="font-black tracking-tight leading-[1.05] mb-5"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 5rem)', wordBreak: 'keep-all' }}
          >
            <span className="text-white">{t('landing.heroH1a')}</span>
            <br />
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {t('landing.heroH1b')}
            </span>
          </h1>

          <p
            className="text-white/45 text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed"
            style={{ wordBreak: 'keep-all' }}
          >
            {t('landing.heroSub')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:admin@genomic.cc"
              className="inline-flex items-center gap-2 px-7 py-3 bg-[#E53E3E] text-white text-sm font-semibold rounded-xl hover:bg-[#C53030] transition-colors shadow-lg shadow-red-900/20"
            >
              {t('landing.ctaPrimary')} <span>→</span>
            </a>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3 border border-white/[0.12] text-white/70 text-sm font-semibold rounded-xl hover:bg-white/[0.05] hover:border-white/20 transition-colors"
            >
              {t('landing.ctaSecondary')}
            </Link>
          </div>
        </div>

        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
      </section>

      {/* ─── STATS ─── */}
      <div
        ref={statsAnim.ref}
        className={`border-y border-white/[0.06] bg-white/[0.025] transition-all duration-700 ${statsAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <div className="max-w-5xl mx-auto px-5 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.labelKey}>
              <p className="text-3xl md:text-4xl font-black text-white tabular-nums">
                {s.value}<span className="text-[#E53E3E]">{s.suffix}</span>
              </p>
              <p className="text-xs text-white/35 mt-1.5 tracking-wide">{t(s.labelKey)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <section
        ref={featuresAnim.ref}
        className={`max-w-6xl mx-auto px-5 py-20 md:py-32 transition-all duration-700 ${featuresAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <p className="text-[11px] font-semibold text-[#E53E3E] tracking-[0.15em] uppercase text-center mb-3">
          {t('landing.featuresLabel')}
        </p>
        <h2
          className="text-3xl md:text-4xl font-bold text-center mb-14"
          style={{ wordBreak: 'keep-all' }}
        >
          {t('landing.featuresTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(({ Icon, titleKey, descKey, tag }) => (
            <div
              key={titleKey}
              className="group border border-white/[0.07] bg-white/[0.025] rounded-2xl p-7 hover:border-[#E53E3E]/25 hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E53E3E]/10 flex items-center justify-center mb-5">
                <Icon size={19} className="text-[#E53E3E]" strokeWidth={1.8} />
              </div>
              <h3 className="font-bold text-base mb-2" style={{ wordBreak: 'keep-all' }}>{t(titleKey)}</h3>
              <p className="text-sm text-white/45 leading-relaxed mb-5" style={{ wordBreak: 'keep-all' }}>
                {t(descKey)}
              </p>
              <span className="inline-block text-[10px] font-mono text-[#E53E3E]/60 bg-[#E53E3E]/[0.07] border border-[#E53E3E]/[0.12] px-2.5 py-0.5 rounded-full">
                {tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TARGET USERS ─── */}
      <section
        ref={targetsAnim.ref}
        className={`border-t border-white/[0.06] bg-white/[0.02] py-20 md:py-32 transition-all duration-700 ${targetsAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-[11px] font-semibold text-[#E53E3E] tracking-[0.15em] uppercase text-center mb-3">For Everyone</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            style={{ wordBreak: 'keep-all' }}
          >
            {t('landing.targetsTitle')}
          </h2>

          {/* Tab buttons */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {tabs.map(({ Icon, labelKey }, i) => (
              <button
                key={labelKey}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === i
                    ? 'bg-[#E53E3E] text-white shadow-md shadow-red-900/20'
                    : 'border border-white/[0.1] text-white/45 hover:text-white/70 hover:border-white/20'
                }`}
              >
                <Icon size={14} strokeWidth={2} />
                {t(labelKey)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="max-w-md mx-auto border border-white/[0.07] bg-white/[0.025] rounded-2xl p-8">
            <h3 className="text-lg font-bold mb-6" style={{ wordBreak: 'keep-all' }}>
              {t(tabs[activeTab].titleKey)}
            </h3>
            <ul className="space-y-4">
              {tabs[activeTab].points.map((key) => (
                <li key={key} className="flex items-start gap-3 text-sm text-white/60" style={{ wordBreak: 'keep-all' }}>
                  <CheckCircle2 size={16} className="text-[#E53E3E] mt-0.5 shrink-0" strokeWidth={2} />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── TECH STACK ─── */}
      <section
        ref={techAnim.ref}
        className={`max-w-6xl mx-auto px-5 py-20 md:py-32 transition-all duration-700 ${techAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <p className="text-[11px] font-semibold text-[#E53E3E] tracking-[0.15em] uppercase text-center mb-3">Tech Stack</p>
        <h2
          className="text-3xl md:text-4xl font-bold text-center mb-14"
          style={{ wordBreak: 'keep-all' }}
        >
          {t('landing.techTitle')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {techStack.map(({ name, descKey, initial, color }) => (
            <div key={name} className="border border-white/[0.07] bg-white/[0.025] rounded-2xl p-6 text-center hover:border-white/[0.12] transition-colors">
              <div
                className="w-11 h-11 rounded-xl mx-auto mb-4 flex items-center justify-center text-sm font-black"
                style={{ background: `${color}1A`, color }}
              >
                {initial}
              </div>
              <p className="font-bold text-sm mb-1.5">{name}</p>
              <p className="text-xs text-white/35 leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section
        ref={ctaAnim.ref}
        className={`relative overflow-hidden transition-all duration-700 ${ctaAnim.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #E53E3E 0%, #9B2C2C 100%)' }} />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-5 py-24 text-center">
          <h2
            className="text-3xl md:text-5xl font-black mb-4"
            style={{ wordBreak: 'keep-all' }}
          >
            {t('landing.ctaTitle')}
          </h2>
          <p
            className="text-white/70 text-base md:text-lg mb-10"
            style={{ wordBreak: 'keep-all' }}
          >
            {t('landing.ctaDesc')}
          </p>
          <a
            href="mailto:admin@genomic.cc"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#C53030] font-bold rounded-xl hover:bg-white/95 transition-colors text-sm"
          >
            admin@genomic.cc <span>→</span>
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="font-semibold text-sm text-white/80">{t('landing.company')}</span>
            <a href="mailto:admin@genomic.cc" className="text-xs text-white/30 hover:text-[#E53E3E] transition-colors">
              admin@genomic.cc
            </a>
          </div>
          <p className="text-xs text-white/20">{t('footer.copyright')}</p>
        </div>
      </footer>

    </div>
  )
}
