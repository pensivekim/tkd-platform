import EmptyState from '@/components/ui/EmptyState'

export default function StudentsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">원생 관리</h1>
      <EmptyState
        icon="👥"
        title="원생 관리 기능 준비 중"
        description="원생 등록, 띠 관리, 학부모 연락처 관리 기능이 곧 추가됩니다."
        ctaLabel="대시보드로 돌아가기"
        ctaHref="/dashboard"
      />
    </div>
  )
}
