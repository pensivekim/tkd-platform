"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useTraineeWebRTC } from "@/lib/useTrainingWebRTC";
import { API_BASE } from "@/lib/api";
import PoseOverlay from "@/components/ai/PoseOverlay";
import PoseScore from "@/components/ai/PoseScore";
import { computePoseScore, resetStability } from "@/lib/pose-scoring";
import type { Landmark } from "@/lib/pose-scoring";

interface Session { id: string; title: string; poomsae_type: string; instructor_name: string }

declare global {
  interface Window {
    Pose: new (config: unknown) => {
      setOptions: (opts: unknown) => void;
      onResults: (cb: (results: { poseLandmarks?: Landmark[] }) => void) => void;
      send: (input: { image: HTMLVideoElement }) => Promise<void>;
      close: () => void;
    };
    Camera: new (video: HTMLVideoElement, opts: { onFrame: () => Promise<void>; width: number; height: number }) => { start: () => void; stop: () => void };
  }
}

export default function TraineePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<"join" | "ready">("join");
  const [name, setName] = useState("");
  const [dojang, setDojang] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [aiScore, setAiScore] = useState({ total: 0, visibility: 0, symmetry: 0, stability: 0 });
  const [poseReady, setPoseReady] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const handleJoin = async () => {
    if (!name.trim()) return;
    const res = await fetch(`${API_BASE}/api/training/${sessionId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainee_name: name, dojang_name: dojang }),
    });
    const data = await res.json();
    setParticipantId(data.id);
    setPhase("ready");
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/training/${sessionId}`)
      .then(r => r.json()).then(setSession).catch(console.error);
  }, [sessionId]);

  const { localStream, instructorStream, connState, micOn, camOn, start, stop, toggleMic, toggleCamera, sendScore } =
    useTraineeWebRTC(sessionId, participantId);

  useEffect(() => {
    if (phase === "ready" && participantId) {
      resetStability();
      start();
    }
    return () => { if (phase === "ready") stop(); };
  }, [phase, participantId, start, stop]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  // Load MediaPipe from CDN
  useEffect(() => {
    if (phase !== "ready" || !localStream) return;

    const loadPose = () => {
      if (!localVideoRef.current || !window.Pose) return;
      const video = localVideoRef.current;

      const pose = new window.Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      pose.onResults((results) => {
        if (!results.poseLandmarks) return;
        const lms = results.poseLandmarks;
        setLandmarks(lms);
        const score = computePoseScore(lms);
        setAiScore(score);
        sendScore(score.total);
      });

      const camera = new window.Camera(video, {
        onFrame: async () => { if (video.readyState >= 2) await pose.send({ image: video }); },
        width: 640, height: 480,
      });
      camera.start();
      setPoseReady(true);
      return () => { camera.stop(); pose.close(); };
    };

    if (!window.Pose) {
      const s1 = document.createElement("script");
      s1.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js";
      s1.crossOrigin = "anonymous";
      document.head.appendChild(s1);
      const s2 = document.createElement("script");
      s2.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js";
      s2.crossOrigin = "anonymous";
      s2.onload = () => { setTimeout(loadPose, 500); };
      document.head.appendChild(s2);
    } else { loadPose(); }
  }, [phase, localStream, sendScore]);

  // Instructor audio to speaker
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current && instructorStream) audioRef.current.srcObject = instructorStream;
  }, [instructorStream]);

  // ── Join form ──
  if (phase === "join") {
    return (
      <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 3, color: "#E9C46A", marginBottom: 24 }}>TKP</div>
        <div style={{ background: "#0E0E18", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>🎓 {t("training.joinTraining")}</h1>
          {session && <p style={{ color: "#606070", fontSize: 14, marginBottom: 28 }}>{session.title} · {session.poomsae_type}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("training.yourName")} *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="이름 입력"
                style={{ width: "100%", background: "#1A1A26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 16px", color: "#F0F0F5", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("training.dojangName")}</label>
              <input value={dojang} onChange={e => setDojang(e.target.value)} placeholder="도장명 (선택)"
                style={{ width: "100%", background: "#1A1A26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 16px", color: "#F0F0F5", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={handleJoin} disabled={!name.trim()}
              style={{ padding: "14px", background: name.trim() ? "#E9C46A" : "rgba(255,255,255,0.05)", color: name.trim() ? "#0A0A0F" : "#404050", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              {t("training.join")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main training view ──
  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: "#E9C46A" }}>TKP</span>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>🎓 {t("training.traineeView")}</span>
        </div>
        {session && (
          <div style={{ fontSize: 13, color: "#909090" }}>
            <span style={{ color: "#E9C46A", fontWeight: 700 }}>{session.title}</span>
            <span> · {session.poomsae_type}</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, padding: 16, maxWidth: 1100, margin: "0 auto" }}>
        {/* Camera + skeleton */}
        <div>
          <div style={{ position: "relative", background: "#0A0A14", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", aspectRatio: "16/9" }}>
            <video ref={localVideoRef} autoPlay playsInline muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            <PoseOverlay videoRef={localVideoRef} landmarks={landmarks} />
            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>
              {name} {poseReady ? "· AI 분석 🟢" : "· AI 로딩..."}
            </div>
            <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.7)", padding: "3px 10px", borderRadius: 20, fontSize: 12, display: "flex", alignItems: "center", gap: 5, color: connState === "connected" ? "#4ade80" : connState === "connecting" ? "#E9C46A" : "#606070" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              {connState === "connected" ? t("exam.connected") : connState === "connecting" ? t("exam.connecting") : t("exam.disconnected")}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={toggleMic} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: micOn ? "rgba(255,255,255,0.07)" : "rgba(230,57,70,0.2)", color: micOn ? "#F0F0F5" : "#E63946", cursor: "pointer", fontSize: 13 }}>
              {micOn ? `🎤 ${t("exam.micOn")}` : `🔇 ${t("exam.micOff")}`}
            </button>
            <button onClick={toggleCamera} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: camOn ? "rgba(255,255,255,0.07)" : "rgba(230,57,70,0.2)", color: camOn ? "#F0F0F5" : "#E63946", cursor: "pointer", fontSize: 13 }}>
              {camOn ? `📷 ${t("exam.cameraOn")}` : `📷 ${t("exam.cameraOff")}`}
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <PoseScore {...aiScore} />
          <div style={{ background: "#0E0E18", border: "1px solid rgba(233,196,106,0.2)", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#909090", lineHeight: 1.7 }}>
            {connState === "connected" ? (
              <span style={{ color: "#4ade80" }}>✅ 강사와 연결됐습니다.</span>
            ) : (
              <span>{t("training.waitingInstructor")}</span>
            )}
          </div>
          <div style={{ background: "#0E0E18", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#606070" }}>
            스마트폰 가로 모드를 권장합니다. 전신이 카메라에 잘 보이도록 거리를 조절해주세요.
          </div>
        </div>
      </div>
    </div>
  );
}
