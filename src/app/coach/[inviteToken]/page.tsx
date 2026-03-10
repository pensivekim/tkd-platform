'use client'

import { useState, useEffect, useRef, use, FormEvent } from 'react'
import { captureException } from '@/lib/sentry'
import { useLiveCoachParticipant } from '@/lib/useLiveCoachWebRTC'

type Params = { params: Promise<{ inviteToken: string }> }

type SessionInfo = {
  id:                   string
  title:                string
  description:          string | null
  type:                 string
  status:               string
  dojang_name:          string
  max_participants:     number
  current_participants: number
}

// ── 입장 전 화면 ────────────────────────────────────────────────
function PreJoinScreen({
  session,
  onJoin,
}: {
  session: SessionInfo
  onJoin: (name: string) => Promise<void>
}) {
  const [displayName, setDisplayName] = useState('')
  const [isJoining,   setIsJoining]   = useState(false)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const previewRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setPreviewStream(stream)
        if (previewRef.current) previewRef.current.srcObject = stream
      })
      .catch(() => {})
    return () => { previewStream?.getTracks().forEach((t) => t.stop()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return
    setIsJoining(true)
    previewStream?.getTracks().forEach((t) => t.stop())
    try {
      await onJoin(displayName.trim())
    } catch {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <span className="text-3xl">🥋</span>
          <h1 className="text-xl font-bold text-yellow-400 mt-2">도장관 라이브 코칭</h1>
          <p className="text-sm text-gray-400 mt-1">{session.dojang_name}</p>
        </div>

        {/* 세션 정보 */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-5 border border-white/10">
          <p className="font-semibold text-white">{session.title}</p>
          {session.description && <p className="text-sm text-gray-400 mt-1">{session.description}</p>}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300">
              {session.type === 'group' ? '그룹' : '1:1 개인'}
            </span>
            <span className="text-xs text-gray-500">
              {session.current_participants}/{session.max_participants}명 참가중
            </span>
          </div>
        </div>

        {/* 카메라 미리보기 */}
        <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden mb-5">
          {previewStream ? (
            <video ref={previewRef} autoPlay playsInline muted
              className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <div className="text-3xl mb-2">🎥</div>
              <p className="text-xs">카메라 로딩 중...</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded-full text-xs text-gray-300">
            미리보기
          </div>
        </div>

        {/* 이름 입력 + 입장 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="이름을 입력하세요"
            maxLength={20}
            required
            disabled={isJoining}
            className="w-full px-4 py-3 bg-gray-900 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!displayName.trim() || isJoining}
            className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isJoining ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                입장 중...
              </span>
            ) : '입장하기'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── 세션 화면 ────────────────────────────────────────────────────
function SessionScreen({
  sessionId,
  peerId,
  inviteToken,
  displayName,
}: {
  sessionId:   string
  peerId:      string
  inviteToken: string
  displayName: string
}) {
  const [chatInput, setChatInput] = useState('')
  const coachVideoRef = useRef<HTMLVideoElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const chatEndRef    = useRef<HTMLDivElement>(null)

  const {
    localStream, coachStream, isConnected,
    isMicOn, isCameraOn, messages,
    joinSession, leaveSession,
    toggleMic, toggleCamera, sendMessage,
  } = useLiveCoachParticipant(sessionId, peerId, inviteToken)

  useEffect(() => {
    joinSession(displayName).catch((err) =>
      captureException(err, { action: 'join_coaching_session', sessionId })
    )
    return () => { leaveSession().catch(() => {}) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (coachVideoRef.current && coachStream) coachVideoRef.current.srcObject = coachStream
  }, [coachStream])

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream
  }, [localStream])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend(e: FormEvent) {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    sendMessage(text)
    setChatInput('')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* 상단바 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold text-sm">DOJANGWAN</span>
          <span className="text-gray-600">|</span>
          <span className="text-sm text-gray-300 truncate max-w-[140px]">라이브 코칭</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          isConnected ? 'bg-green-900/60 text-green-400' : 'bg-yellow-900/60 text-yellow-400'
        }`}>
          {isConnected ? '연결됨' : '연결 중...'}
        </span>
      </div>

      {/* 메인: 코치 영상 (위) + 채팅 (옆) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: 영상 영역 */}
        <div className="flex-1 flex flex-col p-3 gap-3">
          {/* 코치 영상 (크게) */}
          <div className="flex-1 relative bg-gray-800 rounded-xl overflow-hidden min-h-0">
            {coachStream ? (
              <video ref={coachVideoRef} autoPlay playsInline
                className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 min-h-[160px]">
                <div className="text-4xl mb-2">👨‍🏫</div>
                <p className="text-sm">코치 연결 대기 중...</p>
              </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded-full text-xs">코치</div>

            {/* 내 영상 (PIP) */}
            <div className="absolute bottom-3 right-3 w-24 aspect-video bg-gray-700 rounded-lg overflow-hidden shadow-lg border border-white/20">
              {localStream ? (
                <video ref={localVideoRef} autoPlay playsInline muted
                  className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600 text-xs">나</div>
              )}
            </div>
          </div>
        </div>

        {/* 우측: 채팅 */}
        <div className="w-64 flex-shrink-0 border-l border-white/10 bg-gray-900 flex flex-col hidden sm:flex">
          <div className="p-3 border-b border-white/10">
            <p className="text-xs text-gray-500 font-medium">채팅</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-700">메시지가 없습니다</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`text-xs ${msg.from === peerId ? 'text-right' : ''}`}>
                  <span className="text-gray-500 text-[10px]">{msg.displayName}</span>
                  <div className={`inline-block px-2 py-1 rounded-lg mt-0.5 max-w-[180px] break-words text-left ${
                    msg.from === peerId ? 'bg-red-900/60 text-white ml-auto block' : 'bg-gray-800 text-gray-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="메시지..."
              className="flex-1 px-2 py-1.5 bg-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20 min-w-0"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-2 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-40 flex-shrink-0"
            >
              전송
            </button>
          </form>
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div className="px-4 py-3 bg-gray-900 border-t border-white/10 flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={toggleMic}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            isMicOn ? 'border-white/20 text-white hover:bg-white/10' : 'border-red-500/50 bg-red-900/30 text-red-400'
          }`}
        >
          {isMicOn ? '🎤 마이크' : '🔇 꺼짐'}
        </button>
        <button
          onClick={toggleCamera}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            isCameraOn ? 'border-white/20 text-white hover:bg-white/10' : 'border-red-500/50 bg-red-900/30 text-red-400'
          }`}
        >
          {isCameraOn ? '📹 카메라' : '📷 꺼짐'}
        </button>
        <button
          onClick={() => leaveSession().catch(() => {})}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-red-700/40 border border-red-500/50 text-red-300 hover:bg-red-700/60 transition-colors"
        >
          나가기
        </button>
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────
export default function CoachInvitePage({ params }: Params) {
  const { inviteToken } = use(params)
  const [session,      setSession]      = useState<SessionInfo | null>(null)
  const [isLoading,    setIsLoading]    = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [displayName,  setDisplayName]  = useState<string | null>(null)
  const peerIdRef = useRef<string>('')

  // peerId는 마운트 시 1회 생성
  useEffect(() => {
    peerIdRef.current = crypto.randomUUID()
  }, [])

  useEffect(() => {
    fetch(`/api/public/coaching/${inviteToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        setSession(data.session)
      })
      .catch((err) => {
        captureException(err, { action: 'fetch_public_coaching', inviteToken })
        setError('세션을 불러오지 못했습니다.')
      })
      .finally(() => setIsLoading(false))
  }, [inviteToken])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🚫</p>
          <p className="text-white font-medium">{error ?? '세션을 찾을 수 없습니다.'}</p>
        </div>
      </div>
    )
  }

  if (!displayName) {
    return (
      <PreJoinScreen
        session={session}
        onJoin={async (name) => setDisplayName(name)}
      />
    )
  }

  return (
    <SessionScreen
      sessionId={session.id}
      peerId={peerIdRef.current}
      inviteToken={inviteToken}
      displayName={displayName}
    />
  )
}
