"use client";

import { useEffect, useRef, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useViewer } from "@/lib/useBroadcastWebRTC";
import { API_BASE } from "@/lib/api";

interface Event { id: string; title: string; date: string; location: string }
interface ScoreData { blue: { name: string; score: number }; red: { name: string; score: number }; round: number }

export default function WatchPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { t } = useI18n();
  const [event, setEvent] = useState<Event | null>(null);
  const [broadcastStatus, setBroadcastStatus] = useState<"off" | "live" | "ended">("off");
  const [score, setScore] = useState<ScoreData | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { remoteStream, connState, connect, disconnect } = useViewer(eventId);

  useEffect(() => {
    fetch(`${API_BASE}/api/arena/${eventId}`).then(r => r.json()).then(d => {
      setEvent(d);
      setBroadcastStatus(d.broadcast_status || "off");
    }).catch(console.error);
  }, [eventId]);

  // Poll for broadcast status + scoreboard
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/arena/${eventId}/viewers`);
        if (!res.ok) return;
        const d: { broadcast_status: string; viewer_count: number; scoreboard: string } = await res.json();
        setBroadcastStatus(d.broadcast_status as "off" | "live" | "ended");
        setViewerCount(d.viewer_count || 0);
        if (d.scoreboard) {
          try { setScore(JSON.parse(d.scoreboard)); } catch {}
        }
      } catch {}
    }, 2000);
    return () => clearInterval(timer);
  }, [eventId]);

  // Auto-connect when broadcast goes live
  useEffect(() => {
    if (broadcastStatus === "live" && connState === "idle") {
      connect();
    }
    if (broadcastStatus === "ended") {
      disconnect();
    }
  }, [broadcastStatus, connState, connect, disconnect]);

  useEffect(() => {
    if (videoRef.current && remoteStream) videoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setFullscreen(false); };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: "#E9C46A" }}>TKP</span>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>📺 {t("arena.watching")}</span>
        </div>
        {event && <span style={{ fontSize: 13, color: "#E9C46A", fontWeight: 700 }}>{event.title}</span>}
      </div>

      {/* Video container */}
      <div ref={containerRef} style={{ position: "relative", maxWidth: 960, margin: "16px auto", padding: "0 12px" }}>
        <div style={{ position: "relative", background: "#080810", borderRadius: fullscreen ? 0 : 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", aspectRatio: "16/9" }}>
          {remoteStream ? (
            <video ref={videoRef} autoPlay playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12 }}>
              {broadcastStatus === "off" && (
                <>
                  <div style={{ fontSize: 36 }}>📡</div>
                  <div style={{ color: "#606070", textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>{t("arena.waitingBroadcast")}</div>
                </>
              )}
              {broadcastStatus === "live" && connState === "connecting" && (
                <>
                  <div style={{ fontSize: 36 }}>⏳</div>
                  <div style={{ color: "#E9C46A" }}>연결 중...</div>
                </>
              )}
              {broadcastStatus === "ended" && (
                <>
                  <div style={{ fontSize: 36 }}>🏁</div>
                  <div style={{ color: "#606070" }}>{t("arena.broadcastEnded")}</div>
                  <Link href={`/arena/${eventId}/photos`} style={{ color: "#E9C46A", textDecoration: "none", fontSize: 13, marginTop: 8 }}>
                    📸 {t("arena.viewPhotos")} →
                  </Link>
                </>
              )}
            </div>
          )}

          {/* LIVE badge */}
          {broadcastStatus === "live" && (
            <div style={{ position: "absolute", top: 10, left: 10, background: "#E6394690", border: "1px solid #E63946", borderRadius: 20, padding: "3px 12px", fontSize: 12, color: "#fff", fontWeight: 700 }}>
              ● LIVE
            </div>
          )}

          {/* Scoreboard overlay */}
          {score && broadcastStatus === "live" && (
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", borderRadius: 12, padding: "10px 20px", minWidth: 240, border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: "#3B82F6", marginBottom: 2 }}>{t("arena.blue")}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#E0E0E8", marginBottom: 2 }}>{score.blue.name || "—"}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "#3B82F6" }}>{score.blue.score}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#606070" }}>{t("arena.round")}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#E9C46A" }}>{score.round}</div>
                </div>
                <div style={{ textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: "#E63946", marginBottom: 2 }}>{t("arena.red")}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#E0E0E8", marginBottom: 2 }}>{score.red.name || "—"}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "#E63946" }}>{score.red.score}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, padding: "0 4px", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#606070" }}>
            {broadcastStatus === "live" ? (
              <span style={{ color: "#4ade80" }}>● {t("arena.live")} · {t("arena.viewers")} {viewerCount}</span>
            ) : broadcastStatus === "ended" ? (
              <span style={{ color: "#7EC8E3" }}>🏁 {t("arena.broadcastEnded")}</span>
            ) : (
              <span>{t("arena.waitingBroadcast")}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={toggleFullscreen}
              style={{ padding: "8px 16px", background: "rgba(255,255,255,0.06)", color: "#F0F0F5", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              {fullscreen ? "⛶" : "⛶"} {t("arena.fullscreen")}
            </button>
            <Link href={`/arena/${eventId}/photos`}
              style={{ padding: "8px 16px", background: "rgba(233,196,106,0.1)", color: "#E9C46A", border: "1px solid rgba(233,196,106,0.3)", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>
              📸 {t("arena.photos")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
