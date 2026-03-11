"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useBroadcaster } from "@/lib/useBroadcastWebRTC";
import { captureFrame } from "@/lib/capture";
import { API_BASE } from "@/lib/api";

interface Event { id: string; title: string; date: string; location: string }
interface ScoreData { blue: { name: string; score: number }; red: { name: string; score: number }; round: number }

export default function BroadcastPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { t } = useI18n();
  const [event, setEvent] = useState<Event | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [score, setScore] = useState<ScoreData>({ blue: { name: "", score: 0 }, red: { name: "", score: 0 }, round: 1 });
  const [capturing, setCapturing] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [poseOn, setPoseOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { localStream, broadcasting, viewerCount, startCamera, startBroadcast, stopBroadcast, updateScoreboard, cleanup } = useBroadcaster(eventId);

  useEffect(() => {
    fetch(`${API_BASE}/api/arena/${eventId}`).then(r => r.json()).then(setEvent).catch(console.error);
  }, [eventId]);

  useEffect(() => {
    startCamera(facingMode);
    return () => { cleanup(); };
  }, [facingMode, startCamera, cleanup]);

  useEffect(() => {
    if (videoRef.current && localStream) videoRef.current.srcObject = localStream;
  }, [localStream]);

  const handleSwitchCamera = () => {
    setFacingMode(f => f === "user" ? "environment" : "user");
  };

  const handleScoreChange = useCallback(async (updated: ScoreData) => {
    setScore(updated);
    await updateScoreboard(updated);
  }, [updateScoreboard]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    try {
      const blob = await captureFrame(videoRef.current);
      const form = new FormData();
      form.append("image", blob, "capture.jpg");
      await fetch(`${API_BASE}/api/arena/${eventId}/photos`, { method: "POST", body: form });
      setCaptureCount(c => c + 1);
    } catch (e) { console.error(e); } finally { setCapturing(false); }
  };

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/arena" style={{ color: "#2A9D8F", textDecoration: "none", fontSize: 13 }}>← 목록</Link>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: "#E9C46A" }}>TKP</span>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>📡 {t("arena.broadcast")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {broadcasting && (
            <span style={{ background: "#4ade8020", color: "#4ade80", border: "1px solid #4ade8040", borderRadius: 20, padding: "3px 12px", fontSize: 12 }}>
              ● LIVE · {t("arena.viewers")} {viewerCount}
            </span>
          )}
          {event && <span style={{ fontSize: 13, color: "#E9C46A", fontWeight: 700 }}>{event.title}</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12, padding: 12, maxWidth: 1100, margin: "0 auto" }}>
        {/* Camera preview */}
        <div>
          <div style={{ position: "relative", background: "#080810", borderRadius: 12, overflow: "hidden", border: broadcasting ? "2px solid #4ade80" : "1px solid rgba(255,255,255,0.1)", aspectRatio: "16/9" }}>
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
            {broadcasting && (
              <div style={{ position: "absolute", top: 10, left: 10, background: "#E6394620", border: "1px solid #E63946", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#E63946", fontWeight: 700 }}>
                ● REC
              </div>
            )}
            <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.7)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#2A9D8F" }}>
              {t("arena.viewers")}: {viewerCount}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {!broadcasting ? (
              <button onClick={startBroadcast}
                style={{ padding: "10px 20px", background: "#4ade80", color: "#0A0A0F", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ▶ {t("arena.startBroadcast")}
              </button>
            ) : (
              <button onClick={stopBroadcast}
                style={{ padding: "10px 20px", background: "#E63946", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ■ {t("arena.stopBroadcast")}
              </button>
            )}
            <button onClick={handleSwitchCamera}
              style={{ padding: "10px 16px", background: "rgba(255,255,255,0.07)", color: "#F0F0F5", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              🔄 {t("arena.switchCamera")}
            </button>
            <button onClick={handleCapture} disabled={capturing}
              style={{ padding: "10px 16px", background: capturing ? "rgba(255,255,255,0.04)" : "rgba(233,196,106,0.15)", color: "#E9C46A", border: "1px solid rgba(233,196,106,0.3)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              📸 {t("arena.capturePhoto")} {captureCount > 0 && `(${captureCount})`}
            </button>
            <button onClick={() => setPoseOn(v => !v)}
              style={{ padding: "10px 16px", background: poseOn ? "rgba(42,157,143,0.2)" : "rgba(255,255,255,0.05)", color: poseOn ? "#2A9D8F" : "#606070", border: `1px solid ${poseOn ? "rgba(42,157,143,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              🤸 {t("arena.poseOverlay")}
            </button>
          </div>
        </div>

        {/* Right panel: scoreboard */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#0E0E18", border: "1px solid rgba(42,157,143,0.2)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, color: "#2A9D8F", fontWeight: 700, marginBottom: 14 }}>📊 {t("arena.scoreboard")}</div>

            {/* Round */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "#909090" }}>{t("arena.round")}</span>
              <button onClick={() => handleScoreChange({ ...score, round: Math.max(1, score.round - 1) })}
                style={{ width: 28, height: 28, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "#F0F0F5", cursor: "pointer", fontSize: 14 }}>-</button>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#E9C46A", minWidth: 24, textAlign: "center" }}>{score.round}</span>
              <button onClick={() => handleScoreChange({ ...score, round: score.round + 1 })}
                style={{ width: 28, height: 28, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "#F0F0F5", cursor: "pointer", fontSize: 14 }}>+</button>
            </div>

            {/* Blue */}
            <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#3B82F6", marginBottom: 6 }}>{t("arena.blue")}</div>
              <input value={score.blue.name} onChange={e => handleScoreChange({ ...score, blue: { ...score.blue, name: e.target.value } })}
                placeholder="선수 이름" style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(59,130,246,0.3)", color: "#F0F0F5", fontSize: 14, outline: "none", marginBottom: 8, paddingBottom: 4, boxSizing: "border-box" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => handleScoreChange({ ...score, blue: { ...score.blue, score: Math.max(0, score.blue.score - 1) } })}
                  style={{ width: 32, height: 32, border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6, background: "rgba(59,130,246,0.1)", color: "#3B82F6", cursor: "pointer", fontSize: 16 }}>-</button>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#3B82F6", minWidth: 40, textAlign: "center" }}>{score.blue.score}</span>
                <button onClick={() => handleScoreChange({ ...score, blue: { ...score.blue, score: score.blue.score + 1 } })}
                  style={{ width: 32, height: 32, border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6, background: "rgba(59,130,246,0.1)", color: "#3B82F6", cursor: "pointer", fontSize: 16 }}>+</button>
              </div>
            </div>

            {/* Red */}
            <div style={{ background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#E63946", marginBottom: 6 }}>{t("arena.red")}</div>
              <input value={score.red.name} onChange={e => handleScoreChange({ ...score, red: { ...score.red, name: e.target.value } })}
                placeholder="선수 이름" style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(230,57,70,0.3)", color: "#F0F0F5", fontSize: 14, outline: "none", marginBottom: 8, paddingBottom: 4, boxSizing: "border-box" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => handleScoreChange({ ...score, red: { ...score.red, score: Math.max(0, score.red.score - 1) } })}
                  style={{ width: 32, height: 32, border: "1px solid rgba(230,57,70,0.3)", borderRadius: 6, background: "rgba(230,57,70,0.1)", color: "#E63946", cursor: "pointer", fontSize: 16 }}>-</button>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#E63946", minWidth: 40, textAlign: "center" }}>{score.red.score}</span>
                <button onClick={() => handleScoreChange({ ...score, red: { ...score.red, score: score.red.score + 1 } })}
                  style={{ width: 32, height: 32, border: "1px solid rgba(230,57,70,0.3)", borderRadius: 6, background: "rgba(230,57,70,0.1)", color: "#E63946", cursor: "pointer", fontSize: 16 }}>+</button>
              </div>
            </div>
          </div>

          <div style={{ background: "#0E0E18", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#606070" }}>
            📸 {t("arena.photoCount")}: {captureCount}장 저장됨
            {captureCount > 0 && (
              <div style={{ marginTop: 8 }}>
                <Link href={`/arena/${eventId}/photos`} style={{ color: "#E9C46A", textDecoration: "none" }}>{t("arena.viewPhotos")} →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
