'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { captureException } from '@/lib/sentry'
import { useI18n } from '@/lib/i18n'
import type { Student } from '@/types/student'

interface DojangInfo {
  id: string
  name: string
  owner_name: string
  region: string | null
}

export default function CertPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useI18n()
  const printRef = useRef<HTMLDivElement>(null)

  const [student, setStudent] = useState<Student | null>(null)
  const [dojang, setDojang] = useState<DojangInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [sRes, dRes] = await Promise.all([
          fetch(`/api/students/${id}`),
          fetch('/api/settings/dojang'),
        ])
        const sData = await sRes.json()
        if (!sRes.ok) throw new Error(sData.error ?? '원생 정보 불러오기 실패')
        setStudent(sData.student)

        const dData = await dRes.json()
        if (dRes.ok) setDojang(dData.dojang ?? null)
      } catch (err) {
        captureException(err, { action: 'load_cert_page', id })
        setError('정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  function handlePrint() {
    window.print()
  }

  async function handleCopyVerifyLink() {
    if (!student?.cert_number) return
    const url = `${window.location.origin}/verify/${student.cert_number}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error ?? '원생을 찾을 수 없습니다.'}</p>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">
          ← 뒤로가기
        </button>
      </div>
    )
  }

  if (!student.grade_type || !student.dan_grade) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg mb-2">단/품/급 정보가 없습니다</p>
        <p className="text-sm text-gray-400 mb-6">원생 정보에서 단/품/급을 먼저 입력해주세요.</p>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:underline">
          ← 뒤로가기
        </button>
      </div>
    )
  }

  const gradeLabel =
    student.grade_type === 'dan'  ? `${student.dan_grade}단` :
    student.grade_type === 'poom' ? `${student.dan_grade}품` :
                                    `${student.dan_grade}급`

  const gradeGradient =
    student.grade_type === 'dan'  ? 'from-yellow-50 to-amber-50 border-yellow-200' :
    student.grade_type === 'poom' ? 'from-purple-50 to-violet-50 border-purple-200' :
                                    'from-gray-50 to-slate-50 border-gray-200'

  const gradeAccent =
    student.grade_type === 'dan'  ? 'text-yellow-700' :
    student.grade_type === 'poom' ? 'text-purple-700' :
                                    'text-gray-600'

  const hasNft = !!student.nft_token_id
  const verifyUrl = student.cert_number
    ? `https://tkd.genomic.cc/verify/${student.cert_number}`
    : null

  return (
    <div>
      {/* 상단 액션 바 */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← {t('common.backToHome') ? '뒤로' : '뒤로'}
        </button>
        <div className="flex items-center gap-2">
          {student.cert_number && (
            <button
              onClick={handleCopyVerifyLink}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? '복사됨 ✓' : t('cert.copyVerifyLink')}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('cert.print')}
          </button>
        </div>
      </div>

      {/* 단증 카드 */}
      <div ref={printRef} className={`max-w-2xl mx-auto bg-gradient-to-br ${gradeGradient} border-2 rounded-3xl p-8 shadow-lg`}>
        {/* 헤더 */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">
            {t('cert.platformName')}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {t('cert.pageTitle')}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{t('cert.platformSub')}</p>
        </div>

        {/* 급/단/품 표시 */}
        <div className="text-center mb-8">
          <div className={`inline-block text-7xl font-black ${gradeAccent} leading-none`}>
            {gradeLabel}
          </div>
        </div>

        {/* 성명 */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-400 mb-1">{t('cert.student')}</p>
          <p className="text-4xl font-bold text-gray-900">{student.name}</p>
          {student.birth_date && (
            <p className="text-sm text-gray-400 mt-1">{student.birth_date}</p>
          )}
        </div>

        {/* 발급 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/70 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">{t('cert.dojang')}</p>
            <p className="font-semibold text-gray-900">{dojang?.name ?? '—'}</p>
          </div>
          <div className="bg-white/70 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">{t('cert.issuedAt')}</p>
            <p className="font-semibold text-gray-900">
              {student.cert_issued_at ? student.cert_issued_at.slice(0, 10) : '—'}
            </p>
          </div>
          {student.cert_number && (
            <div className="bg-white/70 rounded-2xl p-4">
              <p className="text-xs text-gray-400 mb-1">{t('cert.certNumber')}</p>
              <p className="font-mono text-sm font-semibold text-gray-900">{student.cert_number}</p>
            </div>
          )}
          {student.kukkiwon_id && (
            <div className="bg-white/70 rounded-2xl p-4">
              <p className="text-xs text-gray-400 mb-1">{t('cert.kukkiwonId')}</p>
              <p className="font-mono text-sm font-semibold text-gray-900">{student.kukkiwon_id}</p>
            </div>
          )}
        </div>

        {/* QR 코드 */}
        {verifyUrl && (
          <div className="flex flex-col items-center gap-2 my-6">
            <div className="bg-white p-3 rounded-2xl shadow-sm">
              <QRCodeSVG value={verifyUrl} size={160} level="M" />
            </div>
            <p className="text-xs text-gray-400">스캔하여 단증 검증</p>
          </div>
        )}

        {/* 블록체인 상태 */}
        <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-medium w-fit mx-auto ${hasNft ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
          <span>{hasNft ? '⛓' : '○'}</span>
          <span>{hasNft ? t('cert.blockchainDone') : t('cert.blockchainPending')}</span>
        </div>

        {/* 하단 */}
        <div className="mt-8 pt-6 border-t border-gray-200/60 text-center">
          <p className="text-xs text-gray-400">{t('cert.issuedBy')}</p>
        </div>
      </div>

      {/* 인쇄 스타일 */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #__next, #__next * { visibility: hidden; }
          [data-print-area], [data-print-area] * { visibility: visible; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  )
}
