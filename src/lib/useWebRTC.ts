"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE } from "@/lib/api";

export type ConnectionState = "idle" | "connecting" | "connected" | "failed" | "disconnected";

interface UseWebRTCOptions {
  sessionId: string;
  role: "examiner" | "applicant";
  onDataChannel?: (channel: RTCDataChannel) => void;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const POLL_INTERVAL = 1500; // ms

export function useWebRTC({ sessionId, role, onDataChannel }: UseWebRTCOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const icePollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIceTimeRef = useRef<string>(new Date().toISOString());
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const signal = useCallback(async (type: string, data: string) => {
    await fetch(`${API_BASE}/api/webrtc/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, role, type, data }),
    });
  }, [sessionId, role]);

  const getSignal = useCallback(async (type: string) => {
    const res = await fetch(`${API_BASE}/api/webrtc/signal?session_id=${sessionId}&type=${type}`);
    return res.ok ? await res.json() : null;
  }, [sessionId]);

  const getIceCandidates = useCallback(async () => {
    const res = await fetch(
      `${API_BASE}/api/webrtc/signal?session_id=${sessionId}&type=ice-candidate&role=${role}&after=${lastIceTimeRef.current}`
    );
    return res.ok ? await res.json() as Array<{ data: string; created_at: string }> : [];
  }, [sessionId, role]);

  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    dataChannelRef.current = channel;
    setDataChannel(channel);
    onDataChannel?.(channel);
  }, [onDataChannel]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        await signal("ice-candidate", JSON.stringify(e.candidate));
      }
    };

    pc.ontrack = (e) => {
      const stream = new MediaStream();
      e.streams[0].getTracks().forEach(t => stream.addTrack(t));
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") setConnectionState("connected");
      else if (state === "failed" || state === "closed") setConnectionState("failed");
      else if (state === "disconnected") setConnectionState("disconnected");
    };

    pc.ondatachannel = (e) => {
      setupDataChannel(e.channel);
    };

    return pc;
  }, [signal, setupDataChannel]);

  const startIcePoll = useCallback(() => {
    icePollTimerRef.current = setInterval(async () => {
      const candidates = await getIceCandidates();
      if (!candidates.length) return;
      for (const row of candidates) {
        try {
          const candidate = JSON.parse(row.data);
          await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
          lastIceTimeRef.current = row.created_at;
        } catch {}
      }
    }, POLL_INTERVAL);
  }, [getIceCandidates]);

  const startAsApplicant = useCallback(async (stream: MediaStream) => {
    setConnectionState("connecting");
    const pc = createPeerConnection();

    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    const dc = pc.createDataChannel("pose");
    setupDataChannel(dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await signal("offer", JSON.stringify(offer));

    // Poll for answer
    pollTimerRef.current = setInterval(async () => {
      const row = await getSignal("answer");
      if (!row?.data) return;
      try {
        const answer = JSON.parse(row.data);
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          startIcePoll();
        }
      } catch {}
    }, POLL_INTERVAL);
  }, [createPeerConnection, signal, getSignal, setupDataChannel, startIcePoll]);

  const startAsExaminer = useCallback(async (stream: MediaStream) => {
    setConnectionState("connecting");
    const pc = createPeerConnection();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    // Poll for offer
    pollTimerRef.current = setInterval(async () => {
      const row = await getSignal("offer");
      if (!row?.data) return;
      try {
        const offer = JSON.parse(row.data);
        if (pc.signalingState !== "stable") return;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await signal("answer", JSON.stringify(answer));
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        startIcePoll();
      } catch {}
    }, POLL_INTERVAL);
  }, [createPeerConnection, signal, getSignal, startIcePoll]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (role === "applicant") {
        await startAsApplicant(stream);
      } else {
        await startAsExaminer(stream);
      }
    } catch (e) {
      console.error("WebRTC start error:", e);
      setConnectionState("failed");
    }
  }, [role, startAsApplicant, startAsExaminer]);

  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
  }, []);

  const stop = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (icePollTimerRef.current) clearInterval(icePollTimerRef.current);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("disconnected");
  }, []);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (icePollTimerRef.current) clearInterval(icePollTimerRef.current);
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return {
    connectionState,
    localStream,
    remoteStream,
    dataChannel,
    start,
    stop,
    toggleMic,
    toggleCamera,
  };
}
