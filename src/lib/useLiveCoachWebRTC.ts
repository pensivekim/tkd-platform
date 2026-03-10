"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CoachingParticipant } from "@/types/coaching";

// ── 상수 ─────────────────────────────────────────────────────────
const ICE = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
const POLL = 1500; // ms

// ── 타입 ─────────────────────────────────────────────────────────
export interface ChatMessage {
  id:          string;
  from:        string;  // peerId
  displayName: string;
  text:        string;
  timestamp:   number;
  type:        'chat' | 'feedback' | 'stamp';
}

type SignalRow = {
  id:         string;
  from_peer:  string;
  type:       string;
  payload:    RTCSessionDescriptionInit | RTCIceCandidateInit | ChatMessage;
  created_at: string;
};

// ── 시그널링 헬퍼 ─────────────────────────────────────────────────
async function sendSignal(
  sessionId: string,
  fromPeer:  string,
  toPeer:    string,
  type:      string,
  payload:   unknown,
) {
  await fetch(`/api/coaching/${sessionId}/signal`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ from_peer: fromPeer, to_peer: toPeer, type, payload }),
  });
}

async function pollSignals(sessionId: string, peerId: string): Promise<SignalRow[]> {
  const res = await fetch(`/api/coaching/${sessionId}/signal?peer_id=${peerId}`);
  if (!res.ok) return [];
  const data = await res.json() as { signals?: SignalRow[] };
  return data.signals ?? [];
}

// ════════════════════════════════════════════════════════════════
// COACH 훅 — 1:N (코치 ↔ 참가자 여러 명)
// ════════════════════════════════════════════════════════════════
export function useLiveCoach(sessionId: string, peerId: string) {
  const [localStream,   setLocalStream]   = useState<MediaStream | null>(null);
  const [remoteStreams,  setRemoteStreams]  = useState<Map<string, MediaStream>>(new Map());
  const [participants,  setParticipants]  = useState<CoachingParticipant[]>([]);
  const [isMicOn,       setIsMicOn]       = useState(true);
  const [isCameraOn,    setIsCameraOn]    = useState(true);
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);

  const localStreamRef  = useRef<MediaStream | null>(null);
  const pcsRef          = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConnected = pcsRef.current.size > 0;

  // 참가자별 PC 생성
  const createPCForParticipant = useCallback((participantPeerId: string) => {
    const stream = localStreamRef.current;
    if (!stream) return null;

    const pc = new RTCPeerConnection({ iceServers: ICE });
    pcsRef.current.set(participantPeerId, pc);

    // 코치 스트림 전송 (비디오 + 오디오)
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    // ICE candidate 전송
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        await sendSignal(sessionId, peerId, participantPeerId, "ice-candidate", e.candidate.toJSON());
      }
    };

    // 참가자 스트림 수신
    const remoteStream = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      setRemoteStreams((prev) => new Map(prev).set(participantPeerId, remoteStream));
    };

    // DataChannel (참가자가 생성하는 채널 수신)
    pc.ondatachannel = (e) => {
      const ch = e.channel;
      dataChannelsRef.current.set(participantPeerId, ch);
      ch.onmessage = (msg) => {
        try {
          const raw = JSON.parse(msg.data) as ChatMessage;
          const data: ChatMessage = { ...raw, type: raw.type ?? 'chat' };
          setMessages((prev) => [...prev, data]);
        } catch {}
      };
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        pcsRef.current.delete(participantPeerId);
        dataChannelsRef.current.delete(participantPeerId);
        setRemoteStreams((prev) => { const m = new Map(prev); m.delete(participantPeerId); return m; });
      }
    };

    return pc;
  }, [sessionId, peerId]);

  // 새 참가자 offer 처리
  const handleParticipantOffer = useCallback(async (participantPeerId: string, offer: RTCSessionDescriptionInit) => {
    if (pcsRef.current.has(participantPeerId)) return;
    const pc = createPCForParticipant(participantPeerId);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal(sessionId, peerId, participantPeerId, "answer", answer);
    } catch (e) {
      console.error("[LiveCoach] offer 처리 실패:", e);
    }
  }, [sessionId, peerId, createPCForParticipant]);

  // 카메라 + 마이크 시작
  const initStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // 세션 시작 (status → active)
  const startSession = useCallback(async () => {
    await initStream();

    await fetch(`/api/coaching/${sessionId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "active" }),
    });

    // 참가자 목록 초기 조회
    const res = await fetch(`/api/coaching/${sessionId}/participants`);
    if (res.ok) {
      const data = await res.json() as { participants?: CoachingParticipant[] };
      setParticipants(data.participants ?? []);
    }

    // 시그널 폴링 시작
    pollRef.current = setInterval(async () => {
      const signals = await pollSignals(sessionId, peerId);

      for (const sig of signals) {
        if (sig.type === "offer") {
          await handleParticipantOffer(sig.from_peer, sig.payload as RTCSessionDescriptionInit);
        } else if (sig.type === "ice-candidate") {
          const pc = pcsRef.current.get(sig.from_peer);
          if (pc) {
            try { await pc.addIceCandidate(new RTCIceCandidate(sig.payload as RTCIceCandidateInit)); } catch {}
          }
        }
      }

      // 참가자 목록 갱신
      const pRes = await fetch(`/api/coaching/${sessionId}/participants`);
      if (pRes.ok) {
        const pData = await pRes.json() as { participants?: CoachingParticipant[] };
        setParticipants(pData.participants ?? []);
      }
    }, POLL);
  }, [sessionId, peerId, initStream, handleParticipantOffer]);

  // 세션 종료 (status → ended)
  const endSession = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    dataChannelsRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStreams(new Map());

    await fetch(`/api/coaching/${sessionId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "ended" }),
    });
  }, [sessionId]);

  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMicOn((v) => !v);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOn((v) => !v);
  }, []);

  // 전체 참가자에게 채팅/피드백/스탬프 메시지 전송 (DataChannel)
  const sendMessage = useCallback((text: string, type: ChatMessage['type'] = 'chat') => {
    const msg: ChatMessage = {
      id:          crypto.randomUUID(),
      from:        peerId,
      displayName: "코치",
      text,
      timestamp:   Date.now(),
      type,
    };
    dataChannelsRef.current.forEach((ch) => {
      if (ch.readyState === "open") ch.send(JSON.stringify(msg));
    });
    setMessages((prev) => [...prev, msg]);
  }, [peerId]);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pcsRef.current.forEach((pc) => pc.close());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return {
    localStream,
    remoteStreams,
    participants,
    isConnected,
    isMicOn,
    isCameraOn,
    messages,
    startSession,
    endSession,
    toggleMic,
    toggleCamera,
    sendMessage,
  };
}

