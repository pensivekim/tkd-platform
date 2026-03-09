"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { API_BASE } from "@/lib/api";

interface TrainingSession {
  id: string;
  instructor_name: string;
  title: string;
  poomsae_type: string;
  max_trainees: number;
  status: string;
  created_at: string;
}

const statusColor: Record<string, string> = { waiting: "#E9C46A", active: "#4ade80", completed: "#7EC8E3" };
const statusLabel: Record<string, string> = { waiting: "대기 중", active: "진행 중", completed: "완료" };

export default function TrainingPage() {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/training`)
      .then(r => r.json())
      .then(d => { setSessions(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: "#E9C46A", textDecoration: "none", fontSize: 13 }}>{t("common.backToHome")}</Link>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, color: "#E9C46A" }}>DOJANGWAN</span>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>🎓 {t("training.title")}</span>
        </div>
        <Link href="/training/create"
          style={{ padding: "8px 20px", background: "#E9C46A", color: "#0A0A0F", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
          + {t("training.createSession")}
        </Link>
      </div>

      <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{t("training.title")}</h1>
        <p style={{ color: "#606070", marginBottom: 32 }}>사범 원격 연수 세션을 관리합니다. 강사 1명 ↔ 사범 최대 30명.</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#404050" }}>{t("common.loading")}</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#404050" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
            <p>아직 연수 세션이 없습니다.</p>
            <Link href="/training/create"
              style={{ display: "inline-block", marginTop: 16, padding: "10px 24px", background: "#E9C46A", color: "#0A0A0F", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
              첫 연수 세션 생성
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
                      background: `${statusColor[s.status] ?? "#606070"}20`, color: statusColor[s.status] ?? "#606070",
                      border: `1px solid ${statusColor[s.status] ?? "#606070"}50`,
                    }}>{statusLabel[s.status] ?? s.status}</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{s.title}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#808090" }}>
                    강사: {s.instructor_name} · {s.poomsae_type} · {new Date(s.created_at).toLocaleString("ko-KR")}
                  </div>
                </div>
                <Link href={`/training/${s.id}/instructor`}
                  style={{ padding: "8px 16px", background: "rgba(233,196,106,0.15)", color: "#E9C46A", border: "1px solid rgba(233,196,106,0.3)", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>
                  {t("training.instructorView")} →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
