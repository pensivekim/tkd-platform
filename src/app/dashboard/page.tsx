const STAT_CARDS = [
  { label: '전체 원생 수', value: 0, unit: '명', icon: '👥', color: 'bg-blue-50 text-blue-600' },
  { label: '오늘 출석', value: 0, unit: '명', icon: '✅', color: 'bg-green-50 text-green-600' },
  { label: '이번 달 신규 원생', value: 0, unit: '명', icon: '🆕', color: 'bg-yellow-50 text-yellow-600' },
  { label: '공지사항 수', value: 0, unit: '건', icon: '📢', color: 'bg-red-50 text-red-600' },
]

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1" style={{ wordBreak: 'keep-all' }}>
          도장 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* 통계 카드 4개 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-sm text-gray-500 mb-1" style={{ wordBreak: 'keep-all' }}>
              {card.label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-gray-900">{card.value}</span>
              <span className="text-sm text-gray-400">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
