"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const poomsae = getPoomsae(poomsaeId);

  const [phase, setPhase] = useState<Phase>("prep");
  const [poseReady, setPoseReady] = useState(false);
  const [visibility, setVisibility] = useState(0);
  const [score, setScore] = useState<PoomsaeScoringResult | null>(null);
  const [finalScore, setFinalScore] = useState<PoomsaeScoringResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showNameModal, setShowNameModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const pendingSaveRef = useRef<PoomsaeScoringResult | null>(null);
  const startTimeRef = useRef<number>(0);

  // 초대 토큰
  type InviteInfo = {
    student_id:   string
    student_name: string
    poomsae_name: string
    dojang_name:  string
    message:      string | null
    expired:      boolean
  }
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

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

  // 초대 토큰 처리
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) return;
    fetch(`/api/public/poomsae/invite/${token}`)
      .then(r => r.json())
      .then((data: InviteInfo & { error?: string }) => {
        if (data.error) { setInviteError(data.error); return; }
        if (data.expired) { setInviteError('이미 사용되었거나 만료된 초대 링크입니다.'); return; }
        setInviteInfo(data);
        setStudentName(data.student_name);
      })
      .catch(() => setInviteError('초대 정보를 불러오지 못했습니다.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 결과 저장 함수
  const saveResult = useCallback(async (result: PoomsaeScoringResult, name: string) => {
    if (!poomsae) return;
    const token   = searchParams.get('token');
    const dojanId = searchParams.get('dojang_id');
    const duration = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : null;
    setSaveStatus('saving');
    try {
      const urlStr = dojanId
        ? `/api/poomsae/result?dojang_id=${encodeURIComponent(dojanId)}`
        : '/api/poomsae/result';
      const res = await fetch(urlStr, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name:     name,
          student_id:       inviteInfo?.student_id ?? undefined,
          poomsae_id:       poomsae.id,
          poomsae_name:     poomsae.nameKo,
          total_score:      result.total,
          accuracy:         result.accuracy,
          symmetry:         result.symmetry,
          stability:        result.stability,
          timing:           result.timing,
          completeness:     result.completeness,
          duration_seconds: duration,
          mode:             'practice',
          dojang_id:        dojanId ?? undefined,
          invite_token:     token ?? undefined,
        }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
    } catch {
      setSaveStatus('error');
    }
  }, [poomsae, searchParams, inviteInfo]);

  const handleStart = () => {
    if (!poomsae) return;
    cleanupRef.current?.();
    cleanupRef.current = null;
    resetStability();
    engineRef.current = new PoomsaeScoringEngine(poomsae);
    setPoseReady(false);
    setScore(null);
    setSaveStatus('idle');
    startTimeRef.current = Date.now();
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
          // 이름 입력 모달 (저장용)
          pendingSaveRef.current = result;
          // 초대 토큰으로 접근한 경우: 이름 모달 없이 바로 저장
          if (inviteInfo) {
            saveResult(result, inviteInfo.student_name);
          } else {
            const saved = typeof window !== 'undefined' ? localStorage.getItem('poomsae_student_name') : null;
            if (saved) {
              setStudentName(saved);
              saveResult(result, saved);
            } else {
              setShowNameModal(true);
            }
          }
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
    setSaveStatus('idle');
    setShowNameModal(false);
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

  // 초대 만료 오류 화면
  if (inviteError) {
    return (
      <div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F0F0F5", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>{inviteError}</p>
          <Link href="/poomsae" style={{ color: "#E9C46A", textDecoration: "none", fontSize: 14 }}>← 품새 목록으로</Link>
        </div>
      </div>
    );
  }

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

      {/* 초대 배너 */}
      {inviteInfo && (
        <div style={{
          background: "rgba(233,196,106,0.1)", borderBottom: "1px solid rgba(233,196,106,0.25)",
          padding: "10px 20px", fontSize: 13, color: "#E9C46A",
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        }}>
          <span>👋</span>
          <span>
            안녕하세요 <strong>{inviteInfo.student_name}</strong>님!{" "}
            <strong>{inviteInfo.dojang_name}</strong> 사범님이{" "}
            <strong>{inviteInfo.poomsae_name}</strong> 연습을 요청했어요.
            {inviteInfo.message && <span style={{ color: "#B09050", marginLeft: 6 }}>"{inviteInfo.message}"</span>}
          </span>
        </div>
      )}

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

            {/* 저장 상태 표시 */}
            <div style={{ textAlign: "center", marginBottom: 14, minHeight: 28 }}>
              {saveStatus === 'saving' && (
                <span style={{ fontSize: 13, color: "#808090" }}>⏳ 기록 저장 중...</span>
              )}
              {saveStatus === 'saved' && (
                <span style={{ fontSize: 13, color: "#4ade80" }}>✅ 기록 저장됨 ({studentName})</span>
              )}
              {saveStatus === 'error' && (
                <span style={{ fontSize: 13, color: "#E63946" }}>⚠️ 저장 실패 (결과는 유지됩니다)</span>
              )}
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

      {/* 이름 입력 모달 */}
      {showNameModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{
            background: "#0E0E18", borderRadius: 16, padding: 28,
            width: "100%", maxWidth: 360, border: "1px solid rgba(255,255,255,0.12)",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>기록 저장</div>
            <div style={{ fontSize: 13, color: "#606070", marginBottom: 20 }}>이름을 입력하면 연습 기록이 저장됩니다.</div>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="이름 입력"
              maxLength={20}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && studentName.trim() && pendingSaveRef.current) {
                  localStorage.setItem('poomsae_student_name', studentName.trim());
                  setShowNameModal(false);
                  saveResult(pendingSaveRef.current, studentName.trim());
                }
              }}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
                background: "#161620", border: "1px solid rgba(255,255,255,0.15)",
                color: "#F0F0F5", marginBottom: 14, boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowNameModal(false); setSaveStatus('idle'); }}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
                  background: "transparent", color: "#606070",
                  border: "1px solid rgba(255,255,255,0.1)", fontSize: 14,
                }}>
                건너뛰기
              </button>
              <button
                disabled={!studentName.trim()}
                onClick={() => {
                  if (!studentName.trim() || !pendingSaveRef.current) return;
                  localStorage.setItem('poomsae_student_name', studentName.trim());
                  setShowNameModal(false);
                  saveResult(pendingSaveRef.current, studentName.trim());
                }}
                style={{
                  flex: 2, padding: "10px", borderRadius: 8, cursor: studentName.trim() ? "pointer" : "not-allowed",
                  background: studentName.trim() ? "#E63946" : "rgba(255,255,255,0.05)",
                  color: studentName.trim() ? "#fff" : "#404050",
                  border: "none", fontWeight: 700, fontSize: 14,
                }}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
