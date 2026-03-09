"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { getPoomsae } from "@/lib/poomsae-data";
import { PoomsaeScoringEngine, visibilityScore, resetStability } from "@/lib/pose-scoring";
import type { Landmark, PoomsaeScoringResult } from "@/lib/pose-scoring";

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

type Phase = "prep" | "performing" | "result";

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#909090", marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

export default function PoomsaeSessionPage({ params }: { params: Promise<{ poomsaeId: string }> }) {
  const { poomsaeId } = use(params);
  const { t } = useI18n();
  const poomsae = getPoomsae(poomsaeId);

  const [phase, setPhase] = useState<Phase>("prep");
  const [poseReady, setPoseReady] = useState(false);
  const [visibility, setVisibility] = useState(0);
  const [score, setScore] = useState<PoomsaeScoringResult | null>(null);
  const [finalScore, setFinalScore] = useState<PoomsaeScoringResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<PoomsaeScoringEngine | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Load MediaPipe
  const initPose = useCallback((onLandmarks: (lms: Landmark[], ts: number) => void) => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const startPose = () => {
      if (!window.Pose || !video) return;
      const pose = new window.Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      pose.onResults(results => {
        if (!results.poseLandmarks) return;
        onLandmarks(results.poseLandmarks, performance.now());
      });
      const camera = new window.Camera(video, {
        onFrame: async () => { if (video.readyState >= 2) await pose.send({ image: video }); },
        width: 640, height: 480,
      });
      camera.start();
      setPoseReady(true);
      cleanupRef.current = () => { camera.stop(); pose.close(); };
    };

    if (!window.Pose) {
      const s1 = document.createElement("script");
      s1.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js";
      s1.crossOrigin = "anonymous";
      document.head.appendChild(s1);
      const s2 = document.createElement("script");
      s2.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js";
      s2.crossOrigin = "anonymous";
      s2.onload = () => setTimeout(startPose, 500);
      document.head.appendChild(s2);
    } else {
      startPose();
    }
  }, []);

  // Start camera on mount for prep phase
  useEffect(() => {
    if (!poomsae) return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(console.error);

    initPose((lms, _ts) => {
      const vis = visibilityScore(lms);
      setVisibility(vis);
    });

    return () => {
      cleanupRef.current?.();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [poomsae, initPose]);

  const handleStart = () => {
    if (!poomsae) return;
    cleanupRef.current?.();
    cleanupRef.current = null;
    resetStability();
    engineRef.current = new PoomsaeScoringEngine(poomsae);
    setPoseReady(false);
    setScore(null);
    setPhase("performing");

    // Re-init with scoring callback
    setTimeout(() => {
      initPose((lms, ts) => {
        if (!engineRef.current) return;
        const result = engineRef.current.process(lms, ts);
        setScore(result);
        if (result.done) {
          setFinalScore(result);
          setPhase("result");
        }
      });
    }, 100);
  };

  const handleRetry = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setPoseReady(false);
    setScore(null);
    setFinalScore(null);
    setPhase("prep");
    engineRef.current = null;

    setTimeout(() => {
      initPose((lms, _ts) => {
        const vis = visibilityScore(lms);
        setVisibility(vis);
      });
    }, 100);
  };

  if (!poomsae) {
    return (
      <div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F0F0F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🥋</div>
          <p>품새를 찾을 수 없습니다</p>
          <Link href="/poomsae" style={{ color: "#E9C46A", textDecoration: "none", marginTop: 12, display: "block" }}>← 목록으로</Link>
        </div>
      </div>
    );
  }

  const grade = finalScore
    ? finalScore.total >= 80 ? t("poomsae.excellent") : finalScore.total >= 60 ? t("poomsae.good") : t("poomsae.needsPractice")
    : "";
  const gradeColor = finalScore
    ? finalScore.total >= 80 ? "#4ade80" : finalScore.total >= 60 ? "#E9C46A" : "#E63946"
    : "#E9C46A";

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/poomsae" style={{ color: poomsae.color, textDecoration: "none", fontSize: 13 }}>← {t("poomsae.backToList")}</Link>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: "#E9C46A" }}>DOJANGWAN</span>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>🥋 {poomsae.nameKo}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["prep", "performing", "result"].map((p, i) => (
            <span key={p} style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 20,
              background: phase === p ? `${poomsae.color}20` : "transparent",
              color: phase === p ? poomsae.color : "#404050",
              border: `1px solid ${phase === p ? poomsae.color + "50" : "rgba(255,255,255,0.08)"}`,
            }}>
              {i + 1}. {p === "prep" ? t("poomsae.phasePrep") : p === "performing" ? t("poomsae.phasePerforming") : t("poomsae.phaseResult")}
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
        {/* ── PREP PHASE ── */}
        {phase === "prep" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div>
              <div style={{ position: "relative", background: "#080810", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", aspectRatio: "4/3" }}>
                <video ref={videoRef} autoPlay playsInline muted
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", borderRadius: 20, padding: "4px 12px", fontSize: 12 }}>
                  {poseReady ? `AI 감지 🟢 · 가시성 ${visibility}%` : t("poomsae.detectingPose")}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#0E0E18", borderRadius: 12, padding: 20, border: `1px solid ${poomsae.color}30` }}>
                <div style={{ color: poomsae.color, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{poomsae.nameKo}</div>
                <div style={{ fontSize: 13, color: "#606070", marginBottom: 16 }}>{poomsae.level} · {poomsae.moves.length}개 동작</div>
                <div style={{ fontSize: 13, color: "#909090", lineHeight: 1.8, marginBottom: 16 }}>{poomsae.descKo}</div>
              </div>
              <div style={{ background: "#0E0E18", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#606070", lineHeight: 1.8 }}>
                <div style={{ color: "#E9C46A", fontWeight: 600, marginBottom: 6 }}>{t("poomsae.ready")}</div>
                {t("poomsae.readyDesc")}
              </div>
              <div style={{
                height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${visibility}%`,
                  background: visibility >= 60 ? "#4ade80" : visibility >= 30 ? "#E9C46A" : "#E63946",
                  borderRadius: 4, transition: "width 0.3s",
                }} />
              </div>
              <button onClick={handleStart} disabled={visibility < 40}
                style={{
                  padding: "14px", borderRadius: 10, border: "none", cursor: visibility >= 40 ? "pointer" : "not-allowed",
                  background: visibility >= 40 ? poomsae.color : "rgba(255,255,255,0.05)",
                  color: visibility >= 40 ? "#0A0A0F" : "#404050",
                  fontWeight: 700, fontSize: 16, transition: "background 0.2s",
                }}>
                {visibility >= 40 ? `▶ ${t("poomsae.start")}` : `📷 ${t("poomsae.detectingPose")}`}
              </button>
            </div>
          </div>
        )}

        {/* ── PERFORMING PHASE ── */}
        {phase === "performing" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16 }}>
            <div>
              <div style={{ position: "relative", background: "#080810", borderRadius: 12, overflow: "hidden", border: `2px solid ${poomsae.color}50`, aspectRatio: "4/3" }}>
                <video ref={videoRef} autoPlay playsInline muted
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                {/* Current move overlay */}
                {score && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", padding: "10px 16px" }}>
                    <div style={{ fontSize: 11, color: poomsae.color, marginBottom: 2 }}>
                      동작 {score.currentMoveIndex + 1}/{poomsae.moves.length}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{score.currentMoveName}</div>
                  </div>
                )}
                <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.7)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#4ade80" }}>
                  {poseReady ? "AI 🟢" : "AI 로딩..."}
                </div>
              </div>
              {/* Progress bar */}
              {score && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#606070", marginBottom: 4 }}>
                    <span>{t("poomsae.movesCompleted")}: {score.currentMoveIndex}/{poomsae.moves.length}</span>
                    <span style={{ color: poomsae.color }}>완성도 {score.completeness}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${score.completeness}%`, background: poomsae.color, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#0E0E18", borderRadius: 12, padding: 16, border: "1px solid rgba(230,57,70,0.3)" }}>
                <div style={{ fontSize: 12, color: "#E63946", letterSpacing: 1, marginBottom: 10 }}>AI 채점 (실시간)</div>
                {score ? (
                  <>
                    <div style={{ textAlign: "center", marginBottom: 14 }}>
                      <span style={{
                        fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, color: score.total >= 80 ? "#4ade80" : score.total >= 60 ? "#E9C46A" : "#E63946"
                      }}>{score.total}</span>
                      <span style={{ color: "#606070", fontSize: 14 }}>/100</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <ScoreBar label={t("poomsae.accuracy")} value={score.accuracy} color="#E63946" />
                      <ScoreBar label={t("poomsae.symmetry")} value={score.symmetry} color="#E9C46A" />
                      <ScoreBar label={t("poomsae.stability")} value={score.stability} color="#7EC8E3" />
                      <ScoreBar label={t("poomsae.timing")} value={score.timing} color="#4ade80" />
                      <ScoreBar label={t("poomsae.completeness")} value={score.completeness} color="#A78BFA" />
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: "#404050", padding: 20 }}>{t("poomsae.aiAnalyzing")}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT PHASE ── */}
        {phase === "result" && finalScore && (
          <div style={{ maxWidth: 520, margin: "0 auto", paddingTop: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 80, color: gradeColor, lineHeight: 1 }}>
                {finalScore.total}
              </div>
              <div style={{ color: "#606070", fontSize: 16, marginBottom: 8 }}>/100</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: gradeColor }}>{grade}</div>
              <div style={{ fontSize: 13, color: "#606070", marginTop: 4 }}>{poomsae.nameKo} · {poomsae.moves.length}개 동작</div>
            </div>

            <div style={{ background: "#0E0E18", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#808090", marginBottom: 16 }}>5개 항목 채점 결과</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: t("poomsae.accuracy"), value: finalScore.accuracy, color: "#E63946" },
                  { label: t("poomsae.symmetry"), value: finalScore.symmetry, color: "#E9C46A" },
                  { label: t("poomsae.stability"), value: finalScore.stability, color: "#7EC8E3" },
                  { label: t("poomsae.timing"), value: finalScore.timing, color: "#4ade80" },
                  { label: t("poomsae.completeness"), value: finalScore.completeness, color: "#A78BFA" },
                ].map(item => (
                  <ScoreBar key={item.label} label={item.label} value={item.value} color={item.color} />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleRetry} style={{
                flex: 1, padding: "14px", borderRadius: 10, cursor: "pointer",
                background: `${poomsae.color}18`, color: poomsae.color,
                border: `1px solid ${poomsae.color}40`, fontWeight: 700, fontSize: 15,
              }}>
                🔄 {t("poomsae.tryAgain")}
              </button>
              <Link href="/poomsae" style={{
                flex: 1, padding: "14px", borderRadius: 10, textAlign: "center",
                background: "rgba(255,255,255,0.06)", color: "#909090",
                border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none",
                fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                ← {t("poomsae.backToList")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
