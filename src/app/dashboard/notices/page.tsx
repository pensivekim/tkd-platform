import EmptyState from '@/components/ui/EmptyState'

export default function NoticesPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">공지사항</h1>
      <EmptyState
        icon="📢"
        title="공지사항 기능 준비 중"
        description="도장 공지사항을 작성하고 학부모에게 알림을 보낼 수 있습니다."
        ctaLabel="대시보드로 돌아가기"
        ctaHref="/dashboard"
      />
    </div>
  )
}
