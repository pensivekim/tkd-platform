'use client'

import { useState, useEffect } from 'react'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { useI18n } from '@/lib/i18n'
import { Users, CalendarCheck, UserPlus, Bell } from 'lucide-react'

interface Stats {
  totalStudents:      number
  todayAttendance:    number
  monthlyNewStudents: number
  totalNotices:       number
}

const CARD_META = [
  { key: 'totalStudents'      as const, tKey: 'dash.totalStudents',   unit: '명', Icon: Users,         color: '#3B82F6' },
  { key: 'todayAttendance'    as const, tKey: 'dash.todayAttendance', unit: '명', Icon: CalendarCheck, color: '#4ade80' },
  { key: 'monthlyNewStudents' as const, tKey: 'dash.students',        unit: '명', Icon: UserPlus,      color: '#E9C46A' },
  { key: 'totalNotices'       as const, tKey: 'dash.notices',         unit: '건', Icon: Bell,          color: '#E63946' },
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
      <div className="mb-7">
        <h1 className="text-xl font-bold text-[#F0F0F5] mb-1">{t('dash.nav.overview')}</h1>
        <p className="text-sm text-[#606070]" style={{ wordBreak: 'keep-all' }}>{t('dash.overview')}</p>
      </div>

      {error ? (
        <ErrorMessage message={error} retry={fetchStats} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CARD_META.map(({ key, tKey, unit, Icon, color }) => (
            <div
              key={key}
              className="bg-[#0E0E18] border border-white/[0.07] rounded-2xl p-5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}18` }}
              >
                <Icon size={18} style={{ color }} strokeWidth={2} />
              </div>
              <p className="text-xs text-[#606070] mb-1.5" style={{ wordBreak: 'keep-all' }}>
                {t(tKey)}
              </p>
              <div className="flex items-baseline gap-1 min-h-8">
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span className="text-3xl font-black tabular-nums" style={{ color }}>
                      {stats?.[key] ?? 0}
                    </span>
                    <span className="text-xs text-[#606070]">{unit}</span>
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