// ════════════════════════════════════════════════════════════════
// PARTICIPANT 훅 — 참가자 (1:1 with coach)
// ════════════════════════════════════════════════════════════════
export function useLiveCoachParticipant(
  sessionId:   string,
  peerId:      string,
  inviteToken: string,
) {
  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null);
  const [coachStream,  setCoachStream]  = useState<MediaStream | null>(null);
  const [isConnected,  setIsConnected]  = useState(false);
  const [isMicOn,      setIsMicOn]      = useState(true);
  const [isCameraOn,   setIsCameraOn]   = useState(true);
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);

  const localStreamRef  = useRef<MediaStream | null>(null);
  const pcRef           = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef  = useRef<RTCDataChannel | null>(null);
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const displayNameRef  = useRef<string>("");

  const COACH_PEER = "coach";

  const joinSession = useCallback(async (displayName: string, studentId?: string) => {
    displayNameRef.current = displayName;

    // 스트림 획득
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);

    // 참가자 등록
    await fetch(`/api/coaching/${sessionId}/participants?invite_token=${inviteToken}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ peer_id: peerId, display_name: displayName, student_id: studentId }),
    });

    // PeerConnection 생성
    const pc = new RTCPeerConnection({ iceServers: ICE });
    pcRef.current = pc;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    // DataChannel 생성 (참가자가 생성 → 코치가 ondatachannel로 수신)
    const dc = pc.createDataChannel("chat");
    dataChannelRef.current = dc;
    dc.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data) as ChatMessage;
        const msg: ChatMessage = { ...raw, type: raw.type ?? 'chat' };
        setMessages((prev) => [...prev, msg]);
      } catch {}
    };

    // 코치 스트림 수신
    const remote = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => remote.addTrack(t));
      setCoachStream(new MediaStream(remote.getTracks()));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setIsConnected(true);
      if (pc.connectionState === "failed" || pc.connectionState === "closed") setIsConnected(false);
    };

    // ICE candidate → 코치로 전송
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        await sendSignal(sessionId, peerId, COACH_PEER, "ice-candidate", e.candidate.toJSON());
      }
    };

    // Offer 생성 → 코치로 전송
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendSignal(sessionId, peerId, COACH_PEER, "offer", offer);

    // Answer + ICE 폴링
    let answered = false;
    pollRef.current = setInterval(async () => {
      const signals = await pollSignals(sessionId, peerId);
      for (const sig of signals) {
        if (!answered && sig.type === "answer") {
          try {
            if (pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.payload as RTCSessionDescriptionInit));
              answered = true;
            }
          } catch {}
        } else if (sig.type === "ice-candidate") {
          try { await pc.addIceCandidate(new RTCIceCandidate(sig.payload as RTCIceCandidateInit)); } catch {}
        }
      }
    }, POLL);
  }, [sessionId, peerId, inviteToken]);

  const leaveSession = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setCoachStream(null);
    setIsConnected(false);

    await fetch(`/api/coaching/${sessionId}/participants/${peerId}`, { method: "DELETE" });
  }, [sessionId, peerId]);

  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMicOn((v) => !v);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOn((v) => !v);
  }, []);

  // 코치에게 채팅 메시지 전송 (DataChannel)
  const sendMessage = useCallback((text: string, type: ChatMessage['type'] = 'chat') => {
    const msg: ChatMessage = {
      id:          crypto.randomUUID(),
      from:        peerId,
      displayName: displayNameRef.current,
      text,
      timestamp:   Date.now(),
      type,
    };
    const dc = dataChannelRef.current;
    if (dc?.readyState === "open") dc.send(JSON.stringify(msg));
    setMessages((prev) => [...prev, msg]);
  }, [peerId]);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return {
    localStream,
    coachStream,
    isConnected,
    isMicOn,
    isCameraOn,
    messages,
    joinSession,
    leaveSession,
    toggleMic,
    toggleCamera,
    sendMessage,
  };
}
