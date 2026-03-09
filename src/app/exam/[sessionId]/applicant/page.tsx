"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import VideoPlayer from "@/components/webrtc/VideoPlayer";
import PoseOverlay from "@/components/ai/PoseOverlay";
import PoseScore from "@/components/ai/PoseScore";
import { useWebRTC } from "@/lib/useWebRTC";
import type { Landmark } from "@/lib/pose-scoring";
import { computePoseScore, resetStability } from "@/lib/pose-scoring";
import { API_BASE } from "@/lib/api";

interface Session {
  id: string;
  poomsae_type: string;
  dan_level: number;
  status: string;
}

// MediaPipe Pose — CDN 방식으로 로드
declare global {
  interface Window {
    Pose: new (config: unknown) => {
      setOptions: (opts: unknown) => void;
      onResults: (cb: (results: { poseLandmarks?: Landmark[] }) => void) => void;
      send: (input: { image: HTMLVideoElement }) => Promise<void>;
      close: () => void;
    };
    Camera: new (video: HTMLVideoElement, opts: {
      onFrame: () => Promise<void>;
      width: number;
      height: number;
    }) => { start: () => void; stop: () => void };
  }
}

export default function ApplicantPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [poseReady, setPoseReady] = useState(false);
  const [aiScore, setAiScore] = useState({ total: 0, visibility: 0, symmetry: 0, stability: 0 });
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const poseRef = useRef<InstanceType<typeof window.Pose> | null>(null);
  const cameraRef = useRef<InstanceType<typeof window.Camera> | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const handleDataChannel = useCallback((channel: RTCDataChannel) => {
    dataChannelRef.current = channel;
  }, []);

  const { connectionState, localStream, remoteStream, start, stop, toggleMic, toggleCamera } = useWebRTC({
    sessionId,
    role: "applicant",
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

  // Assign local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Load MediaPipe from CDN
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadPose = () => {
      if (!localVideoRef.current || !localStream) return;

      const video = localVideoRef.current;
      const pose = new window.Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        if (!results.poseLandmarks) return;
        const lms = results.poseLandmarks;
        setLandmarks(lms);
        const score = computePoseScore(lms);
        setAiScore(score);

        // DataChannel로 심사위원에게 키포인트 전송
        const dc = dataChannelRef.current;
        if (dc && dc.readyState === "open") {
          dc.send(JSON.stringify(lms));
        }
      });

      poseRef.current = pose;

      const camera = new window.Camera(video, {
        onFrame: async () => {
          if (poseRef.current && video.readyState >= 2) {
            await poseRef.current.send({ image: video });
          }
        },
        width: 640,
        height: 480,
      });

      camera.start();
      cameraRef.current = camera;
      setPoseReady(true);
    };

    // Load scripts
    if (!window.Pose) {
      const s1 = document.createElement("script");
      s1.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js";
      s1.crossOrigin = "anonymous";
      document.head.appendChild(s1);

      const s2 = document.createElement("script");
      s2.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js";
      s2.crossOrigin = "anonymous";
      s2.onload = () => {
        setTimeout(loadPose, 500);
      };
      document.head.appendChild(s2);
    } else {
      loadPose();
    }

    return () => {
      cameraRef.current?.stop();
      poseRef.current?.close();
    };
  }, [localStream]);

  const handleMicToggle = () => { toggleMic(); setMicOn(v => !v); };
  const handleCamToggle = () => { toggleCamera(); setCamOn(v => !v); };

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit', sans-serif", color: "#F0F0F5" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontWeight: 700 }}>🥋 {t("exam.title")} — {t("exam.applicantName")}</span>
        {session && (
          <div style={{ fontSize: 13, color: "#909090" }}>
            <span style={{ color: "#E9C46A", fontWeight: 700 }}>{session.poomsae_type}</span>
            <span> · {session.dan_level}단 응시</span>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 16, maxWidth: 1200, margin: "0 auto" }}>
        {/* Left: My camera + skeleton */}
        <div>
          <div style={{ position: "relative", background: "#0A0A14", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", aspectRatio: "16/9" }}>
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
            />
            <PoseOverlay videoRef={localVideoRef} landmarks={landmarks} />
            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>
              내 카메라 {poseReady ? "· AI 분석 중 🟢" : "· AI 로딩 중..."}
            </div>
            <div style={{ position: "absolute", top: 10, right: 10 }}>
              <div style={{
                background: "rgba(0,0,0,0.7)", padding: "4px 12px", borderRadius: 20,
                fontSize: 12, display: "flex", alignItems: "center", gap: 5,
                color: connectionState === "connected" ? "#4ade80" : connectionState === "connecting" ? "#facc15" : "#606070",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                {connectionState === "connected" ? t("exam.connected") : connectionState === "connecting" ? t("exam.connecting") : t("exam.disconnected")}
              </div>
            </div>
          </div>

          {/* AI Score */}
          <div style={{ marginTop: 12 }}>
            <PoseScore {...aiScore} />
          </div>
        </div>

        {/* Right: Examiner video */}
        <div>
          <VideoPlayer stream={remoteStream} label="심사위원 영상" connectionState={connectionState} style={{ marginBottom: 12 }} />

          <div style={{
            background: "#0E0E16", border: "1px solid rgba(233,196,106,0.2)",
            borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#909090",
            lineHeight: 1.7,
          }}>
            {connectionState === "connected" ? (
              <span style={{ color: "#4ade80" }}>✅ {t("exam.examinerName")}이(가) 입장했습니다. 품새를 시연해주세요.</span>
            ) : (
              <span>{t("exam.waitingExaminer")}</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, padding: "0 16px 16px", flexWrap: "wrap", maxWidth: 1200, margin: "0 auto" }}>
        <button onClick={handleMicToggle} style={{
          padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
          background: micOn ? "rgba(255,255,255,0.07)" : "rgba(230,57,70,0.2)",
          color: micOn ? "#F0F0F5" : "#E63946", cursor: "pointer", fontSize: 14,
        }}>
          {micOn ? `🎤 ${t("exam.micOn")}` : `🔇 ${t("exam.micOff")}`}
        </button>
        <button onClick={handleCamToggle} style={{
          padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
          background: camOn ? "rgba(255,255,255,0.07)" : "rgba(230,57,70,0.2)",
          color: camOn ? "#F0F0F5" : "#E63946", cursor: "pointer", fontSize: 14,
        }}>
          {camOn ? `📷 ${t("exam.cameraOn")}` : `📷 ${t("exam.cameraOff")}`}
        </button>
      </div>

      {/* Mobile note */}
      <div style={{ padding: "0 16px 24px", fontSize: 12, color: "#404050", textAlign: "center" }}>
        스마트폰 가로 모드를 권장합니다. 전신이 카메라에 잘 보이도록 세워주세요.
      </div>
    </div>
  );
}
