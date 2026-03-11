'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

interface HeaderProps {
  isLoggedIn: boolean
  dojanName?: string
}

export default function Header({ isLoggedIn, dojanName }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useI18n()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-red-600">
          <span>🥋</span>
          <div className="flex flex-col leading-tight">
            <span className="font-normal text-gray-400" style={{ fontSize: 10, letterSpacing: 1 }}>태권도 플랫폼</span>
            <span>도장관</span>
          </div>
        </Link>

        {/* 데스크탑 우측 */}
        <div className="hidden sm:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {dojanName && (
                <span className="text-sm text-gray-600 font-medium">{dojanName}</span>
              )}
              <button className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                {t('auth.logout')}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              {t('auth.login')}
            </Link>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button
          className="sm:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 모바일 드롭다운 */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          {isLoggedIn ? (
            <>
              {dojanName && (
                <span className="text-sm text-gray-600 font-medium">{dojanName}</span>
              )}
              <button
                className="text-sm text-left text-gray-500 hover:text-red-600 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {t('auth.logout')}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-red-600 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              {t('auth.login')}
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
