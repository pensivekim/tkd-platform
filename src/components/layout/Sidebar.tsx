'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n, LANG_FLAGS, type Lang } from '@/lib/i18n'
import { logout } from '@/app/actions'

const NAV_KEYS: { href: string; key: string; icon: string }[] = [
  { href: '/dashboard',            key: 'dash.nav.overview',     icon: '🏠' },
  { href: '/dashboard/students',   key: 'dash.nav.students',     icon: '👥' },
  { href: '/dashboard/attendance', key: 'dash.nav.attendance',   icon: '✅' },
  { href: '/dashboard/albums',     key: 'dash.nav.albums',       icon: '📸' },
  { href: '/dashboard/coaching',   key: 'dash.nav.coaching',     icon: '🎯' },
  { href: '/dashboard/poomsae',    key: 'dash.nav.poomsaeAdmin', icon: '🥋' },
  { href: '/dashboard/notices',    key: 'dash.nav.notices',      icon: '📢' },
  { href: '/dashboard/settings',   key: 'dash.nav.settings',     icon: '⚙️' },
]

const LANGS: Lang[] = ['ko', 'en', 'th', 'es']

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { t, lang, setLang } = useI18n()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const sidebarContent = (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 16, height: '100%' }}>
      {/* 로고 */}
      <div style={{ padding: '12px 10px 20px', marginBottom: 4 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: '#E9C46A', lineHeight: 1 }}>TKP</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F0F0F5' }}>DOJANGWAN</span>
            <span style={{ fontSize: 9, color: '#404050', letterSpacing: 0.5 }}>도장관</span>
          </div>
        </Link>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 4px 12px' }} />

      {/* 네비게이션 */}
      {NAV_KEYS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: isActive(item.href) ? 700 : 500,
            textDecoration: 'none',
            transition: 'all 0.15s',
            background: isActive(item.href) ? 'rgba(230,57,70,0.12)' : 'transparent',
            color: isActive(item.href) ? '#E63946' : '#909098',
            borderLeft: isActive(item.href) ? '2px solid #E63946' : '2px solid transparent',
          }}
        >
          <span style={{ fontSize: 15 }}>{item.icon}</span>
          {t(item.key)}
        </Link>
      ))}

      {/* 하단: 언어 전환 + 랜딩 링크 */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* 언어 */}
        <div style={{ display: 'flex', gap: 4, padding: '0 4px', marginBottom: 12, flexWrap: 'wrap' }}>
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: lang === l ? 'rgba(230,57,70,0.15)' : 'transparent',
                color: lang === l ? '#E63946' : '#606070',
                fontWeight: lang === l ? 700 : 400,
              }}
            >
              {LANG_FLAGS[l]}
            </button>
          ))}
        </div>
        {/* 랜딩 링크 */}
        <Link href="/" style={{
          display: 'block', padding: '8px 12px', borderRadius: 8,
          fontSize: 11, color: '#404050', textDecoration: 'none',
          border: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center',
        }}>
          ← 서비스 홈으로
        </Link>
        {/* 로그아웃 */}
        <form action={logout}>
          <button type="submit" style={{
            width: '100%', marginTop: 6,
            display: 'block', padding: '8px 12px', borderRadius: 8,
            fontSize: 11, color: '#E63946', background: 'transparent',
            border: '1px solid rgba(230,57,70,0.15)',
            textAlign: 'center', cursor: 'pointer',
          }}>
            로그아웃
          </button>
        </form>
      </div>
    </nav>
  )

  const sidebarStyle: React.CSSProperties = {
    background: '#0D0D16',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    width: 200,
    minHeight: '100vh',
    flexShrink: 0,
  }

  return (
    <>
      {/* 데스크탑: 고정 사이드바 */}
      <aside className="hidden md:flex" style={sidebarStyle}>
        {sidebarContent}
      </aside>

      {/* 모바일: 오버레이 */}
      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
            className="md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside
            style={{ ...sidebarStyle, position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50, boxShadow: '4px 0 24px rgba(0,0,0,0.5)' }}
            className="md:hidden"
          >
            <button
              onClick={onClose}
              style={{ position: 'absolute', top: 12, right: 12, padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#606070', cursor: 'pointer' }}
              aria-label="메뉴 닫기"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
