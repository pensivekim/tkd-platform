'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { captureException } from '@/lib/sentry'
import { useI18n } from '@/lib/i18n'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import AlbumModal from '@/components/albums/AlbumModal'
import type { Album } from '@/types/album'
import { Plus, Images, Link2, Trash2, Image } from 'lucide-react'

type Filter = 'all' | 'training' | 'competition'

const TYPE_LABEL_KEYS: Record<string, string> = {
  training:    'album.training',
  competition: 'album.competition',
}
const TYPE_COLOR: Record<string, string> = {
  training:    'bg-blue-500/15 text-blue-400',
  competition: 'bg-orange-500/15 text-orange-400',
}
const FILTER_TABS: { id: Filter; tKey: string }[] = [
  { id: 'all',         tKey: 'album.all' },
  { id: 'training',    tKey: 'album.training' },
  { id: 'competition', tKey: 'album.competition' },
]

export default function AlbumsPage() {
  const router = useRouter()
  const { t } = useI18n()
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
        <h1 className="text-xl font-bold text-[#F0F0F5]">{t('dash.nav.albums')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E63946] hover:bg-[#C53030] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer border-none"
        >
          <Plus size={15} strokeWidth={2.5} />
          {t('album.createAlbum')}
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer border-none ${
              filter === tab.id
                ? 'bg-[#E63946] text-white'
                : 'bg-white/[0.05] text-[#909098] hover:bg-white/[0.09] hover:text-[#F0F0F5]'
            }`}
          >
            {t(tab.tKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} retry={fetchAlbums} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Images size={22} className="text-[#606070]" />}
          title={filter === 'all' ? t('album.noAlbums') : `${t(TYPE_LABEL_KEYS[filter])} ${t('album.noAlbums')}`}
          description="훈련이나 대회 사진을 모아 학부모와 공유해보세요."
          ctaLabel={filter === 'all' ? t('album.createAlbum') : undefined}
          onCta={filter === 'all' ? () => setShowModal(true) : undefined}
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
                className={`bg-[#0E0E18] border border-white/[0.07] rounded-2xl overflow-hidden cursor-pointer hover:border-white/[0.12] transition-colors ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* 커버 이미지 */}
                <div className="aspect-video bg-white/[0.04] flex items-center justify-center relative">
                  {album.cover_r2_key ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_PHOTOS_URL}/${album.cover_r2_key}`}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image size={28} className="text-white/[0.12]" />
                  )}

                  {/* 유형 배지 */}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLOR[album.type] ?? 'bg-white/[0.08] text-[#909098]'}`}>
                    {t(TYPE_LABEL_KEYS[album.type] ?? 'album.training')}
                  </span>

                  {/* 우측 액션 */}
                  <div className="absolute top-2 right-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {album.share_token && (
                      <button
                        onClick={(e) => handleCopyLink(album, e)}
                        className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-white transition-colors cursor-pointer border-none"
                        title="공유 링크 복사"
                      >
                        <Link2 size={13} className={isCopied ? 'text-green-400' : ''} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(album, e)}
                      className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-[#E63946] transition-colors cursor-pointer border-none"
                      title="앨범 삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* 카드 하단 */}
                <div className="p-3">
                  <p className="font-semibold text-[#F0F0F5] text-sm truncate" style={{ wordBreak: 'keep-all' }}>
                    {album.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[#606070]">{album.event_date}</span>
                    <span className="text-xs text-[#606070]">{t('album.photos')} {album.photo_count}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <AlbumModal onClose={() => setShowModal(false)} onSuccess={fetchAlbums} />
      )}
    </div>
  )
}
