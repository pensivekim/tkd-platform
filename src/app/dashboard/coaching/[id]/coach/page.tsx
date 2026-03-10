'use client'

import { useState, useEffect, useRef, use, FormEvent } from 'react'
import Link from 'next/link'
import { captureException } from '@/lib/sentry'
import { useLiveCoach } from '@/lib/useLiveCoachWebRTC'
import type { CoachingSession } from '@/types/coaching'

type Params = { params: Promise<{ id: string }> }

const COACH_PEER = 'coach'

type Summary = { participant_count: number; duration_minutes: number | null }

// ── 피드백 버튼 정의 ───────────────────────────────────────────
const FEEDBACK_BUTTONS = [
  { emoji: '👍', label: '잘했어요',    text: '👍 잘했어요!' },
  { emoji: '💪', label: '더 힘차게',   text: '💪 더 힘차게!' },
  { emoji: '⚠️', label: '자세 수정',   text: '⚠️ 자세를 수정해봐요' },
  { emoji: '🔄', label: '다시 해봐요', text: '🔄 다시 해봐요' },
] as const

// ── 참가자 영상 타일 (스탬프 포함) ──────────────────────────────
function RemoteTile({
  peerId, stream, displayName, stamp,
}: {
  peerId: string
  stream: MediaStream | null
  displayName: string
  stamp: string | null
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream])

  return (
    <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={false}
          className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="text-3xl mb-2">👤</div>
          <p className="text-xs">연결 중...</p>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">
        {displayName || peerId.slice(0, 8)}
      </div>
      {/* 스탬프 오버레이 */}
      {stamp && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-6xl animate-bounce drop-shadow-lg">{stamp}</span>
        </div>
      )}
    </div>
  )
}

