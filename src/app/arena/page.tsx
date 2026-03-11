"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { API_BASE } from "@/lib/api";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  broadcast_status: string;
  viewer_count: number;
  created_at: string;
}

const statusColor: Record<string, string> = { upcoming: "#E9C46A", live: "#4ade80", ended: "#7EC8E3" };

export default function ArenaPage() {
  const { t } = useI18n();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/arena`)
      .then(r => r.json())
      .then(d => { setEvents(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusLabel = (s: string) =>
    s === "upcoming" ? t("arena.upcoming") : s === "live" ? t("arena.live") : t("arena.ended");

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: "#2A9D8F", textDecoration: "none", fontSize: 13 }}>{t("common.backToHome")}</Link>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, color: "#E9C46A" }}>TKP</span>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>🏆 {t("arena.title")}</span>
        </div>
        <Link href="/arena/create"
          style={{ padding: "8px 20px", background: "#2A9D8F", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
          + {t("arena.createEvent")}
        </Link>
      </div>

      <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{t("arena.title")}</h1>
        <p style={{ color: "#606070", marginBottom: 32 }}>대회 라이브 중계 및 AI 포토 갤러리를 관리합니다.</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#404050" }}>{t("common.loading")}</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#404050" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
            <p>아직 대회가 없습니다.</p>
            <Link href="/arena/create"
              style={{ display: "inline-block", marginTop: 16, padding: "10px 24px", background: "#2A9D8F", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
              {t("arena.createEvent")}
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events.map(ev => (
              <div key={ev.id} style={{
                background: "#0E0E16", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "20px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 20,
                      background: `${statusColor[ev.status] ?? "#606070"}20`,
                      color: statusColor[ev.status] ?? "#606070",
                      border: `1px solid ${statusColor[ev.status] ?? "#606070"}50`,
                    }}>{statusLabel(ev.status)}</span>
                    {ev.broadcast_status === "live" && (
                      <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "#4ade8020", color: "#4ade80", border: "1px solid #4ade8050" }}>● LIVE</span>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{ev.title}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#808090" }}>
                    {ev.date && <span>{ev.date} · </span>}
                    {ev.location && <span>{ev.location} · </span>}
                    <span>{new Date(ev.created_at).toLocaleString("ko-KR")}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href={`/arena/${ev.id}/broadcast`}
                    style={{ padding: "7px 14px", background: "rgba(42,157,143,0.15)", color: "#2A9D8F", border: "1px solid rgba(42,157,143,0.3)", borderRadius: 8, textDecoration: "none", fontSize: 12 }}>
                    📡 방송
                  </Link>
                  <Link href={`/arena/${ev.id}/watch`}
                    style={{ padding: "7px 14px", background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, textDecoration: "none", fontSize: 12 }}>
                    📺 시청
                  </Link>
                  <Link href={`/arena/${ev.id}/photos`}
                    style={{ padding: "7px 14px", background: "rgba(233,196,106,0.1)", color: "#E9C46A", border: "1px solid rgba(233,196,106,0.3)", borderRadius: 8, textDecoration: "none", fontSize: 12 }}>
                    📸 사진
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
