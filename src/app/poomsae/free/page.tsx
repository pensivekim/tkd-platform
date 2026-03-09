"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { computePoomsaeScore, resetPoomsaeScore } from "@/lib/pose-scoring";
import type { Landmark, PoomsaeScore } from "@/lib/pose-scoring";

declare global {
  interface Window {
    Pose: new (config: unknown) => {
      setOptions: (opts: unknown) => void;
      onResults: (cb: (results: { poseLandmarks?: Landmark[] }) => void) => void;
      send: (input: { image: HTMLVideoElement }) => Promise<void>;
      close: () => void;
    };
    Camera: new (video: HTMLVideoElement, opts: { onFrame: () => Promise<void>; width: number; height: number }) => {
      start: () => void;
      stop: () => void;
    };
  }
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#909090", marginBottom: 5 }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700, fontSize: 15 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

export default function FreePracticePage() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [poseReady, setPoseReady] = useState(false);
  const [score, setScore] = useState<PoomsaeScore>({ total: 0, accuracy: 0, symmetry: 0, stability: 0, timing: 0, completeness: 0 });

  useEffect(() => {
    resetPoomsaeScore();

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(console.error);

    const startPose = () => {
      if (!window.Pose || !videoRef.current) return;
      const video = videoRef.current;
      const pose = new window.Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      pose.onResults(results => {
        if (!results.poseLandmarks) return;
        setScore(computePoomsaeScore(results.poseLandmarks));
      });
      const camera = new window.Camera(video, {
        onFrame: async () => { if (video.readyState >= 2) await pose.send({ image: video }); },
        width: 640, height: 480,
      });
      camera.start();
      setPoseReady(true);

      return () => { camera.stop(); pose.close(); };
    };

    let cleanup: (() => void) | undefined;
    if (!window.Pose) {
      const s1 = document.createElement("script");
      s1.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js";
      s1.crossOrigin = "anonymous";
      document.head.appendChild(s1);
      const s2 = document.createElement("script");
      s2.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js";
      s2.crossOrigin = "anonymous";
      s2.onload = () => { setTimeout(() => { cleanup = startPose() ?? undefined; }, 500); };
      document.head.appendChild(s2);
    } else {
      cleanup = startPose() ?? undefined;
    }

    return () => {
      cleanup?.();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const totalColor = score.total >= 80 ? "#4ade80" : score.total >= 60 ? "#E9C46A" : "#E63946";

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/poomsae" style={{ color: "#E9C46A", textDecoration: "none", fontSize: 13 }}>← {t("poomsae.backToList")}</Link>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: "#E9C46A" }}>DOJANGWAN</span>
        <span style={{ color: "#404050" }}>|</span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>🥋 {t("poomsae.free")}</span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16, display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
        {/* Camera */}
        <div>
          <div style={{ position: "relative", background: "#080810", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", aspectRatio: "4/3" }}>
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", borderRadius: 20, padding: "4px 12px", fontSize: 12 }}>
              {poseReady ? "AI 분석 🟢" : t("poomsae.detectingPose")}
            </div>
            <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.75)", borderRadius: 10, padding: "6px 14px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: totalColor, lineHeight: 1 }}>{score.total}</div>
              <div style={{ fontSize: 10, color: "#606070" }}>SCORE</div>
            </div>
          </div>
          <div style={{ marginTop: 12, background: "#0E0E18", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#606070", lineHeight: 1.7 }}>
            {t("poomsae.freeDesc")} — 5개 항목이 실시간으로 채점됩니다.
            스마트폰 가로 모드, 전신이 카메라에 보이도록 거리를 조절하세요.
          </div>
        </div>

        {/* Score panel */}
        <div style={{ background: "#0E0E18", borderRadius: 12, padding: 20, border: "1px solid rgba(230,57,70,0.3)", height: "fit-content" }}>
          <div style={{ fontSize: 12, color: "#E63946", letterSpacing: 1, marginBottom: 14 }}>AI 5-ITEM SCORE</div>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, color: totalColor, lineHeight: 1 }}>
              {score.total}
            </div>
            <div style={{ color: "#606070", fontSize: 14 }}>/100</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <ScoreBar label={t("poomsae.accuracy")} value={score.accuracy} color="#E63946" />
            <ScoreBar label={t("poomsae.symmetry")} value={score.symmetry} color="#E9C46A" />
            <ScoreBar label={t("poomsae.stability")} value={score.stability} color="#7EC8E3" />
            <ScoreBar label={t("poomsae.timing")} value={score.timing} color="#4ade80" />
            <ScoreBar label={t("poomsae.completeness")} value={score.completeness} color="#A78BFA" />
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#404050", lineHeight: 1.7 }}>
            각 항목 70+ = 양호 / 80+ = 우수
          </div>
        </div>
      </div>
    </div>
  );
}
