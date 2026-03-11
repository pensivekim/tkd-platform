"use client";

import { useEffect, useRef, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useInstructorWebRTC } from "@/lib/useTrainingWebRTC";
import { API_BASE } from "@/lib/api";
import PoseOverlay from "@/components/ai/PoseOverlay";

interface Session { id: string; instructor_name: string; title: string; poomsae_type: string }

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#4ade80" : score >= 70 ? "#E9C46A" : score > 0 ? "#E63946" : "#404050";
  return (
    <span style={{
      fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18, color,
      background: `${color}18`, padding: "2px 10px", borderRadius: 8,
    }}>{score > 0 ? score : "--"}</span>
  );
}

function TraineeCard({ entry }: { entry: import("@/lib/useTrainingWebRTC").TraineeEntry }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && entry.stream) videoRef.current.srcObject = entry.stream;
  }, [entry.stream]);

  return (
    <div style={{ background: "#0E0E18", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ position: "relative", aspectRatio: "4/3", background: "#080810" }}>
        {entry.stream ? (
          <video ref={videoRef} autoPlay playsInline muted={false}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#303040" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>📷</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>연결 중...</div>
            </div>
          </div>
        )}
        <PoseOverlay videoRef={videoRef} landmarks={null} enabled={false} />
        <div style={{ position: "absolute", top: 6, right: 6 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", display: "inline-block",
            background: entry.connState === "connected" ? "#4ade80" : entry.connState === "connecting" ? "#E9C46A" : "#E63946",
          }} />
        </div>
        <div style={{ position: "absolute", bottom: 6, right: 6 }}>
          <ScoreBadge score={entry.score} />
        </div>
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#E0E0E8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</div>
        <div style={{ fontSize: 11, color: "#606070" }}>{entry.dojangName || "—"}</div>
      </div>
    </div>
  );
}

export default function InstructorPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const { trainees, micOn, start, stop, toggleMic } = useInstructorWebRTC(sessionId);

  useEffect(() => {
    fetch(`${API_BASE}/api/training/${sessionId}`)
      .then(r => r.json()).then(setSession).catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  const scores = trainees.map(t => t.score).filter(s => s > 0);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const max = scores.length ? Math.max(...scores) : 0;
  const min = scores.length ? Math.min(...scores) : 0;

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/training" style={{ color: "#E9C46A", textDecoration: "none", fontSize: 13 }}>← 목록</Link>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: "#E9C46A" }}>TKP</span>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontWeight: 700 }}>🎓 {t("training.instructorView")}</span>
        </div>
        {session && (
          <div style={{ fontSize: 13, color: "#909090" }}>
            <span style={{ color: "#E9C46A", fontWeight: 700 }}>{session.title}</span>
            <span> · {session.poomsae_type} · {session.instructor_name}</span>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 1, background: "rgba(255,255,255,0.04)", margin: "12px 16px", borderRadius: 10, overflow: "hidden" }}>
        {[
          { label: "참가 사범", value: trainees.length },
          { label: "평균 점수", value: avg || "--" },
          { label: "최고 점수", value: max || "--" },
          { label: "최저 점수", value: min || "--" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "12px 16px", textAlign: "center", background: "#0E0E18" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: ["#E9C46A","#4ade80","#2A9D8F","#E63946"][i], lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#606070", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trainee grid */}
      <div style={{ padding: "0 16px" }}>
        {trainees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "#404050" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
            <p>{t("training.noTrainees")}</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>사범에게 참가 링크를 공유하세요.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}>
            {trainees.map(entry => <TraineeCard key={entry.participantId} entry={entry} />)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: "16px", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
        <button onClick={toggleMic} style={{
          padding: "10px 22px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
          background: micOn ? "rgba(255,255,255,0.07)" : "rgba(230,57,70,0.2)",
          color: micOn ? "#F0F0F5" : "#E63946", cursor: "pointer", fontSize: 14,
        }}>
          {micOn ? `🎤 ${t("exam.micOn")}` : `🔇 ${t("exam.micOff")}`}
        </button>
        <button onClick={stop} style={{
          padding: "10px 22px", borderRadius: 8, border: "1px solid rgba(230,57,70,0.4)",
          background: "rgba(230,57,70,0.15)", color: "#E63946", cursor: "pointer", fontSize: 14,
        }}>
          연수 종료
        </button>
      </div>
    </div>
  );
}
