"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { API_BASE } from "@/lib/api";

interface ExamSession {
  id: string;
  examiner_name: string;
  applicant_name: string | null;
  poomsae_type: string;
  dan_level: number;
  status: string;
  ai_score: number | null;
  examiner_score: number | null;
  final_result: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  waiting: "#E9C46A",
  active: "#4ade80",
  completed: "#7EC8E3",
};

export default function ExamPage() {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/exam`)
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusLabels: Record<string, string> = {
    waiting: t("exam.waiting"),
    active: t("exam.active"),
    completed: t("exam.completed"),
  };

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit', sans-serif", color: "#F0F0F5" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: "#E63946", textDecoration: "none", fontSize: 13 }}>{t("common.backToHome")}</Link>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: "#E9C46A" }}>TKP</span>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>🥋 {t("exam.title")}</span>
        </div>
        <Link href="/exam/create"
          style={{ padding: "8px 20px", background: "#E63946", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
          + {t("exam.createSession")}
        </Link>
      </div>

      <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{t("exam.title")}</h1>
        <p style={{ color: "#606070", marginBottom: 32 }}>진행 중 및 완료된 심사 세션을 관리합니다.</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#404050" }}>{t("common.loading")}</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#404050" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🥋</div>
            <p>아직 심사 세션이 없습니다.</p>
            <Link href="/exam/create"
              style={{ display: "inline-block", marginTop: 16, padding: "10px 24px", background: "#E63946", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
              {t("exam.createSession")}
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sessions.map(s => (
              <div key={s.id} style={{
                background: "#0E0E16", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "20px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 20,
                      background: `${statusColors[s.status] ?? "#606070"}20`,
                      color: statusColors[s.status] ?? "#606070",
                      border: `1px solid ${statusColors[s.status] ?? "#606070"}50`,
                    }}>{statusLabels[s.status] ?? s.status}</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{s.poomsae_type}</span>
                    <span style={{ fontSize: 13, color: "#606070" }}>{s.dan_level}단</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#808090" }}>
                    {t("exam.examinerName")}: {s.examiner_name} · {new Date(s.created_at).toLocaleString("ko-KR")}
                  </div>
                  {s.final_result && (
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      <span style={{ color: "#606070" }}>결과: </span>
                      <span style={{ color: s.final_result === "pass" ? "#4ade80" : "#E63946", fontWeight: 700 }}>
                        {s.final_result === "pass" ? t("exam.pass") : t("exam.fail")}
                      </span>
                      {s.examiner_score !== null && <span style={{ color: "#606070" }}> · {t("exam.examinerScore")} {s.examiner_score}점</span>}
                      {s.ai_score !== null && <span style={{ color: "#606070" }}> · {t("exam.aiScore")} {s.ai_score}점</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href={`/exam/${s.id}/examiner`}
                    style={{ padding: "8px 16px", background: "rgba(230,57,70,0.15)", color: "#E63946", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>
                    심사위원 입장
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
