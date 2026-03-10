import EmptyState from '@/components/ui/EmptyState'

export default function AttendancePage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">출석 관리</h1>
      <EmptyState
        icon="✅"
        title="출석 관리 기능 준비 중"
        description="QR 코드 출석 체크, 출결 통계, 결석 알림 기능이 곧 추가됩니다."
        ctaLabel="대시보드로 돌아가기"
        ctaHref="/dashboard"
      />
    </div>
  )
}
