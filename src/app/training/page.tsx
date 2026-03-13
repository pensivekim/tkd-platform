"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Users, Brain, BarChart3, Wifi } from "lucide-react";
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

const FEATURES = [
  { Icon: Users,    title: "최대 30명 동시", desc: "강사 1명이 수련생 30명과 동시 화상 연결. 도장 규모 무관.", color: "#E9C46A" },
  { Icon: Brain,    title: "AI 실시간 채점", desc: "각 수련생의 품새 점수를 강사 화면에서 실시간 비교·확인.", color: "#8247E5" },
  { Icon: BarChart3, title: "도장별 랭킹",   desc: "세션 종료 후 참가 도장별 평균 점수 자동 집계.", color: "#E63946" },
  { Icon: Wifi,     title: "인터넷만 있으면", desc: "앱 설치 없이 링크 하나로 전국 어디서나 접속.", color: "#2A9D8F" },
];

const FLOW = [
  { step: "01", label: "강사가 세션 생성", sub: "품새 선택 후 참가 링크 발송" },
  { step: "02", label: "수련생 링크 입장", sub: "이름·도장 입력 후 카메라 ON" },
  { step: "03", label: "AI 동시 채점",    sub: "강사 화면에 실시간 점수 대시보드" },
];

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

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ color: "#E9C46A", textDecoration: "none", fontSize: 13 }}>← TKP</Link>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>🎓 원격 사범 연수</span>
        </div>
        <Link href="/training/create"
          style={{ padding: "8px 20px", background: "#E9C46A", color: "#0A0A0F", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
          + {t("training.createSession")}
        </Link>
      </div>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", padding: "60px 24px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500, height: 300,
          background: "radial-gradient(ellipse, rgba(233,196,106,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          border: "1px solid rgba(233,196,106,0.25)", background: "rgba(233,196,106,0.07)",
          borderRadius: 999, padding: "4px 14px", fontSize: 11,
          color: "rgba(233,196,106,0.8)", marginBottom: 24, letterSpacing: 1,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E9C46A", display: "inline-block" }} />
          WEBRTC · LIVE COACHING · AI SCORING
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.2rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, wordBreak: "keep-all" }}>
          사범 연수,<br />
          <span style={{ color: "#E9C46A" }}>거리 제한 없이 실시간으로</span>
        </h1>

        <p style={{ color: "#60607A", fontSize: 15, maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.7, wordBreak: "keep-all" }}>
          강사 1명 ↔ 수련생 최대 30명 동시 화상 연결.<br />
          각 수련생의 AI 품새 점수를 강사 화면에서 실시간 비교합니다.
        </p>

        <Link href="/training/create" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#E9C46A", color: "#0A0A0F",
          padding: "14px 32px", borderRadius: 12,
          textDecoration: "none", fontWeight: 700, fontSize: 15,
          boxShadow: "0 8px 24px rgba(233,196,106,0.25)",
        }}>
          연수 세션 시작하기 →
        </Link>
      </div>

      {/* ── FLOW ── */}
      <div style={{ maxWidth: 720, margin: "0 auto 56px", padding: "0 24px" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "#E9C46A", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 24 }}>
          연수 진행 흐름
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {FLOW.map((f, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(233,196,106,0.15)",
                borderRadius: 14, padding: "24px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#E9C46A", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>{f.step}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, wordBreak: "keep-all" }}>{f.label}</div>
                <div style={{ fontSize: 11, color: "#404050" }}>{f.sub}</div>
              </div>
              {i < 2 && (
                <div style={{
                  position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)",
                  color: "#E9C46A", fontSize: 16, zIndex: 1,
                }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ maxWidth: 860, margin: "0 auto 56px", padding: "0 24px" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "#E9C46A", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
          Why Online Training
        </p>
        <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 28, wordBreak: "keep-all" }}>
          오프라인 연수와 무엇이 다른가
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

      {/* ── SESSION LIST ── */}
      <div style={{ maxWidth: 900, margin: "0 auto 64px", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: "#E9C46A", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
            연수 세션 목록
          </p>
          <Link href="/training/create" style={{ fontSize: 13, color: "#E9C46A", textDecoration: "none", fontWeight: 600 }}>
            + 새 세션 →
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#404050" }}>{t("common.loading")}</div>
        ) : sessions.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, color: "#404050",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
            <p style={{ marginBottom: 16 }}>아직 연수 세션이 없습니다.</p>
            <Link href="/training/create"
              style={{ display: "inline-block", padding: "10px 24px", background: "#E9C46A", color: "#0A0A0F", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
              첫 연수 세션 생성
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sessions.map(s => (
              <div key={s.id} style={{
                background: "#0E0E16", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "18px 22px",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14,
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
                  <div style={{ fontSize: 12, color: "#808090" }}>
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

      {/* ── CTA ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(233,196,106,0.03)",
        padding: "48px 24px", textAlign: "center",
      }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, wordBreak: "keep-all" }}>
          협회·단체 연수에 바로 활용하세요
        </h3>
        <p style={{ color: "#60607A", fontSize: 14, marginBottom: 24, wordBreak: "keep-all" }}>
          전국 도장을 한 화면에서 동시 연수. 이동 비용 0원, 참가 인원 제한 없음.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/training/create" style={{
            background: "#E9C46A", color: "#0A0A0F",
            padding: "12px 28px", borderRadius: 10,
            textDecoration: "none", fontWeight: 700, fontSize: 13,
          }}>
            연수 세션 만들기 →
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
