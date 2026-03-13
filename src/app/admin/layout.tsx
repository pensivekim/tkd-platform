import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJwt } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('genomic_session')?.value

  if (!token) redirect('/login?redirect=/admin')

  const payload = await verifyJwt(token)
  if (!payload || payload.role !== 'platform_manager') {
    redirect('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F0F0F5', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* 관리자 상단바 */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#0D0D16',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, color: '#E9C46A' }}>TKP</span>
        <span style={{ fontSize: 10, color: '#404050', letterSpacing: 1 }}>ADMIN</span>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        <span style={{ fontSize: 12, color: '#606070' }}>플랫폼 관리자</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <a href="/dashboard" style={{ fontSize: 12, color: '#606070', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            도장관 →
          </a>
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {children}
      </main>
    </div>
  )
}
