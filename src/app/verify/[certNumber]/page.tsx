'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

interface CertData {
  student_name: string
  birth_date: string | null
  belt: string
  grade_type: 'dan' | 'poom' | 'gup'
  dan_grade: number
  cert_number: string
  cert_issued_at: string | null
  kukkiwon_id: string | null
  dojang_name: string
  dojang_region: string | null
  nft_token_id: string | null
  nft_tx_hash: string | null
}

export default function VerifyPage() {
  const { certNumber } = useParams<{ certNumber: string }>()
  const [cert, setCert] = useState<CertData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/public/cert/${certNumber}`)
        if (res.status === 404) { setNotFound(true); return }
        const data = await res.json()
        if (!res.ok) { setNotFound(true); return }
        setCert(data.cert)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [certNumber])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !cert) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">✗</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">단증을 찾을 수 없습니다</h1>
        <p className="text-sm text-gray-400 mb-6 text-center">
          증서 번호 <span className="font-mono font-semibold">{certNumber}</span>에 해당하는 단증이 없습니다.
        </p>
        <Link href="/" className="text-sm text-red-600 hover:underline">← 홈으로</Link>
      </div>
    )
  }

  const gradeLabel =
    cert.grade_type === 'dan'  ? `${cert.dan_grade}단` :
    cert.grade_type === 'poom' ? `${cert.dan_grade}품` :
                                 `${cert.dan_grade}급`

  const gradeGradient =
    cert.grade_type === 'dan'  ? 'from-yellow-50 to-amber-50 border-yellow-200' :
    cert.grade_type === 'poom' ? 'from-purple-50 to-violet-50 border-purple-200' :
                                 'from-gray-50 to-slate-50 border-gray-200'

  const gradeAccent =
    cert.grade_type === 'dan'  ? 'text-yellow-700' :
    cert.grade_type === 'poom' ? 'text-purple-700' :
                                 'text-gray-600'

  const hasNft = !!cert.nft_token_id
  const verifyUrl = `https://tkd.genomic.cc/verify/${cert.cert_number}`
  const polygonscanUrl = cert.nft_tx_hash
    ? `https://polygonscan.com/tx/${cert.nft_tx_hash}`
    : null

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* 검증 배너 */}
      <div className="max-w-lg mx-auto mb-6">
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">✓</span>
          </div>
          <div>
            <p className="font-semibold text-emerald-800">이 단증은 유효합니다</p>
            <p className="text-xs text-emerald-600">Taekwondo Platform (tkd.genomic.cc) 발급</p>
          </div>
        </div>
      </div>

      {/* 단증 카드 */}
      <div className={`max-w-lg mx-auto bg-gradient-to-br ${gradeGradient} border-2 rounded-3xl p-8 shadow-lg`}>
        {/* 헤더 */}
        <div className="text-center mb-6">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">
            Taekwondo Platform
          </p>
          <h1 className="text-2xl font-bold text-gray-900">단증 검증</h1>
          <p className="text-sm text-gray-400 mt-0.5">Digital Certificate Standard</p>
        </div>

        {/* 급/단/품 */}
        <div className="text-center mb-6">
          <div className={`inline-block text-6xl font-black ${gradeAccent} leading-none`}>
            {gradeLabel}
          </div>
        </div>

        {/* 성명 */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400 mb-1">수련자</p>
          <p className="text-3xl font-bold text-gray-900">{cert.student_name}</p>
          {cert.birth_date && (
            <p className="text-sm text-gray-400 mt-1">{cert.birth_date}</p>
          )}
        </div>

        {/* 상세 정보 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/70 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">도장</p>
            <p className="font-semibold text-gray-900 text-sm">{cert.dojang_name}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">발급일</p>
            <p className="font-semibold text-gray-900 text-sm">
              {cert.cert_issued_at ? cert.cert_issued_at.slice(0, 10) : '—'}
            </p>
          </div>
          <div className="bg-white/70 rounded-xl p-3 col-span-2">
            <p className="text-xs text-gray-400 mb-0.5">증서 번호</p>
            <p className="font-mono text-sm font-semibold text-gray-900">{cert.cert_number}</p>
          </div>
          {cert.kukkiwon_id && (
            <div className="bg-white/70 rounded-xl p-3 col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">국기원 등록번호</p>
              <p className="font-mono text-sm font-semibold text-gray-900">{cert.kukkiwon_id}</p>
            </div>
          )}
        </div>

        {/* QR 코드 */}
        <div className="flex flex-col items-center gap-2 my-6">
          <div className="bg-white p-3 rounded-2xl shadow-sm">
            <QRCodeSVG value={verifyUrl} size={140} level="M" />
          </div>
          <p className="text-xs text-gray-400">이 QR코드를 스캔하면 단증을 검증할 수 있습니다</p>
        </div>

        {/* 블록체인 상태 */}
        {hasNft ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 py-2 px-4 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 w-fit">
              <span>⛓</span>
              <span>블록체인 등록 완료</span>
            </div>
            {polygonscanUrl && (
              <a
                href={polygonscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                Polygonscan에서 확인 →
              </a>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-medium bg-gray-100 text-gray-400 w-fit mx-auto">
            <span>⏳</span>
            <span>블록체인 등록 준비 중</span>
          </div>
        )}

        {/* 하단 */}
        <div className="mt-6 pt-4 border-t border-gray-200/60 text-center">
          <p className="text-xs text-gray-400">Issued by Taekwondo Platform (tkd.genomic.cc)</p>
        </div>
      </div>

      {/* 하단 브랜딩 */}
      <div className="text-center mt-8 space-y-1">
        <p className="text-sm font-semibold text-gray-600">태권도 플랫폼 (Taekwondo Platform)</p>
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
          tkd.genomic.cc
        </Link>
      </div>
    </div>
  )
}
