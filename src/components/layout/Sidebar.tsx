'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n, LANG_FLAGS, type Lang } from '@/lib/i18n'

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
    <nav className="flex flex-col gap-1 p-4 h-full">
      {/* 로고 영역 */}
      <div className="flex items-center gap-2 px-3 py-3 mb-4">
        <span className="text-xl">🥋</span>
        <div className="flex flex-col leading-tight">
          <span className="font-normal text-gray-400" style={{ fontSize: 10, letterSpacing: 1 }}>태권도 플랫폼</span>
          <span className="font-bold text-red-600 text-lg">도장관</span>
        </div>
      </div>

      {NAV_KEYS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive(item.href)
              ? 'bg-red-50 text-red-600'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <span className="text-base" aria-hidden="true">{item.icon}</span>
          {t(item.key)}
        </Link>
      ))}

      {/* 언어 전환 */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="flex gap-1 px-2 flex-wrap">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              title={t(`common.lang${l.charAt(0).toUpperCase()}${l.slice(1)}`)}
              className={`px-2 py-1 rounded text-sm transition-colors ${
                lang === l
                  ? 'bg-red-100 text-red-600 font-medium'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {LANG_FLAGS[l]}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )

  return (
    <>
      {/* 데스크탑: 고정 사이드바 */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-200 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* 모바일: 오버레이 */}
      {isOpen && (
        <>
          {/* 배경 딤 */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* 사이드바 패널 */}
          <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white z-50 shadow-xl md:hidden">
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-md text-gray-400 hover:bg-gray-100"
              aria-label="메뉴 닫기"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
