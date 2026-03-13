"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Globe, Infinity, QrCode } from "lucide-react";

const FEATURES = [
  {
    Icon: ShieldCheck,
    title: "위변조 불가",
    desc: "블록체인에 기록된 단증은 누구도 수정·삭제할 수 없습니다.",
    color: "#10B981",
  },
  {
    Icon: Globe,
    title: "전세계 즉시 검증",
    desc: "QR코드 하나로 2초 안에 온체인 조회. 언어·국가 관계없이.",
    color: "#3B82F6",
  },
  {
    Icon: Infinity,
    title: "영구 소유",
    desc: "플랫폼이 없어져도 단증은 블록체인에 영원히 존재합니다.",
    color: "#8247E5",
  },
  {
    Icon: QrCode,
    title: "QR 검증",
    desc: "단증에 인쇄된 QR코드를 스캔하면 즉시 진위 확인.",
    color: "#F59E0B",
  },
];

const FLOW = [
  { step: "01", label: "승단 심사 합격", sub: "도장 원장님이 단증 발행" },
  { step: "02", label: "Polygon 자동 발행", sub: "온체인 SBT 토큰 생성" },
  { step: "03", label: "QR로 전세계 검증", sub: "누구나, 언제나, 무료로" },
];

export default function CertLandingPage() {
  const router = useRouter();
  const [certNumber, setCertNumber] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = certNumber.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/verify/${trimmed}`);
  }

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", color: "#F0F0F5", fontFamily: "system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/" style={{ color: "#8247E5", textDecoration: "none", fontSize: 13 }}>← TKP</Link>
        <span style={{ color: "#404050" }}>|</span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>⛓ 블록체인 디지털 단증</span>
      </div>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", padding: "64px 24px 48px", position: "relative", overflow: "hidden" }}>
        {/* purple glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600, height: 400,
          background: "radial-gradient(ellipse, rgba(130,71,229,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          border: "1px solid rgba(130,71,229,0.3)", background: "rgba(130,71,229,0.08)",
          borderRadius: 999, padding: "4px 14px", fontSize: 11,
          color: "rgba(130,71,229,0.9)", marginBottom: 24, letterSpacing: 1,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#8247E5", display: "inline-block" }} />
          POLYGON BLOCKCHAIN · SBT
        </div>

        <h1 style={{
          fontSize: "clamp(1.8rem, 5vw, 3.2rem)", fontWeight: 900,
          lineHeight: 1.15, marginBottom: 16, wordBreak: "keep-all",
        }}>
          태권도 단증,<br />
          <span style={{ color: "#8247E5" }}>이제 블록체인으로 증명합니다</span>
        </h1>

        <p style={{ color: "#60607A", fontSize: 15, maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7, wordBreak: "keep-all" }}>
          위변조 불가 · 글로벌 즉시 검증 · 영구 소유<br />
          단증 번호만 있으면 전세계 어디서나 2초 안에 확인.
        </p>

        {/* 단증 번호 검색 */}
        <form onSubmit={handleSearch} style={{ maxWidth: 440, margin: "0 auto" }}>
          <div style={{
            display: "flex", gap: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(130,71,229,0.25)",
            borderRadius: 14, padding: 6,
          }}>
            <input
              type="text"
              value={certNumber}
              onChange={e => setCertNumber(e.target.value)}
              placeholder="단증 번호 입력 (예: TKP-2024-000001)"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#F0F0F5", fontSize: 14, padding: "8px 12px",
              }}
            />
            <button type="submit" style={{
              background: "#8247E5", color: "#fff",
              border: "none", borderRadius: 10, padding: "10px 20px",
              fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            }}>
              검증하기 →
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#404050", marginTop: 8 }}>
            QR코드를 스캔해도 동일하게 검증됩니다
          </p>
        </form>
      </div>

      {/* ── FLOW ── */}
      <div style={{ maxWidth: 720, margin: "0 auto 64px", padding: "0 24px" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "#8247E5", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 24 }}>
          단증 발행 흐름
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {FLOW.map((f, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(130,71,229,0.15)",
                borderRadius: 14, padding: "24px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#8247E5", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
                  {f.step}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, wordBreak: "keep-all" }}>{f.label}</div>
                <div style={{ fontSize: 11, color: "#404050" }}>{f.sub}</div>
              </div>
              {i < 2 && (
                <div style={{
                  position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)",
                  color: "#8247E5", fontSize: 16, zIndex: 1,
                }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ maxWidth: 800, margin: "0 auto 64px", padding: "0 24px" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "#8247E5", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
          Why Blockchain
        </p>
        <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 28, wordBreak: "keep-all" }}>
          종이 단증과 무엇이 다른가
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
          {FEATURES.map(({ Icon, title, desc, color }) => (
            <div key={title} style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "24px 18px",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={19} color={color} strokeWidth={1.8} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#606070", lineHeight: 1.6, wordBreak: "keep-all" }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(130,71,229,0.04)",
        padding: "48px 24px", textAlign: "center",
      }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, wordBreak: "keep-all" }}>
          도장에서 발행하고 싶으신가요?
        </h3>
        <p style={{ color: "#60607A", fontSize: 14, marginBottom: 24, wordBreak: "keep-all" }}>
          DOJANGWAN에 가입하면 수련생에게 블록체인 단증을 발행할 수 있습니다.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{
            background: "#8247E5", color: "#fff",
            padding: "12px 28px", borderRadius: 10,
            textDecoration: "none", fontWeight: 700, fontSize: 13,
          }}>
            무료로 시작하기 →
          </Link>
          <Link href="/" style={{
            border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
            padding: "12px 28px", borderRadius: 10,
            textDecoration: "none", fontWeight: 600, fontSize: 13,
          }}>
            플랫폼 소개 보기
          </Link>
        </div>
      </div>

    </div>
  );
}
