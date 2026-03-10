'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import AlbumModal from '@/components/albums/AlbumModal'
import type { Album } from '@/types/album'

type Filter = 'all' | 'training' | 'competition'

const TYPE_LABEL: Record<string, string> = { training: '훈련', competition: '대회' }
const TYPE_COLOR: Record<string, string> = {
  training:    'bg-blue-100 text-blue-700',
  competition: 'bg-orange-100 text-orange-700',
}

const FILTER_TABS: { id: Filter; label: string }[] = [
  { id: 'all',         label: '전체' },
  { id: 'training',    label: '훈련' },
  { id: 'competition', label: '대회' },
]

export default function AlbumsPage() {
  const router = useRouter()
  const [albums, setAlbums]         = useState<Album[]>([])
  const [filter, setFilter]         = useState<Filter>('all')
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copied, setCopied]         = useState<string | null>(null)

  const fetchAlbums = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/albums')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '앨범 불러오기 실패')
      setAlbums(data.albums ?? [])
    } catch (err) {
      captureException(err, { action: 'fetch_albums' })
      setError('앨범 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchAlbums() }, [fetchAlbums])

  const filtered = filter === 'all' ? albums : albums.filter((a) => a.type === filter)

  async function handleDelete(album: Album, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`"${album.title}" 앨범을 삭제할까요?\n앨범 내 사진이 모두 삭제됩니다.`)) return
    setDeletingId(album.id)
    try {
      const res = await fetch(`/api/albums/${album.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '삭제 실패')
      }
      setAlbums((prev) => prev.filter((a) => a.id !== album.id))
    } catch (err) {
      captureException(err, { action: 'delete_album', albumId: album.id })
      alert('앨범 삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleCopyLink(album: Album, e: React.MouseEvent) {
    e.stopPropagation()
    if (!album.share_token) return
    const url = `${window.location.origin}/share/${album.share_token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(album.id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      alert(`공유 링크: ${url}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">앨범 관리</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          앨범 만들기
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === tab.id
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} retry={fetchAlbums} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📸"
          title={filter === 'all' ? '첫 앨범을 만들어보세요' : `${TYPE_LABEL[filter]} 앨범이 없습니다`}
          description="훈련이나 대회 사진을 모아 학부모와 공유해보세요."
          ctaLabel={filter === 'all' ? '앨범 만들기' : undefined}
          ctaHref={undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((album) => {
            const isDeleting = deletingId === album.id
            const isCopied   = copied === album.id
            return (
              <div
                key={album.id}
                onClick={() => router.push(`/dashboard/albums/${album.id}`)}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* 커버 이미지 영역 */}
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                  {album.cover_r2_key ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_PHOTOS_URL}/${album.cover_r2_key}`}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl opacity-30">📸</span>
                  )}

                  {/* 유형 배지 */}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLOR[album.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABEL[album.type] ?? album.type}
                  </span>

                  {/* 우측 상단 액션 버튼 */}
                  <div className="absolute top-2 right-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {album.share_token && (
                      <button
                        onClick={(e) => handleCopyLink(album, e)}
                        className="p-1.5 rounded-lg bg-white/90 text-gray-600 hover:bg-white shadow-sm text-sm"
                        aria-label="공유 링크 복사"
                        title="공유 링크 복사"
                      >
                        {isCopied ? '✓' : '🔗'}
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(album, e)}
                      className="p-1.5 rounded-lg bg-white/90 text-red-500 hover:bg-white shadow-sm"
                      aria-label="앨범 삭제"
                      title="앨범 삭제"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 카드 하단 */}
                <div className="p-3">
                  <p className="font-semibold text-gray-900 text-sm truncate" style={{ wordBreak: 'keep-all' }}>{album.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{album.event_date}</span>
                    <span className="text-xs text-gray-500">사진 {album.photo_count}장</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 앨범 생성 모달 */}
      {showModal && (
        <AlbumModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchAlbums}
        />
      )}
    </div>
  )
}
