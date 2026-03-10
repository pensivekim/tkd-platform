'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { captureException } from '@/lib/sentry'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import ErrorMessage from '@/components/ui/ErrorMessage'
import type { Album, Photo } from '@/types/album'

const PHOTOS_URL = process.env.NEXT_PUBLIC_PHOTOS_URL ?? ''
const photoUrl   = (r2Key: string) => PHOTOS_URL ? `${PHOTOS_URL}/${r2Key}` : `/api/photo-proxy/${r2Key}`

type Params = { params: Promise<{ id: string }> }

export default function AlbumDetailPage({ params }: Params) {
  const { id: albumId }         = use(params)
  const [album, setAlbum]       = useState<Album | null>(null)
  const [photos, setPhotos]     = useState<Photo[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [lightbox, setLightbox]     = useState<Photo | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
  const [uploadError, setUploadError]       = useState<string | null>(null)
  const [deletingId, setDeletingId]         = useState<string | null>(null)
  const [copied, setCopied]                 = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [albumRes, photosRes] = await Promise.all([
        fetch(`/api/albums`),
        fetch(`/api/albums/${albumId}/photos`),
      ])
      const albumsData  = await albumRes.json()
      const photosData  = await photosRes.json()
      if (!albumRes.ok)  throw new Error(albumsData.error  ?? '앨범 불러오기 실패')
      if (!photosRes.ok) throw new Error(photosData.error  ?? '사진 불러오기 실패')

      const found = (albumsData.albums as Album[])?.find((a) => a.id === albumId) ?? null
      setAlbum(found)
      setPhotos(photosData.photos ?? [])
    } catch (err) {
      captureException(err, { action: 'fetch_album_detail', albumId })
      setError('앨범 정보를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [albumId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    const list = Array.from(files).slice(0, 20)
    setUploading(true)
    setUploadError(null)
    setUploadProgress({ done: 0, total: list.length })

    let successCount = 0
    for (const file of list) {
      try {
        const form = new FormData()
        form.append('image', file)
        const res  = await fetch(`/api/albums/${albumId}/photos`, { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? '업로드 실패')
        setPhotos((prev) => [...prev, data.photo])
        successCount++
      } catch (err) {
        captureException(err, { action: 'upload_photo', albumId })
      } finally {
        setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }))
      }
    }

    setUploading(false)
    if (successCount < list.length) {
      setUploadError(`${list.length - successCount}장 업로드에 실패했습니다.`)
    }
    // photo_count 반영을 위해 앨범 정보 재조회
    fetchData()
  }

  async function handleDeletePhoto(photo: Photo, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('이 사진을 삭제할까요?')) return
    setDeletingId(photo.id)
    try {
      const res = await fetch(`/api/albums/${albumId}/photos/${photo.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '삭제 실패')
      }
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      if (lightbox?.id === photo.id) setLightbox(null)
    } catch (err) {
      captureException(err, { action: 'delete_photo', photoId: photo.id })
      alert('사진 삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleCopyLink() {
    if (!album?.share_token) return
    const url = `${window.location.origin}/share/${album.share_token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(`공유 링크: ${url}`)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error)     return <ErrorMessage message={error} retry={fetchData} />

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-1">
        <Link href="/dashboard/albums" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← 앨범 목록
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ wordBreak: 'keep-all' }}>
            {album?.title ?? '앨범'}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {album && (
              <>
                <span className="text-sm text-gray-500">{album.event_date}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  album.type === 'competition' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {album.type === 'competition' ? '대회' : '훈련'}
                </span>
                <span className="text-sm text-gray-400">사진 {photos.length}장</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {album?.share_token && (
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? '✓ 복사됨' : '🔗 공유 링크'}
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            사진 업로드
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* 업로드 진행률 */}
      {uploading && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">업로드 중...</span>
            <span className="text-sm text-blue-600">{uploadProgress.done} / {uploadProgress.total}</span>
          </div>
          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.total ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
      {uploadError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      {/* 사진 그리드 */}
      {photos.length === 0 ? (
        <EmptyState
          icon="📷"
          title="사진이 없습니다"
          description="사진 업로드 버튼을 눌러 첫 사진을 추가해보세요."
        />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {photos.map((photo) => {
            const isDeleting = deletingId === photo.id
            return (
              <div
                key={photo.id}
                className={`relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer group ${isDeleting ? 'opacity-40' : ''} ${photo.is_confirmed ? 'ring-2 ring-green-400' : ''}`}
                onClick={() => setLightbox(photo)}
              >
                <img
                  src={photoUrl(photo.r2_key)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* 원생 배지 */}
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent">
                  <span className={`text-xs font-medium truncate block ${photo.student_id ? 'text-white' : 'text-white/50'}`}>
                    {photo.student_id ? '분류됨' : '미분류'}
                  </span>
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => handleDeletePhoto(photo, e)}
                  className="absolute top-1 right-1 p-1 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="사진 삭제"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* 라이트박스 */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={photoUrl(lightbox.r2_key)}
              alt=""
              className="w-full max-h-[85vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-2 text-center text-white/50 text-xs">
              {new Date(lightbox.created_at).toLocaleString('ko-KR')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
