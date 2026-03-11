'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { captureException } from '@/lib/sentry'
import { subscribePush } from '@/lib/pushClient'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Album, Photo } from '@/types/album'

const PHOTOS_URL = process.env.NEXT_PUBLIC_PHOTOS_URL ?? ''
const photoUrl   = (r2Key: string) => PHOTOS_URL ? `${PHOTOS_URL}/${r2Key}` : r2Key

type Params = { params: Promise<{ shareToken: string }> }

export default function ShareAlbumPage({ params }: Params) {
  const { shareToken }      = use(params)
  const [album, setAlbum]   = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [lightbox, setLightbox]   = useState<Photo | null>(null)

  // 푸시 알림 구독
  const [subscribing, setSubscribing] = useState(false)
  const [subscribed, setSubscribed]   = useState(false)
  const [pushSupported, setPushSupported] = useState(false)

  useEffect(() => {
    setPushSupported(typeof window !== 'undefined' && 'PushManager' in window && !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/public/albums/${shareToken}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? '앨범 불러오기 실패')
        setAlbum(data.album)
        setPhotos(data.photos ?? [])
      } catch (err) {
        captureException(err, { action: 'fetch_public_album', shareToken })
        setError('앨범을 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [shareToken])

  function handleDownload(photo: Photo) {
    const a = document.createElement('a')
    a.href = photoUrl(photo.r2_key)
    a.download = `photo-${photo.id.slice(0, 8)}.jpg`
    a.target = '_blank'
    a.click()
  }

  async function handleSubscribe() {
    setSubscribing(true)
    try {
      const ok = await subscribePush()
      if (ok) {
        setSubscribed(true)
      } else {
        alert('알림 권한이 거부되었거나 브라우저가 지원하지 않습니다.')
      }
    } catch (err) {
      captureException(err, { action: 'subscribe_push_share' })
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <span className="text-xl">🥋</span>
          <span className="font-bold text-red-600">태권도 플랫폼</span>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-sm text-gray-500">포토 앨범</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-gray-600 font-medium" style={{ wordBreak: 'keep-all' }}>앨범을 찾을 수 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2" style={{ wordBreak: 'keep-all' }}>링크가 만료되었거나 삭제된 앨범입니다.</p>
          </div>
        ) : (
          <>
            {/* 앨범 정보 */}
            <div className="mb-5">
              <h1 className="text-xl font-bold text-gray-900" style={{ wordBreak: 'keep-all' }}>{album?.title}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-gray-500">{album?.event_date}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  album?.type === 'competition' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {album?.type === 'competition' ? '대회' : '훈련'}
                </span>
                <span className="text-sm text-gray-400">사진 {photos.length}장</span>
              </div>
              {album?.description && (
                <p className="text-sm text-gray-600 mt-2" style={{ wordBreak: 'keep-all' }}>{album.description}</p>
              )}
            </div>

            {/* 사진 그리드 */}
            {photos.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📷</p>
                <p className="text-gray-500">사진이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
                    onClick={() => setLightbox(photo)}
                  >
                    <img
                      src={photoUrl(photo.r2_key)}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* 다운로드 버튼 */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(photo) }}
                      className="absolute bottom-1 right-1 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="다운로드"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 📸 새 사진 알림 받기 */}
            {pushSupported && (
              <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-800 text-sm" style={{ wordBreak: 'keep-all' }}>
                    📸 새 사진 알림 받기
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ wordBreak: 'keep-all' }}>
                    새 사진이 올라오면 알림을 보내드립니다.
                  </p>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing || subscribed}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
                    subscribed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {subscribing ? '등록 중...' : subscribed ? '✓ 등록됨' : '알림 받기'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 푸터 */}
      <footer className="text-center py-8 text-xs text-gray-300">
        태권도 플랫폼(TKP) · tkd.genomic.cc
      </footer>

      {/* 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={photoUrl(lightbox.r2_key)}
              alt=""
              className="w-full max-h-[85vh] object-contain rounded-xl"
            />
            <div className="flex gap-3 justify-center mt-3">
              <button
                onClick={() => handleDownload(lightbox)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                다운로드
              </button>
              <button
                onClick={() => setLightbox(null)}
                className="px-4 py-2 bg-white/10 text-white/70 text-sm rounded-lg hover:bg-white/20 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
