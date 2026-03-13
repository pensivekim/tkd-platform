'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0A0A0F] text-[#F0F0F5]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0">
        {/* 모바일 상단바 */}
        <header className="md:hidden flex items-center gap-3 px-4 h-13 border-b border-white/[0.07] bg-[#0D0D16] sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-transparent border-none text-[#909098] hover:text-[#F0F0F5] hover:bg-white/[0.06] cursor-pointer transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#E63946] flex items-center justify-center">
              <span className="text-white font-black text-[9px] tracking-wider">TK</span>
            </div>
            <span className="text-[#F0F0F5] font-bold text-sm tracking-tight">DOJANGWAN</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
