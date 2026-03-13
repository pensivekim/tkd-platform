'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard-dark" style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0F', color: '#F0F0F5', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* 모바일 상단바 */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 52,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: '#0D0D16',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
          className="md:hidden"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ padding: 8, borderRadius: 8, background: 'transparent', border: 'none', color: '#909098', cursor: 'pointer' }}
            aria-label="메뉴 열기"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, letterSpacing: 2, color: '#E9C46A' }}>TKP</span>
            <span style={{ fontSize: 10, color: '#404050' }}>DOJANGWAN</span>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main style={{ flex: 1, padding: '24px 16px' }} className="md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
