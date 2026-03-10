import EmptyState from '@/components/ui/EmptyState'

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">설정</h1>
      <EmptyState
        icon="⚙️"
        title="설정 기능 준비 중"
        description="도장 정보, 요금제, 알림톡 설정 등을 관리할 수 있습니다."
        ctaLabel="대시보드로 돌아가기"
        ctaHref="/dashboard"
      />
    </div>
  )
}