// ── 세션 요약 모달 ─────────────────────────────────────────────
function SummaryModal({
  summary,
  sessionTitle,
  onClose,
}: {
  summary: Summary
  sessionTitle: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-white text-center">
        <div className="text-5xl mb-3">🎯</div>
        <h2 className="text-lg font-bold mb-1">세션 종료</h2>
        <p className="text-sm text-gray-400 mb-5 truncate">{sessionTitle}</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-2xl font-bold text-yellow-400">{summary.participant_count}</p>
            <p className="text-xs text-gray-400 mt-0.5">참가자</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-2xl font-bold text-green-400">
              {summary.duration_minutes != null ? `${summary.duration_minutes}분` : '-'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">진행 시간</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors text-sm"
        >
          확인
        </button>
      </div>
    </div>
  )
}

// ── 메인 페이지 ────────────────────────────────────────────────
export default function CoachSessionPage({ params }: Params) {
  const { id: sessionId } = use(params)
  const [session,   setSession]   = useState<CoachingSession | null>(null)
  const [started,   setStarted]   = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [copied,    setCopied]    = useState(false)
  const [summary,   setSummary]   = useState<Summary | null>(null)
  // peerId → stamp emoji (2초 후 자동 제거)
  const [stamps, setStamps] = useState<Map<string, string>>(new Map())
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef    = useRef<HTMLDivElement>(null)

  const {
    localStream, remoteStreams, participants,
    isMicOn, isCameraOn, messages,
    startSession, endSession,
    toggleMic, toggleCamera, sendMessage,
  } = useLiveCoach(sessionId, COACH_PEER)

  // 세션 정보 조회
  useEffect(() => {
    fetch('/api/coaching')
      .then((r) => r.json())
      .then((data) => {
        const found = (data.sessions ?? []).find((s: CoachingSession) => s.id === sessionId)
        setSession(found ?? null)
      })
      .catch((err) => captureException(err, { action: 'fetch_session_for_coach', sessionId }))
  }, [sessionId])

  // 내 영상 연결
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // 채팅 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleStart() {
    try {
      await startSession()
      setStarted(true)
    } catch (err) {
      captureException(err, { action: 'start_coaching_session', sessionId })
      alert('세션 시작에 실패했습니다.')
    }
  }

  async function handleEnd() {
    if (!confirm('세션을 종료하시겠습니까?')) return
    try {
      await endSession()
      setStarted(false)
      // 세션 요약 조회
      const res = await fetch(`/api/coaching/${sessionId}`)
      if (res.ok) {
        const data = await res.json() as { summary?: Summary }
        setSummary(data.summary ?? null)
      }
    } catch (err) {
      captureException(err, { action: 'end_coaching_session', sessionId })
      alert('세션 종료에 실패했습니다.')
    }
  }

  function handleCopyInvite() {
    if (!session?.invite_token) return
    const url = `${window.location.origin}/coach/${session.invite_token}`
    navigator.clipboard.writeText(url).catch(() => alert(`초대 링크: ${url}`))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    sendMessage(text, 'chat')
    setChatInput('')
  }

  // 피드백 전송 (모든 참가자) + 스탬프 표시
  function handleFeedback(emoji: string, text: string) {
    sendMessage(text, 'feedback')
    // 스탬프: 현재 연결된 모든 참가자에게 표시
    const newStamps = new Map<string, string>()
    participants.forEach((p) => newStamps.set(p.peer_id, emoji))
    setStamps(newStamps)
    setTimeout(() => setStamps(new Map()), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 상단바 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gray-900">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/coaching" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← 목록
          </Link>
          <span className="text-yellow-400 font-bold tracking-wider text-sm">DOJANGWAN</span>
          <span className="text-gray-600">|</span>
          <span className="font-semibold text-sm truncate max-w-[160px] sm:max-w-xs">
            {session?.title ?? '로딩 중...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            started ? 'bg-green-900/60 text-green-400' : 'bg-yellow-900/60 text-yellow-400'
          }`}>
            {started ? '진행중' : '대기중'}
          </span>
          <span className="text-xs text-gray-400">{participants.length}명 참가</span>
        </div>
      </div>

      {/* 메인 레이아웃 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: 참가자 영상 그리드 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* 피드백 버튼 바 */}
          {started && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {FEEDBACK_BUTTONS.map((fb) => (
                <button
                  key={fb.label}
                  onClick={() => handleFeedback(fb.emoji, fb.text)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 border border-white/10 text-xs text-white hover:bg-gray-700 transition-colors"
                >
                  <span>{fb.emoji}</span>
                  <span>{fb.label}</span>
                </button>
              ))}
            </div>
          )}

          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-600">
              <div className="text-5xl mb-4">🎯</div>
              <p className="font-medium">참가자를 기다리는 중...</p>
              <p className="text-sm mt-2 text-gray-700">초대 링크를 공유해주세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {participants.map((p) => (
                <RemoteTile
                  key={p.peer_id}
                  peerId={p.peer_id}
                  stream={remoteStreams.get(p.peer_id) ?? null}
                  displayName={p.display_name}
                  stamp={stamps.get(p.peer_id) ?? null}
                />
              ))}
            </div>
          )}
        </div>

        {/* 우측 패널 */}
        <div className="w-72 flex-shrink-0 border-l border-white/10 bg-gray-900 flex flex-col hidden md:flex">
          {/* 내 영상 */}
          <div className="p-3 border-b border-white/10">
            <p className="text-xs text-gray-500 mb-2 font-medium">내 화면 (코치)</p>
            <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden">
              {localStream ? (
                <video ref={localVideoRef} autoPlay playsInline muted
                  className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600">
                  <span className="text-2xl">🎥</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">
                코치
              </div>
            </div>
          </div>

          {/* 참가자 목록 */}
          <div className="p-3 border-b border-white/10">
            <p className="text-xs text-gray-500 mb-2 font-medium">참가자 ({participants.length})</p>
            {participants.length === 0 ? (
              <p className="text-xs text-gray-600">없음</p>
            ) : (
              <ul className="space-y-1">
                {participants.map((p) => (
                  <li key={p.peer_id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300 truncate">{p.display_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 채팅창 */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
            <p className="text-xs text-gray-500 font-medium flex-shrink-0">채팅</p>
            {messages.length === 0 ? (
              <p className="text-xs text-gray-700">메시지가 없습니다</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`text-xs ${msg.from === COACH_PEER ? 'text-right' : ''}`}>
                  <span className="text-gray-500 text-[10px]">{msg.displayName}</span>
                  <div className={`inline-block px-2 py-1 rounded-lg mt-0.5 max-w-[200px] break-words text-left ${
                    msg.type === 'feedback'
                      ? 'bg-yellow-900/60 text-yellow-200 ml-auto block'
                      : msg.from === COACH_PEER
                        ? 'bg-red-900/60 text-white ml-auto block'
                        : 'bg-gray-800 text-gray-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 메시지 입력 */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="메시지 입력..."
              className="flex-1 px-2 py-1.5 bg-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 min-w-0"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 flex-shrink-0"
            >
              전송
            </button>
          </form>
        </div>
      </div>

      {/* 하단 컨트롤바 */}
      <div className="px-4 py-3 bg-gray-900 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
        {/* 마이크 */}
        <button
          onClick={toggleMic}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            isMicOn
              ? 'border-white/20 text-white hover:bg-white/10'
              : 'border-red-500/50 bg-red-900/30 text-red-400'
          }`}
        >
          {isMicOn ? '🎤 마이크' : '🔇 마이크 꺼짐'}
        </button>

        {/* 카메라 */}
        <button
          onClick={toggleCamera}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            isCameraOn
              ? 'border-white/20 text-white hover:bg-white/10'
              : 'border-red-500/50 bg-red-900/30 text-red-400'
          }`}
        >
          {isCameraOn ? '📹 카메라' : '📷 카메라 꺼짐'}
        </button>

        {/* 초대 링크 */}
        <button
          onClick={handleCopyInvite}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/10 transition-colors"
        >
          {copied ? '✓ 복사됨' : '🔗 초대 링크'}
        </button>

        <div className="flex-1 hidden sm:block" />

        {/* 세션 시작 / 종료 */}
        {!started ? (
          <button
            onClick={handleStart}
            className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            ▶ 세션 시작
          </button>
        ) : (
          <button
            onClick={handleEnd}
            className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            ■ 세션 종료
          </button>
        )}
      </div>

      {/* 세션 요약 모달 */}
      {summary && session && (
        <SummaryModal
          summary={summary}
          sessionTitle={session.title}
          onClose={() => setSummary(null)}
        />
      )}
    </div>
  )
}
