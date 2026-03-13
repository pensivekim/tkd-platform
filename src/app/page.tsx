'use client'

import Link from 'next/link'
import { useI18n, LANG_FLAGS, Lang } from '@/lib/i18n'

const LANGS: Lang[] = ['ko', 'en', 'th', 'es']

export default function LandingPage() {
  const { t, lang, setLang } = useI18n()

  const FEATURES = [
    { icon: '🤖', titleKey: 'landing.feat1Title', badge: 'MediaPipe Pose', descKey: 'landing.feat1Desc' },
    { icon: '📡', titleKey: 'landing.feat2Title', badge: 'WebRTC SFU', descKey: 'landing.feat2Desc' },
    { icon: '🔗', titleKey: 'landing.feat3Title', badge: 'Polygon SBT', descKey: 'landing.feat3Desc' },
    { icon: '📸', titleKey: 'landing.feat4Title', badge: 'Face Recognition', descKey: 'landing.feat4Desc' },
  ]

  const TECH_STACK = [
    { labelKey: 'landing.tech1Label', value: 'MediaPipe Pose', subKey: 'landing.tech1Sub' },
    { labelKey: 'landing.tech2Label', value: 'WebRTC SFU', subKey: 'landing.tech2Sub' },
    { labelKey: 'landing.tech3Label', value: 'Polygon Blockchain', subKey: 'landing.tech3Sub' },
    { labelKey: 'landing.tech4Label', value: 'Cloudflare Workers', subKey: 'landing.tech4Sub' },
    { labelKey: 'landing.tech5Label', value: 'Face AI', subKey: 'landing.tech5Sub' },
    { labelKey: 'landing.tech6Label', value: 'Cloudflare D1', subKey: 'landing.tech6Sub' },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* 네비게이션 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🥋</span>
            <span className="font-bold text-lg text-red-600">{t('hero.title')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-base leading-none transition-opacity ${lang === l ? 'opacity-100' : 'opacity-35 hover:opacity-70'}`}
                  title={l.toUpperCase()}
                >
                  {LANG_FLAGS[l]}
                </button>
              ))}
            </div>
            <Link
              href="/login"
              className="text-sm px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              {t('auth.login')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-32 text-center">
          <p className="text-red-400 text-xs font-semibold tracking-widest uppercase mb-6">
            Global Taekwondo Platform · tkd.genomic.cc
          </p>
          <h1
            className="text-3xl md:text-5xl font-extrabold leading-tight mb-6"
            style={{ wordBreak: 'keep-all' }}
          >
            {t('landing.heroH1')}
          </h1>
          <p
            className="text-gray-300 text-lg md:text-xl mb-10 max-w-xl mx-auto"
            style={{ wordBreak: 'keep-all' }}
          >
            {t('landing.heroP')}
          </p>
          <a
            href="mailto:admin@genomic.cc"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white text-base font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30"
          >
            {t('hero.ctaPartner')}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <p className="text-center text-xs font-semibold text-gray-400 tracking-widest uppercase mb-2">
          {t('landing.featuresLabel')}
        </p>
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-12"
          style={{ wordBreak: 'keep-all' }}
        >
          {t('landing.featuresTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.titleKey}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{t(f.titleKey)}</h3>
                  <span className="text-xs font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded">{f.badge}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                {t(f.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 기술 스택 */}
      <section className="bg-gray-900 py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-xs font-semibold text-gray-500 tracking-widest uppercase mb-2">Tech Stack</p>
          <h2
            className="text-2xl md:text-3xl font-bold text-center text-white mb-12"
            style={{ wordBreak: 'keep-all' }}
          >
            {t('landing.techTitle')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TECH_STACK.map((item) => (
              <div
                key={item.value}
                className="bg-gray-800 border border-gray-700 rounded-xl p-5"
              >
                <p className="text-xs text-gray-500 mb-1">{t(item.labelKey)}</p>
                <p className="font-bold text-white font-mono">{item.value}</p>
                <p className="text-xs text-gray-400 mt-1">{t(item.subKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 md:py-24 text-center px-4 border-t border-gray-100">
        <h2
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ wordBreak: 'keep-all' }}
        >
          {t('landing.ctaTitle')}
        </h2>
        <p
          className="text-gray-500 mb-8 max-w-md mx-auto"
          style={{ wordBreak: 'keep-all' }}
        >
          {t('landing.ctaDesc')}
        </p>
        <a
          href="mailto:admin@genomic.cc"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white text-base font-bold rounded-xl hover:bg-gray-800 transition-colors"
        >
          admin@genomic.cc
          <span aria-hidden="true">→</span>
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="font-semibold text-gray-700">{t('landing.company')}</span>
            <a href="mailto:admin@genomic.cc" className="hover:text-red-600 transition-colors">
              admin@genomic.cc
            </a>
          </div>
          <p className="text-xs text-gray-400">{t('footer.copyright')}</p>
        </div>
      </footer>

    </div>
  )
}
