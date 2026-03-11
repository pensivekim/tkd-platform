import Link from 'next/link'

const FEATURES = [
  {
    icon: '👥',
    title: '원생 관리',
    desc: '출석 체크, 띠 등급 관리, 학부모 알림톡까지. 도장 운영의 모든 것을 한곳에서.',
  },
  {
    icon: '🤖',
    title: 'AI 품새 채점',
    desc: 'MediaPipe 기반 자세 분석으로 품새 동작을 자동 채점. 객관적인 평가를 제공합니다.',
  },
  {
    icon: '📡',
    title: '원격 승단 심사',
    desc: 'WebRTC 실시간 영상으로 해외 수련생도 온라인으로 심사. 국기원 연동 예정.',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '무료',
    period: '',
    highlight: false,
    features: ['원생 30명까지', '출석 관리', '공지사항', '기본 리포트'],
  },
  {
    name: 'Basic',
    price: '29,000',
    period: '원/월',
    highlight: true,
    badge: '인기',
    features: ['원생 100명까지', 'Free 기능 전체', '카카오 알림톡', '띠 승급 관리'],
  },
  {
    name: 'Pro',
    price: '79,000',
    period: '원/월',
    highlight: false,
    features: ['원생 무제한', 'Basic 기능 전체', 'AI 품새 채점', '원격 승단 심사'],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* 네비게이션 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🥋</span>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg text-red-600">태권도 플랫폼</span>
              <span className="font-normal text-gray-400" style={{ fontSize: 11 }}>도장관(DOJANGWAN)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="text-sm px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              회원가입
            </Link>
            <Link
              href="/login"
              className="text-sm px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              로그인
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-32 text-center">
          <h1
            className="text-3xl md:text-5xl font-extrabold leading-tight mb-6"
            style={{ wordBreak: 'keep-all' }}
          >
            태권도 플랫폼 —<br className="hidden md:block" /> 도장·단증·AI 품새·대회의 모든 것
          </h1>
          <p
            className="text-gray-300 text-lg md:text-xl mb-10 max-w-xl mx-auto"
            style={{ wordBreak: 'keep-all' }}
          >
            도장 SaaS부터 블록체인 단증, AI 품새 채점, 대회 라이브까지 — 세계 210개국 태권도를 하나의 플랫폼에서
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white text-base font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30"
          >
            무료로 시작하기
            <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-4 text-sm text-gray-400">신용카드 불필요 · 원생 30명까지 영구 무료</p>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <p className="text-center text-sm font-semibold text-red-600 tracking-widest uppercase mb-2">도장관(DOJANGWAN)</p>
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-12"
          style={{ wordBreak: 'keep-all' }}
        >
          도장 운영에 필요한 모든 기능
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-6 hover:shadow-md transition-shadow"
            >
              <span className="text-4xl mb-4 block">{f.icon}</span>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 요금제 */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2
            className="text-2xl md:text-3xl font-bold text-center mb-12"
            style={{ wordBreak: 'keep-all' }}
          >
            합리적인 요금제
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
                  plan.highlight ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                {'badge' in plan && plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-gray-500">{plan.period}</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                      <span style={{ wordBreak: 'keep-all' }}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  시작하기
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16 md:py-24 text-center px-4">
        <h2
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ wordBreak: 'keep-all' }}
        >
          지금 바로 시작하세요
        </h2>
        <p
          className="text-gray-300 mb-8 max-w-md mx-auto"
          style={{ wordBreak: 'keep-all' }}
        >
          태권도 종주국 한국의 글로벌 플랫폼. 지금 바로 무료로 시작하세요.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white text-base font-bold rounded-xl hover:bg-red-700 transition-colors"
        >
          무료로 시작하기
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="font-semibold text-gray-700">주식회사 제노믹</span>
            <a href="mailto:contact@genomic.cc" className="hover:text-red-600 transition-colors">
              contact@genomic.cc
            </a>
          </div>
          <p className="text-xs text-gray-400">&copy; 2025 Genomic Inc. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
