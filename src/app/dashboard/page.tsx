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
  { key: 'totalStudents'      as const, tKey: 'dash.totalStudents',    unit: '명', icon: '👥', color: 'bg-blue-50 text-blue-600'    },
  { key: 'todayAttendance'    as const, tKey: 'dash.todayAttendance',  unit: '명', icon: '✅', color: 'bg-green-50 text-green-600'  },
  { key: 'monthlyNewStudents' as const, tKey: 'dash.students',         unit: '명', icon: '🆕', color: 'bg-yellow-50 text-yellow-600' },
  { key: 'totalNotices'       as const, tKey: 'dash.notices',          unit: '건', icon: '📢', color: 'bg-red-50 text-red-600'      },
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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('dash.nav.overview')}</h1>
        <p className="text-sm text-gray-500 mt-1" style={{ wordBreak: 'keep-all' }}>
          {t('dash.overview')}
        </p>
      </div>

      {error ? (
        <ErrorMessage message={error} retry={fetchStats} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CARD_META.map((card) => (
            <div
              key={card.key}
              className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-sm text-gray-500 mb-1" style={{ wordBreak: 'keep-all' }}>
                {t(card.tKey)}
              </p>
              <div className="flex items-baseline gap-1 min-h-[2rem]">
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span className="text-2xl font-extrabold text-gray-900">
                      {stats?.[card.key] ?? 0}
                    </span>
                    <span className="text-sm text-gray-400">{card.unit}</span>
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
