"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { API_BASE } from "@/lib/api";

const POOMSAE_LIST = [
  "태극 1장","태극 2장","태극 3장","태극 4장","태극 5장",
  "태극 6장","태극 7장","태극 8장","고려","금강","태백","평원","십진","지태","천권","한수","일여",
];

interface CreatedSession { id: string; instructor_name: string; title: string; poomsae_type: string }

export default function TrainingCreatePage() {
  const { t } = useI18n();
  const [instructorName, setInstructorName] = useState("");
  const [title, setTitle] = useState("");
  const [poomsae, setPoomsae] = useState("태극 1장");
  const [maxTrainees, setMaxTrainees] = useState("30");
  const [creating, setCreating] = useState(false);
  const [session, setSession] = useState<CreatedSession | null>(null);

  const handleCreate = async () => {
    if (!instructorName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/training`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructor_name: instructorName, title: title || `${poomsae} 연수`, poomsae_type: poomsae, max_trainees: Number(maxTrainees) }),
      });
      setSession(await res.json());
    } catch (e) { console.error(e); } finally { setCreating(false); }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const inputStyle = {
    width: "100%", background: "#1A1A26", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, padding: "12px 16px", color: "#F0F0F5", fontSize: 15,
    outline: "none", appearance: "none" as const, boxSizing: "border-box" as const,
  };

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/training" style={{ color: "#E9C46A", textDecoration: "none", fontSize: 13 }}>← 목록</Link>
        <span style={{ color: "#404050" }}>|</span>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, color: "#E9C46A" }}>TKP</span>
        <span style={{ color: "#404050" }}>|</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>🎓 {t("training.createSession")}</span>
      </div>

      <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 24px" }}>
        {!session ? (
          <div style={{ background: "#0E0E16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{t("training.createSession")}</h1>
            <p style={{ color: "#606070", fontSize: 14, marginBottom: 32 }}>세션을 생성하면 사범 참가 링크가 생성됩니다.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("training.instructorName")}</label>
                <input value={instructorName} onChange={e => setInstructorName(e.target.value)} placeholder="이름 입력" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("training.sessionTitle")}</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 태극 1장 품새 기본 연수" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("training.poomsaeType")}</label>
                <select value={poomsae} onChange={e => setPoomsae(e.target.value)} style={inputStyle}>
                  {POOMSAE_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("training.maxTrainees")}</label>
                <select value={maxTrainees} onChange={e => setMaxTrainees(e.target.value)} style={inputStyle}>
                  {[5,10,15,20,25,30].map(n => <option key={n} value={n}>{n}명</option>)}
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={!instructorName.trim() || creating}
                style={{
                  padding: "14px", background: instructorName.trim() ? "#E9C46A" : "rgba(255,255,255,0.05)",
                  color: instructorName.trim() ? "#0A0A0F" : "#404050",
                  border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer",
                }}>
                {creating ? "생성 중..." : t("training.create")}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "#0E0E16", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 28, textAlign: "center", marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 6 }}>연수 세션 생성 완료</h2>
            <p style={{ textAlign: "center", color: "#606070", fontSize: 14, marginBottom: 28 }}>
              {session.title} · {session.poomsae_type}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#1A1A26", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#E9C46A", marginBottom: 8 }}>{t("training.instructorLink")}</div>
                <div style={{ fontSize: 12, color: "#A0A0B0", wordBreak: "break-all", marginBottom: 10 }}>{origin}/training/{session.id}/instructor</div>
                <a href={`/training/${session.id}/instructor`}
                  style={{ display: "inline-block", padding: "10px 20px", background: "#E9C46A", color: "#0A0A0F", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
                  강사로 입장 →
                </a>
              </div>
              <div style={{ background: "#1A1A26", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#2A9D8F", marginBottom: 8 }}>{t("training.traineeLink")}</div>
                <div style={{ fontSize: 12, color: "#A0A0B0", wordBreak: "break-all", marginBottom: 10 }}>{origin}/training/{session.id}/trainee</div>
                <button
                  onClick={() => navigator.clipboard.writeText(`${origin}/training/${session.id}/trainee`)}
                  style={{ padding: "10px 20px", background: "rgba(42,157,143,0.15)", color: "#2A9D8F", border: "1px solid rgba(42,157,143,0.3)", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {t("exam.copyLink")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
