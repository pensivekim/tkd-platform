'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드', icon: '🏠' },
  { href: '/dashboard/students', label: '원생 관리', icon: '👥' },
  { href: '/dashboard/attendance', label: '출석 관리', icon: '✅' },
  { href: '/dashboard/albums',    label: '앨범 관리',   icon: '📸' },
  { href: '/dashboard/coaching',  label: '라이브 코칭', icon: '🎯' },
  { href: '/dashboard/poomsae',   label: '품새 기록',   icon: '🥋' },
  { href: '/dashboard/notices', label: '공지사항', icon: '📢' },
  { href: '/dashboard/settings', label: '설정', icon: '⚙️' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const sidebarContent = (
    <nav className="flex flex-col gap-1 p-4">
      {/* 로고 영역 */}
      <div className="flex items-center gap-2 px-3 py-3 mb-4">
        <span className="text-xl">🥋</span>
        <span className="font-bold text-red-600 text-lg">도장관</span>
      </div>

      {NAV_ITEMS.map((item) => (
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
          {item.label}
        </Link>
      ))}
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
