"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { POOMSAE_LIST } from "@/lib/poomsae-data";

export default function PoomsaePage() {
  const { t } = useI18n();

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/" style={{ color: "#E63946", textDecoration: "none", fontSize: 13 }}>← 홈</Link>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: "#E9C46A" }}>TKP</span>
        <span style={{ color: "#404050" }}>|</span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>🥋 {t("poomsae.title")}</span>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "48px 24px 32px" }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(36px, 6vw, 64px)", letterSpacing: 3, marginBottom: 10 }}>
          {t("poomsae.title")}
        </h1>
        <p style={{ color: "#606070", fontSize: 15 }}>{t("poomsae.subtitle")}</p>
      </div>

      {/* Cards grid */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {POOMSAE_LIST.map(p => (
          <div key={p.id} style={{
            background: "#0E0E18", borderRadius: 14, border: `1px solid ${p.color}30`,
            padding: 20, display: "flex", flexDirection: "column", gap: 10,
            transition: "transform 0.15s, border-color 0.15s",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
              (e.currentTarget as HTMLDivElement).style.borderColor = `${p.color}70`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "";
              (e.currentTarget as HTMLDivElement).style.borderColor = `${p.color}30`;
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: p.color, letterSpacing: 1 }}>
                {p.level.split("~")[0].trim()}단
              </span>
              <span style={{ fontSize: 10, color: p.color, background: `${p.color}15`, border: `1px solid ${p.color}30`, borderRadius: 20, padding: "2px 8px" }}>
                {p.level}
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.nameKo}</div>
              <div style={{ fontSize: 12, color: "#606070", lineHeight: 1.6 }}>{p.descKo}</div>
            </div>
            <div style={{ fontSize: 11, color: "#404050" }}>{p.moves.length}개 동작</div>
            <Link href={`/poomsae/${p.id}`} style={{
              display: "block", textAlign: "center", padding: "10px",
              background: `${p.color}18`, color: p.color,
              border: `1px solid ${p.color}40`, borderRadius: 8,
              textDecoration: "none", fontSize: 13, fontWeight: 700,
              marginTop: "auto",
            }}>
              {t("poomsae.tryNow")} →
            </Link>
          </div>
        ))}

        {/* Free practice card */}
        <div style={{
          background: "#0E0E18", borderRadius: 14, border: "1px solid rgba(233,196,106,0.3)",
          padding: 20, display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: "#E9C46A", letterSpacing: 1 }}>
            FREE
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{t("poomsae.free")}</div>
            <div style={{ fontSize: 12, color: "#606070", lineHeight: 1.6 }}>{t("poomsae.freeDesc")}</div>
          </div>
          <div style={{ fontSize: 11, color: "#404050" }}>5개 항목 실시간 채점</div>
          <Link href="/poomsae/free" style={{
            display: "block", textAlign: "center", padding: "10px",
            background: "rgba(233,196,106,0.12)", color: "#E9C46A",
            border: "1px solid rgba(233,196,106,0.4)", borderRadius: 8,
            textDecoration: "none", fontSize: 13, fontWeight: 700,
            marginTop: "auto",
          }}>
            {t("poomsae.startPractice")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
