"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE } from "@/lib/api";

export type ConnState = "idle" | "connecting" | "connected" | "failed";

export interface TraineeEntry {
  participantId: string;
  name: string;
  dojangName: string;
  stream: MediaStream | null;
  score: number;
  connState: ConnState;
}

const ICE = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
const POLL = 1500;

// ────────────────────────────────────────────────────────────
// INSTRUCTOR hook (1:N)
// ────────────────────────────────────────────────────────────
export function useInstructorWebRTC(sessionId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [trainees, setTrainees] = useState<TraineeEntry[]>([]);
  const [micOn, setMicOn] = useState(true);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const icePollsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const iceTimesRef = useRef<Map<string, string>>(new Map());

  const signal = useCallback(async (toId: string, type: string, data: string) => {
    await fetch(`${API_BASE}/api/training/${sessionId}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_id: "instructor", to_id: toId, type, data }),
    });
  }, [sessionId]);

  const startIcePoll = useCallback((participantId: string) => {
    if (icePollsRef.current.has(participantId)) return;
    iceTimesRef.current.set(participantId, new Date(0).toISOString());
    const timer = setInterval(async () => {
      const after = iceTimesRef.current.get(participantId) ?? "";
      const res = await fetch(`${API_BASE}/api/training/${sessionId}/signal?to_id=instructor&from_id=${participantId}&type=ice-candidate&after=${after}`);
      if (!res.ok) return;
      const rows: { data: string; created_at: string }[] = await res.json();
      for (const row of rows) {
        try {
          const pc = pcsRef.current.get(participantId);
          await pc?.addIceCandidate(new RTCIceCandidate(JSON.parse(row.data)));
          iceTimesRef.current.set(participantId, row.created_at);
        } catch {}
      }
    }, POLL);
    icePollsRef.current.set(participantId, timer);
  }, [sessionId]);

  const createPCForTrainee = useCallback((participantId: string, name: string, dojangName: string, localStream: MediaStream) => {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    pcsRef.current.set(participantId, pc);

    // Instructor sends audio only (to reduce egress cost)
    localStream.getAudioTracks().forEach(t => pc.addTrack(t, localStream));

    pc.onicecandidate = async (e) => {
      if (e.candidate) await signal(participantId, "ice-candidate-to-trainee", JSON.stringify(e.candidate));
    };

    const remoteStream = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));
      setTrainees(prev => prev.map(tr => tr.participantId === participantId ? { ...tr, stream: remoteStream } : tr));
    };

    pc.ondatachannel = (e) => {
      e.channel.onmessage = (msg) => {
        try {
          const { score } = JSON.parse(msg.data);
          setTrainees(prev => prev.map(tr => tr.participantId === participantId ? { ...tr, score } : tr));
        } catch {}
      };
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      const cs: ConnState = state === "connected" ? "connected" : state === "failed" || state === "closed" ? "failed" : "connecting";
      setTrainees(prev => prev.map(tr => tr.participantId === participantId ? { ...tr, connState: cs } : tr));
    };

    setTrainees(prev => {
      if (prev.find(t => t.participantId === participantId)) return prev;
      return [...prev, { participantId, name, dojangName, stream: null, score: 0, connState: "connecting" }];
    });

    return pc;
  }, [signal]);

  const handleNewTrainee = useCallback(async (participantId: string, name: string, dojangName: string, offerData: string) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const pc = createPCForTrainee(participantId, name, dojangName, stream);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offerData)));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await signal(participantId, "answer", JSON.stringify(answer));
      startIcePoll(participantId);
    } catch (e) { console.error(e); }
  }, [createPCForTrainee, signal, startIcePoll]);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    setLocalStream(stream);

    // Poll for new trainee offers
    pollRef.current = setInterval(async () => {
      const res = await fetch(`${API_BASE}/api/training/${sessionId}/signal?to_id=instructor&type=offer`);
      if (!res.ok) return;
      const rows: { from_id: string; data: string; trainee_name?: string; dojang_name?: string }[] = await res.json();
      for (const row of rows) {
        if (!pcsRef.current.has(row.from_id)) {
          const nameRes = await fetch(`${API_BASE}/api/training/${sessionId}/participants`);
          const participants: { id: string; trainee_name: string; dojang_name: string }[] = await nameRes.json();
          const p = participants.find(x => x.id === row.from_id);
          await handleNewTrainee(row.from_id, p?.trainee_name ?? "Unknown", p?.dojang_name ?? "", row.data);
        }
      }
    }, POLL);
  }, [sessionId, handleNewTrainee]);

  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(v => !v);
  }, []);

  const stop = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    icePollsRef.current.forEach(t => clearInterval(t));
    pcsRef.current.forEach(pc => pc.close());
    localStreamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { localStream, trainees, micOn, start, stop, toggleMic };
}

// ────────────────────────────────────────────────────────────
// TRAINEE hook (1:1 to instructor)
// ────────────────────────────────────────────────────────────
export function useTraineeWebRTC(sessionId: string, participantId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [instructorStream, setInstructorStream] = useState<MediaStream | null>(null);
  const [connState, setConnState] = useState<ConnState>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const icePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iceTimeRef = useRef(new Date(0).toISOString());
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const signal = useCallback(async (type: string, data: string) => {
    await fetch(`${API_BASE}/api/training/${sessionId}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_id: participantId, to_id: "instructor", type, data }),
    });
  }, [sessionId, participantId]);

  const sendScore = useCallback((score: number) => {
    const dc = dataChannelRef.current;
    if (dc?.readyState === "open") dc.send(JSON.stringify({ score }));
  }, []);

  const start = useCallback(async () => {
    setConnState("connecting");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);

    const pc = new RTCPeerConnection({ iceServers: ICE });
    pcRef.current = pc;

    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    const dc = pc.createDataChannel("score");
    dataChannelRef.current = dc;

    pc.onicecandidate = async (e) => {
      if (e.candidate) await signal("ice-candidate", JSON.stringify(e.candidate));
    };

    const instStream = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach(t => instStream.addTrack(t));
      setInstructorStream(instStream);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") setConnState("connected");
      else if (state === "failed" || state === "closed") setConnState("failed");
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await signal("offer", JSON.stringify(offer));

    // Poll for answer
    pollRef.current = setInterval(async () => {
      const res = await fetch(`${API_BASE}/api/training/${sessionId}/signal?to_id=${participantId}&from_id=instructor&type=answer`);
      if (!res.ok) return;
      const row: { data?: string } | null = await res.json();
      if (!row?.data) return;
      try {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(row.data)));
          if (pollRef.current) clearInterval(pollRef.current);
          // Start ICE candidate poll
          icePollRef.current = setInterval(async () => {
            const ir = await fetch(`${API_BASE}/api/training/${sessionId}/signal?to_id=${participantId}&from_id=instructor&type=ice-candidate-to-trainee&after=${iceTimeRef.current}`);
            if (!ir.ok) return;
            const candidates: { data: string; created_at: string }[] = await ir.json();
            for (const c of candidates) {
              try { await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(c.data))); iceTimeRef.current = c.created_at; } catch {}
            }
          }, POLL);
        }
      } catch {}
    }, POLL);
  }, [sessionId, participantId, signal]);

  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(v => !v);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(v => !v);
  }, []);

  const stop = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (icePollRef.current) clearInterval(icePollRef.current);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { localStream, instructorStream, connState, micOn, camOn, start, stop, toggleMic, toggleCamera, sendScore };
}
