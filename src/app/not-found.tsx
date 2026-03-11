import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-7xl font-black text-red-600 leading-none">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">페이지를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-gray-500" style={{ wordBreak: 'keep-all' }}>
          요청하신 페이지가 존재하지 않거나 주소가 잘못 입력되었습니다.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </div>
  )
}
