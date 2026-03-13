"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Radio, Camera, Trophy, Smartphone } from "lucide-react";
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

const FEATURES = [
  { Icon: Radio,      title: "실시간 라이브",   desc: "스마트폰 카메라 하나로 대회 현장을 WebRTC로 즉시 중계.", color: "#2A9D8F" },
  { Icon: Camera,     title: "AI 포토 갤러리", desc: "방송 중 사진 캡처 → 선수별 자동 분류. 대회 후 앨범 완성.", color: "#E63946" },
  { Icon: Trophy,     title: "점수판 오버레이", desc: "청·홍 선수 점수를 시청자 화면에 실시간 표시.", color: "#E9C46A" },
  { Icon: Smartphone, title: "앱 없이 시청",   desc: "링크 하나로 전 세계 어디서나 모바일 시청 가능.", color: "#8247E5" },
];

const FLOW = [
  { step: "01", label: "대회 이벤트 생성", sub: "대회명·날짜·장소 입력" },
  { step: "02", label: "스마트폰 방송 시작", sub: "카메라 선택 후 LIVE 버튼" },
  { step: "03", label: "전 세계 실시간 시청", sub: "링크 공유 → 즉시 접속" },
];

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

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ color: "#2A9D8F", textDecoration: "none", fontSize: 13 }}>← TKP</Link>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>🏆 대회 라이브 중계</span>
        </div>
        <Link href="/arena/create"
          style={{ padding: "8px 20px", background: "#2A9D8F", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
          + {t("arena.createEvent")}
        </Link>
      </div>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", padding: "60px 24px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500, height: 300,
          background: "radial-gradient(ellipse, rgba(42,157,143,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          border: "1px solid rgba(42,157,143,0.25)", background: "rgba(42,157,143,0.07)",
          borderRadius: 999, padding: "4px 14px", fontSize: 11,
          color: "rgba(42,157,143,0.9)", marginBottom: 24, letterSpacing: 1,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2A9D8F", display: "inline-block" }} />
          LIVE BROADCAST · AI PHOTO · SCOREBOARD
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.2rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, wordBreak: "keep-all" }}>
          대회 현장을<br />
          <span style={{ color: "#2A9D8F" }}>전 세계에 실시간 중계</span>
        </h1>

        <p style={{ color: "#60607A", fontSize: 15, maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.7, wordBreak: "keep-all" }}>
          스마트폰 하나로 시작하는 라이브 중계.<br />
          AI 포토 갤러리가 선수 사진을 자동 분류하고, 점수판이 실시간으로 표시됩니다.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/arena/create" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#2A9D8F", color: "#fff",
            padding: "14px 32px", borderRadius: 12,
            textDecoration: "none", fontWeight: 700, fontSize: 15,
            boxShadow: "0 8px 24px rgba(42,157,143,0.3)",
          }}>
            대회 이벤트 만들기 →
          </Link>
          {events.some(e => e.broadcast_status === "live") && (
            <Link href={`/arena/${events.find(e => e.broadcast_status === "live")?.id}/watch`} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: "1px solid rgba(74,222,128,0.4)", color: "#4ade80",
              background: "rgba(74,222,128,0.08)",
              padding: "14px 32px", borderRadius: 12,
              textDecoration: "none", fontWeight: 700, fontSize: 15,
            }}>
              ● 지금 LIVE 시청
            </Link>
          )}
        </div>
      </div>

      {/* ── FLOW ── */}
      <div style={{ maxWidth: 720, margin: "0 auto 56px", padding: "0 24px" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "#2A9D8F", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 24 }}>
          중계 진행 흐름
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {FLOW.map((f, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(42,157,143,0.15)",
                borderRadius: 14, padding: "24px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#2A9D8F", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>{f.step}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, wordBreak: "keep-all" }}>{f.label}</div>
                <div style={{ fontSize: 11, color: "#404050" }}>{f.sub}</div>
              </div>
              {i < 2 && (
                <div style={{
                  position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)",
                  color: "#2A9D8F", fontSize: 16, zIndex: 1,
                }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ maxWidth: 860, margin: "0 auto 56px", padding: "0 24px" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "#2A9D8F", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
          Why TKP Arena
        </p>
        <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 28, wordBreak: "keep-all" }}>
          기존 대회 중계와 무엇이 다른가
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

      {/* ── EVENT LIST ── */}
      <div style={{ maxWidth: 900, margin: "0 auto 64px", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: "#2A9D8F", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
            대회 이벤트 목록
          </p>
          <Link href="/arena/create" style={{ fontSize: 13, color: "#2A9D8F", textDecoration: "none", fontWeight: 600 }}>
            + 이벤트 생성 →
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#404050" }}>{t("common.loading")}</div>
        ) : events.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, color: "#404050",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
            <p style={{ marginBottom: 16 }}>아직 대회 이벤트가 없습니다.</p>
            <Link href="/arena/create"
              style={{ display: "inline-block", padding: "10px 24px", background: "#2A9D8F", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
              {t("arena.createEvent")}
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {events.map(ev => (
              <div key={ev.id} style={{
                background: "#0E0E16", border: ev.broadcast_status === "live"
                  ? "1px solid rgba(74,222,128,0.3)"
                  : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "18px 22px",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14,
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
                      <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "#4ade8018", color: "#4ade80", border: "1px solid #4ade8040" }}>
                        ● LIVE
                      </span>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{ev.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#808090" }}>
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

      {/* ── CTA ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(42,157,143,0.04)",
        padding: "48px 24px", textAlign: "center",
      }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, wordBreak: "keep-all" }}>
          다음 대회를 TKP Arena로 중계하세요
        </h3>
        <p style={{ color: "#60607A", fontSize: 14, marginBottom: 24, wordBreak: "keep-all" }}>
          별도 방송 장비 불필요. 스마트폰 하나로 전 세계 태권도 팬에게 중계.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/arena/create" style={{
            background: "#2A9D8F", color: "#fff",
            padding: "12px 28px", borderRadius: 10,
            textDecoration: "none", fontWeight: 700, fontSize: 13,
          }}>
            대회 이벤트 만들기 →
          </Link>
          <Link href="/register" style={{
            border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
            padding: "12px 28px", borderRadius: 10,
            textDecoration: "none", fontWeight: 600, fontSize: 13,
          }}>
            도장 무료 등록
          </Link>
        </div>
      </div>

    </div>
  );
}
