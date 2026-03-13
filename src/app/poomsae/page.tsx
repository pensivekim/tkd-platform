"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { POOMSAE_LIST } from "@/lib/poomsae-data";

const FEATURES = [
  { value: "33", label: "AI 키포인트", sub: "MediaPipe Pose" },
  { value: "5",  label: "채점 항목",   sub: "정확도·대칭·안정·타이밍·완성도" },
  { value: "0",  label: "앱 설치",     sub: "브라우저만으로 동작" },
];

export default function PoomsaePage() {
  const { t } = useI18n();

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/" style={{ color: "#E63946", textDecoration: "none", fontSize: 13 }}>← TKP</Link>
        <span style={{ color: "#404050" }}>|</span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>🥋 AI 품새 채점</span>
      </div>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", padding: "60px 24px 40px", position: "relative", overflow: "hidden" }}>
        {/* glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500, height: 300,
          background: "radial-gradient(ellipse, rgba(230,57,70,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          border: "1px solid rgba(230,57,70,0.25)", background: "rgba(230,57,70,0.07)",
          borderRadius: 999, padding: "4px 14px", fontSize: 11,
          color: "rgba(230,57,70,0.8)", marginBottom: 24, letterSpacing: 1,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E63946", display: "inline-block" }} />
          AI POWERED · MEDIAPIPE POSE
        </div>

        <h1 style={{
          fontSize: "clamp(2rem, 6vw, 3.5rem)", fontWeight: 900,
          lineHeight: 1.1, marginBottom: 16, wordBreak: "keep-all",
        }}>
          AI가 내 품새를<br />
          <span style={{ color: "#E63946" }}>실시간으로 채점합니다</span>
        </h1>

        <p style={{ color: "#60607A", fontSize: 15, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7, wordBreak: "keep-all" }}>
          국기원 기준으로 자세·대칭·안정성을 자동 분석.<br />
          앱 설치 없이 브라우저만으로 즉시 체험.
        </p>

        <Link href="/poomsae/free" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#E63946", color: "#fff",
          padding: "14px 32px", borderRadius: 12,
          textDecoration: "none", fontWeight: 700, fontSize: 15,
          boxShadow: "0 8px 24px rgba(230,57,70,0.3)",
        }}>
          무료로 체험하기 →
        </Link>
      </div>

      {/* ── FEATURE BAR ── */}
      <div style={{
        maxWidth: 640, margin: "0 auto 56px",
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 1, borderRadius: 16, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.025)",
            padding: "20px 16px", textAlign: "center",
            borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#E63946", lineHeight: 1 }}>
              {f.value === "0" ? "No" : f.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: "#404050", marginTop: 3 }}>{f.sub}</div>
          </div>
        ))}
      </div>

      {/* ── POOMSAE CARDS ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 60px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#E63946", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
          품새 선택
        </p>
        <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 28, wordBreak: "keep-all" }}>
          연습할 품새를 선택하세요
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
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
                <span style={{ fontSize: 26, fontWeight: 900, color: p.color, letterSpacing: 1 }}>
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
            <div style={{ fontSize: 26, fontWeight: 900, color: "#E9C46A", letterSpacing: 1 }}>
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

      {/* ── BOTTOM CTA ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(230,57,70,0.04)",
        padding: "40px 24px", textAlign: "center",
      }}>
        <p style={{ color: "#60607A", fontSize: 14, marginBottom: 16, wordBreak: "keep-all" }}>
          도장에서 활용하고 싶으신가요?
        </p>
        <Link href="/register" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          border: "1px solid rgba(230,57,70,0.3)", color: "#E63946",
          padding: "10px 24px", borderRadius: 10,
          textDecoration: "none", fontWeight: 600, fontSize: 13,
        }}>
          DOJANGWAN 무료 시작 →
        </Link>
      </div>

    </div>
  );
}
