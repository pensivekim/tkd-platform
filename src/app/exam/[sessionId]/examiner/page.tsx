"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import VideoPlayer from "@/components/webrtc/VideoPlayer";
import PoseOverlay from "@/components/ai/PoseOverlay";
import ScorePanel from "@/components/exam/ScorePanel";
import { useWebRTC } from "@/lib/useWebRTC";
import type { Landmark } from "@/lib/pose-scoring";
import { computePoseScore, resetStability } from "@/lib/pose-scoring";
import { API_BASE } from "@/lib/api";

interface Session {
  id: string;
  examiner_name: string;
  poomsae_type: string;
  dan_level: number;
  status: string;
  applicant_name: string | null;
}

export default function ExaminerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [aiScore, setAiScore] = useState({ total: 0, visibility: 0, symmetry: 0, stability: 0 });
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const handleDataChannel = useCallback((channel: RTCDataChannel) => {
    channel.onmessage = (e) => {
      try {
        const lms: Landmark[] = JSON.parse(e.data);
        setLandmarks(lms);
        setAiScore(computePoseScore(lms));
      } catch {}
    };
  }, []);

  const { connectionState, localStream, remoteStream, start, stop, toggleMic, toggleCamera } = useWebRTC({
    sessionId,
    role: "examiner",
    onDataChannel: handleDataChannel,
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/exam?id=${sessionId}`)
      .then(r => r.json())
      .then(setSession)
      .catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    resetStability();
    start();
    return () => stop();
  }, [start, stop]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleMicToggle = () => { toggleMic(); setMicOn(v => !v); };
  const handleCamToggle = () => { toggleCamera(); setCamOn(v => !v); };

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit', sans-serif", color: "#F0F0F5" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/exam" style={{ color: "#E63946", textDecoration: "none", fontSize: 13 }}>← 목록</Link>
          <span style={{ fontWeight: 700 }}>🥋 심사위원 화면</span>
        </div>
        {session && (
          <div style={{ fontSize: 13, color: "#909090" }}>
            <span style={{ color: "#E9C46A", fontWeight: 700 }}>{session.poomsae_type}</span>
            <span> · {session.dan_level}단 · 심사위원: {session.examiner_name}</span>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, padding: 16, maxWidth: 1200, margin: "0 auto" }}>
        {/* Left: applicant video */}
        <div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "relative", background: "#0A0A14", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", aspectRatio: "16/9" }}>
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#404050" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🥋</div>
                    <div style={{ fontSize: 14 }}>응시자 연결 대기 중...</div>
                  </div>
                </div>
              )}
              <PoseOverlay videoRef={remoteVideoRef} landmarks={landmarks} />
              {/* Connection status */}
              <div style={{ position: "absolute", top: 10, left: 10 }}>
                <span style={{
                  background: "rgba(0,0,0,0.7)", padding: "4px 12px", borderRadius: 20,
                  fontSize: 12, display: "flex", alignItems: "center", gap: 6,
                  color: connectionState === "connected" ? "#4ade80" : connectionState === "connecting" ? "#facc15" : "#E63946",
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                  {connectionState === "connected" ? "연결됨" : connectionState === "connecting" ? "연결 중..." : "대기"}
                </span>
              </div>
              <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>
                응시자 영상
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button onClick={handleMicToggle} style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
              background: micOn ? "rgba(255,255,255,0.07)" : "rgba(230,57,70,0.2)",
              color: micOn ? "#F0F0F5" : "#E63946", cursor: "pointer", fontSize: 14,
            }}>
              {micOn ? "🎤 마이크 ON" : "🔇 마이크 OFF"}
            </button>
            <button onClick={handleCamToggle} style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
              background: camOn ? "rgba(255,255,255,0.07)" : "rgba(230,57,70,0.2)",
              color: camOn ? "#F0F0F5" : "#E63946", cursor: "pointer", fontSize: 14,
            }}>
              {camOn ? "📷 카메라 ON" : "📷 카메라 OFF"}
            </button>
            <button onClick={stop} style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(230,57,70,0.4)",
              background: "rgba(230,57,70,0.15)", color: "#E63946", cursor: "pointer", fontSize: 14,
            }}>
              심사 종료
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* My camera PIP */}
          <VideoPlayer stream={localStream} muted label="내 카메라" mirrored style={{ aspectRatio: "4/3" }} />

          {/* Score panel */}
          <ScorePanel sessionId={sessionId} aiScore={aiScore} />
        </div>
      </div>
    </div>
  );
}
