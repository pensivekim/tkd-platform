'use client'

import { useState, useEffect } from 'react'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { useI18n } from '@/lib/i18n'

interface Stats {
  totalStudents:      number
  todayAttendance:    number
  monthlyNewStudents: number
  totalNotices:       number
}

const CARD_META = [
  { key: 'totalStudents'      as const, tKey: 'dash.totalStudents',   unit: '명', icon: '👥', color: '#3B82F6' },
  { key: 'todayAttendance'    as const, tKey: 'dash.todayAttendance', unit: '명', icon: '✅', color: '#4ade80' },
  { key: 'monthlyNewStudents' as const, tKey: 'dash.students',        unit: '명', icon: '🆕', color: '#E9C46A' },
  { key: 'totalNotices'       as const, tKey: 'dash.notices',         unit: '건', icon: '📢', color: '#E63946' },
]

export default function DashboardPage() {
  const { t } = useI18n()
  const [stats, setStats]         = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  async function fetchStats() {
    setIsLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/dashboard/stats')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '불러오기 실패')
      setStats(data)
    } catch (err) {
      captureException(err, { action: 'fetch_dashboard_stats' })
      setError('통계 데이터를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F5', marginBottom: 4 }}>
          {t('dash.nav.overview')}
        </h1>
        <p style={{ fontSize: 13, color: '#606070', wordBreak: 'keep-all' }}>
          {t('dash.overview')}
        </p>
      </div>

      {error ? (
        <ErrorMessage message={error} retry={fetchStats} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="md:grid-cols-4">
          {CARD_META.map((card) => (
            <div
              key={card.key}
              style={{
                background: '#0E0E18',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '20px 18px',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                background: `${card.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {card.icon}
              </div>
              <p style={{ fontSize: 12, color: '#606070', marginBottom: 6, wordBreak: 'keep-all' }}>
                {t(card.tKey)}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, minHeight: 32 }}>
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span style={{ fontSize: 28, fontWeight: 900, color: card.color, fontFamily: "'Outfit', sans-serif" }}>
                      {stats?.[card.key] ?? 0}
                    </span>
                    <span style={{ fontSize: 12, color: '#606070' }}>{card.unit}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
