"use client";

import { useCallback, useRef, useState } from "react";
import { API_BASE } from "@/lib/api";

const ICE = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
const POLL = 2000;

// ── BROADCASTER hook ────────────────────────────────────────────
export function useBroadcaster(eventId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIdRef = useRef(0);

  const signal = useCallback(async (toId: string, type: string, data: string) => {
    await fetch(`${API_BASE}/api/arena/${eventId}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_id: "broadcaster", to_id: toId, type, data }),
    });
  }, [eventId]);

  const connectViewer = useCallback(async (viewerId: string, offerData: string) => {
    const stream = localStreamRef.current;
    if (!stream || pcsRef.current.has(viewerId)) return;

    const pc = new RTCPeerConnection({ iceServers: ICE });
    pcsRef.current.set(viewerId, pc);
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.onicecandidate = async (e) => {
      if (e.candidate) await signal(viewerId, "ice-to-viewer", JSON.stringify(e.candidate));
    };

    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offerData)));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await signal(viewerId, "answer", JSON.stringify(answer));

    // Poll viewer ICE candidates
    let lastIceId = 0;
    const iceTimer = setInterval(async () => {
      const res = await fetch(`${API_BASE}/api/arena/${eventId}/signal?to_id=broadcaster&from_id=${viewerId}&type=ice-to-broadcaster&after=${lastIceId}`);
      if (!res.ok) return;
      const rows: { id: number; data: string }[] = await res.json();
      for (const row of rows) {
        try { await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(row.data))); lastIceId = row.id; } catch {}
      }
    }, POLL);

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        clearInterval(iceTimer);
        pcsRef.current.delete(viewerId);
        setViewerCount(pcsRef.current.size);
      }
    };
    setViewerCount(pcsRef.current.size);
  }, [eventId, signal]);

  const startCamera = useCallback(async (facingMode: "user" | "environment" = "environment") => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);

    // Replace tracks in existing PCs
    pcsRef.current.forEach(pc => {
      const senders = pc.getSenders();
      stream.getTracks().forEach(newTrack => {
        const sender = senders.find(s => s.track?.kind === newTrack.kind);
        if (sender) sender.replaceTrack(newTrack);
      });
    });
    return stream;
  }, []);

  const startBroadcast = useCallback(async () => {
    await fetch(`${API_BASE}/api/arena/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broadcast_status: "live", status: "live" }),
    });
    setBroadcasting(true);

    // Poll for viewer offers
    pollRef.current = setInterval(async () => {
      const res = await fetch(`${API_BASE}/api/arena/${eventId}/signal?to_id=broadcaster&type=offer&after=${lastIdRef.current}`);
      if (!res.ok) return;
      const rows: { id: number; from_id: string; data: string }[] = await res.json();
      for (const row of rows) {
        lastIdRef.current = row.id;
        await connectViewer(row.from_id, row.data);
      }
    }, POLL);
  }, [eventId, connectViewer]);

  const stopBroadcast = useCallback(async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pcsRef.current.forEach(pc => pc.close());
    pcsRef.current.clear();
    await fetch(`${API_BASE}/api/arena/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broadcast_status: "ended", status: "ended" }),
    });
    setBroadcasting(false);
    setViewerCount(0);
  }, [eventId]);

  const updateScoreboard = useCallback(async (scoreboard: object) => {
    await fetch(`${API_BASE}/api/arena/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoreboard: JSON.stringify(scoreboard) }),
    });
  }, [eventId]);

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pcsRef.current.forEach(pc => pc.close());
    localStreamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  return { localStream, broadcasting, viewerCount, startCamera, startBroadcast, stopBroadcast, updateScoreboard, cleanup };
}

// ── VIEWER hook ─────────────────────────────────────────────────
export function useViewer(eventId: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connState, setConnState] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const viewerIdRef = useRef(`viewer-${crypto.randomUUID()}`);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connect = useCallback(async () => {
    setConnState("connecting");
    const viewerId = viewerIdRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE });
    pcRef.current = pc;

    const stream = new MediaStream();
    pc.ontrack = (e) => { e.streams[0].getTracks().forEach(t => stream.addTrack(t)); setRemoteStream(stream); };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setConnState("connected");
      if (pc.connectionState === "failed" || pc.connectionState === "closed") setConnState("ended");
    };
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        await fetch(`${API_BASE}/api/arena/${eventId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from_id: viewerId, to_id: "broadcaster", type: "ice-to-broadcaster", data: JSON.stringify(e.candidate) }),
        });
      }
    };

    const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    await fetch(`${API_BASE}/api/arena/${eventId}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_id: viewerId, to_id: "broadcaster", type: "offer", data: JSON.stringify(offer) }),
    });

    // Poll for answer
    let answered = false;
    let lastIceId = 0;
    pollRef.current = setInterval(async () => {
      if (!answered) {
        const res = await fetch(`${API_BASE}/api/arena/${eventId}/signal?to_id=${viewerId}&from_id=broadcaster&type=answer`);
        if (res.ok) {
          const row: { data?: string } | null = await res.json();
          if (row?.data && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(row.data)));
            answered = true;
          }
        }
      }
      // Poll ICE candidates from broadcaster
      const ir = await fetch(`${API_BASE}/api/arena/${eventId}/signal?to_id=${viewerId}&from_id=broadcaster&type=ice-to-viewer&after=${lastIceId}`);
      if (ir.ok) {
        const rows: { id: number; data: string }[] = await ir.json();
        for (const row of rows) {
          try { await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(row.data))); lastIceId = row.id; } catch {}
        }
      }
    }, POLL);
  }, [eventId]);

  const disconnect = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pcRef.current?.close();
  }, []);

  return { remoteStream, connState, connect, disconnect };
}
