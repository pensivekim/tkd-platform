import Link from 'next/link'

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI 품새 채점',
    badge: 'MediaPipe Pose',
    desc: '33개 키포인트 실시간 추적. 국기원 공인 기준으로 자세·대칭·안정성 자동 채점. 브라우저만으로 동작, 앱 설치 불필요.',
  },
  {
    icon: '📡',
    title: '원격 심사·연수',
    badge: 'WebRTC SFU',
    desc: 'Cloudflare Realtime 기반 <500ms 저지연. 세계 330+ PoP. 심사위원 1명 ↔ 응시자 다수 동시 연결.',
  },
  {
    icon: '🔗',
    title: '블록체인 디지털 단증',
    badge: 'Polygon SBT',
    desc: '온체인 발행, 위변조 불가. QR코드로 2초 안에 전세계 검증. 건당 $0.001 미만. 플랫폼 종료 후에도 영구 유효.',
  },
  {
    icon: '📸',
    title: 'AI 포토 & 대회 라이브',
    badge: 'Face Recognition',
    desc: '대회 현장 사진을 선수별 자동 분류. WebRTC 라이브 중계 + AI Pose 오버레이. LINE·카카오 자동 전송.',
  },
]

const TECH_STACK = [
  { label: 'AI 동작 분석', value: 'MediaPipe Pose', sub: '33 keypoints · 브라우저 실시간' },
  { label: '영상 통신', value: 'WebRTC SFU', sub: 'Cloudflare Realtime · <500ms' },
  { label: '단증 발급', value: 'Polygon Blockchain', sub: 'SBT · 위변조 불가 · $0.001/건' },
  { label: '인프라', value: 'Cloudflare Workers', sub: 'Edge · 330+ 글로벌 PoP' },
  { label: '얼굴 인식', value: 'Face AI', sub: '선수별 자동 분류 · 알림톡 전송' },
  { label: '데이터베이스', value: 'Cloudflare D1', sub: 'SQLite · Edge · 글로벌 복제' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* 네비게이션 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🥋</span>
            <span className="font-bold text-lg text-red-600">태권도 플랫폼</span>
          </div>
          <Link
            href="/login"
            className="text-sm px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            로그인
          </Link>
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
            태권도 플랫폼 —<br className="hidden md:block" /> 도장·단증·AI 품새·대회의 모든 것
          </h1>
          <p
            className="text-gray-300 text-lg md:text-xl mb-10 max-w-xl mx-auto"
            style={{ wordBreak: 'keep-all' }}
          >
            MediaPipe · WebRTC · Polygon · Cloudflare Workers —<br className="hidden md:block" /> 세계 210개국 태권도를 하나의 기술 플랫폼에서
          </p>
          <a
            href="mailto:contact@genomic.cc"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white text-base font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30"
          >
            파트너십 문의
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <p className="text-center text-xs font-semibold text-gray-400 tracking-widest uppercase mb-2">Core Features</p>
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-12"
          style={{ wordBreak: 'keep-all' }}
        >
          플랫폼 핵심 기술
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{f.title}</h3>
                  <span className="text-xs font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded">{f.badge}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                {f.desc}
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
            기술 스택
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TECH_STACK.map((t) => (
              <div
                key={t.value}
                className="bg-gray-800 border border-gray-700 rounded-xl p-5"
              >
                <p className="text-xs text-gray-500 mb-1">{t.label}</p>
                <p className="font-bold text-white font-mono">{t.value}</p>
                <p className="text-xs text-gray-400 mt-1">{t.sub}</p>
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
          파트너십 · 국기원 연동 · 기술 협력
        </h2>
        <p
          className="text-gray-500 mb-8 max-w-md mx-auto"
          style={{ wordBreak: 'keep-all' }}
        >
          태권도 종주국 한국에서 만드는 글로벌 플랫폼.<br />
          도장 체인, 협회, 기관 파트너를 모집합니다.
        </p>
        <a
          href="mailto:contact@genomic.cc"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white text-base font-bold rounded-xl hover:bg-gray-800 transition-colors"
        >
          contact@genomic.cc
          <span aria-hidden="true">→</span>
        </a>
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
          <p className="text-xs text-gray-400">&copy; 2026 Genomic Inc. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
