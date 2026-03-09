"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { API_BASE } from "@/lib/api";

const POOMSAE_LIST = [
  "태극 1장", "태극 2장", "태극 3장", "태극 4장", "태극 5장",
  "태극 6장", "태극 7장", "태극 8장",
  "고려", "금강", "태백", "평원", "십진",
  "지태", "천권", "한수", "일여",
];

export default function ExamCreatePage() {
  const { t } = useI18n();
  const [examinerName, setExaminerName] = useState("");
  const [poomsae, setPoomsae] = useState("태극 1장");
  const [danLevel, setDanLevel] = useState("1");
  const [creating, setCreating] = useState(false);
  const [session, setSession] = useState<{ id: string; poomsae_type: string; dan_level: number } | null>(null);

  const handleCreate = async () => {
    if (!examinerName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/exam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examiner_name: examinerName, poomsae_type: poomsae, dan_level: Number(danLevel) }),
      });
      const data = await res.json();
      setSession(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const inputStyle = {
    width: "100%", background: "#1A1A26", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, padding: "12px 16px", color: "#F0F0F5", fontSize: 15,
    outline: "none", appearance: "none" as const, boxSizing: "border-box" as const,
  };

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit', sans-serif", color: "#F0F0F5" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/exam" style={{ color: "#E63946", textDecoration: "none", fontSize: 13 }}>← 목록</Link>
        <span style={{ color: "#404050" }}>|</span>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: "#E9C46A" }}>DOJANGWAN</span>
        <span style={{ color: "#404050" }}>|</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>🥋 {t("exam.createSession")}</span>
      </div>

      <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 24px" }}>
        {!session ? (
          <div style={{ background: "#0E0E16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{t("exam.createSession")}</h1>
            <p style={{ color: "#606070", fontSize: 14, marginBottom: 32 }}>세션을 생성하면 응시자 공유 링크가 생성됩니다.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("exam.examinerName")}</label>
                <input
                  value={examinerName}
                  onChange={e => setExaminerName(e.target.value)}
                  placeholder="이름 입력"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("exam.poomsaeType")}</label>
                <select value={poomsae} onChange={e => setPoomsae(e.target.value)} style={inputStyle}>
                  {POOMSAE_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("exam.danLevel")}</label>
                <select value={danLevel} onChange={e => setDanLevel(e.target.value)} style={inputStyle}>
                  {[1,2,3,4,5,6,7,8,9].map(d => <option key={d} value={d}>{d}단</option>)}
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={!examinerName.trim() || creating}
                style={{
                  padding: "14px", background: examinerName.trim() ? "#E63946" : "rgba(255,255,255,0.05)",
                  color: examinerName.trim() ? "#fff" : "#404050",
                  border: "none", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer",
                }}>
                {creating ? t("common.loading") : t("exam.create")}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "#0E0E16", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 28, textAlign: "center", marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>{t("exam.createSession")} 완료</h2>
            <p style={{ textAlign: "center", color: "#606070", fontSize: 14, marginBottom: 28 }}>
              {session.poomsae_type} · {session.dan_level}단
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#1A1A26", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#E63946", marginBottom: 8 }}>{t("exam.examinerLink")}</div>
                <div style={{ fontSize: 13, color: "#A0A0B0", wordBreak: "break-all", marginBottom: 10 }}>
                  {origin}/exam/{session.id}/examiner
                </div>
                <a href={`/exam/${session.id}/examiner`}
                  style={{ display: "inline-block", padding: "10px 20px", background: "#E63946", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
                  심사위원으로 입장 →
                </a>
              </div>

              <div style={{ background: "#1A1A26", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 12, color: "#E9C46A", marginBottom: 8 }}>{t("exam.applicantLink")}</div>
                <div style={{ fontSize: 13, color: "#A0A0B0", wordBreak: "break-all", marginBottom: 10 }}>
                  {origin}/exam/{session.id}/applicant
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`${origin}/exam/${session.id}/applicant`)}
                  style={{ padding: "10px 20px", background: "rgba(233,196,106,0.15)", color: "#E9C46A", border: "1px solid rgba(233,196,106,0.3)", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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
