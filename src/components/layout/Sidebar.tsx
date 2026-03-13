'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n, LANG_FLAGS, type Lang } from '@/lib/i18n'
import { logout } from '@/app/actions'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Images,
  Video,
  Zap,
  Bell,
  Settings,
  LogOut,
  ArrowLeft,
  Globe2,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',            key: 'dash.nav.overview',     Icon: LayoutDashboard },
  { href: '/dashboard/students',   key: 'dash.nav.students',     Icon: Users },
  { href: '/dashboard/attendance', key: 'dash.nav.attendance',   Icon: CalendarCheck },
  { href: '/dashboard/albums',     key: 'dash.nav.albums',       Icon: Images },
  { href: '/dashboard/coaching',   key: 'dash.nav.coaching',     Icon: Video },
  { href: '/dashboard/poomsae',    key: 'dash.nav.poomsaeAdmin', Icon: Zap },
  { href: '/dashboard/notices',    key: 'dash.nav.notices',      Icon: Bell },
  { href: '/dashboard/settings',   key: 'dash.nav.settings',     Icon: Settings },
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

  const content = (
    <div className="flex flex-col h-full">
      {/* 로고 */}
      <div className="px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#E63946] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xs tracking-wider">TK</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[#F0F0F5] font-bold text-sm tracking-tight">DOJANGWAN</span>
            <span className="text-[#404050] text-[10px]">도장관</span>
          </div>
        </Link>
      </div>

      <div className="h-px bg-white/[0.06] mx-4 mb-2" />

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, key, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all no-underline ${
                active
                  ? 'bg-[#E63946]/12 text-[#E63946] border-l-2 border-[#E63946]'
                  : 'text-[#909098] hover:text-[#F0F0F5] hover:bg-white/[0.05] border-l-2 border-transparent'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              <span>{t(key)}</span>
            </Link>
          )
        })}
      </nav>

      {/* 하단 */}
      <div className="px-3 pb-4 space-y-1">
        <div className="h-px bg-white/[0.06] mb-3" />

        {/* 언어 선택 */}
        <div className="flex items-center gap-1 px-2 pb-2">
          <Globe2 size={12} className="text-[#404050] mr-1" />
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`w-7 h-7 rounded-lg text-sm transition-all border-none cursor-pointer ${
                lang === l
                  ? 'bg-[#E63946]/15 text-[#E63946] font-bold'
                  : 'bg-transparent text-[#505060] hover:bg-white/[0.06]'
              }`}
            >
              {LANG_FLAGS[l]}
            </button>
          ))}
        </div>

        {/* 홈으로 */}
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#505060] hover:text-[#909098] hover:bg-white/[0.04] transition-all no-underline"
        >
          <ArrowLeft size={13} />
          서비스 홈으로
        </Link>

        {/* 로그아웃 */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#E63946]/70 hover:text-[#E63946] hover:bg-[#E63946]/[0.08] transition-all cursor-pointer border-none bg-transparent"
          >
            <LogOut size={13} />
            로그아웃
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* 데스크탑 고정 사이드바 */}
      <aside className="hidden md:flex flex-col w-52 min-h-screen flex-shrink-0 bg-[#0D0D16] border-r border-white/[0.07]">
        {content}
      </aside>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="fixed left-0 top-0 bottom-0 w-52 z-50 flex flex-col bg-[#0D0D16] border-r border-white/[0.07] shadow-2xl md:hidden">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.05] border-none text-[#606070] hover:text-[#909098] cursor-pointer transition-colors"
              aria-label="메뉴 닫기"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {content}
          </aside>
        </>
      )}
    </>
  )
}
