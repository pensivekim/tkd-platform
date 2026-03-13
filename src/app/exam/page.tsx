"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Video, Brain, Award, Globe } from "lucide-react";
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

const FEATURES = [
  { Icon: Video,  title: "실시간 WebRTC",  desc: "심사위원과 응시자가 화상으로 직접 연결. 지연 없는 라이브 심사.", color: "#E63946" },
  { Icon: Brain,  title: "AI 자세 분석",   desc: "MediaPipe가 33개 키포인트를 실시간 추적. 객관적 점수 자동 산출.", color: "#8247E5" },
  { Icon: Award,  title: "온체인 단증",    desc: "합격 즉시 Polygon SBT 자동 발행. 위변조 불가 영구 기록.", color: "#E9C46A" },
  { Icon: Globe,  title: "장소 무관",      desc: "인터넷만 있으면 전 세계 어디서나. 해외 교민 도장도 OK.", color: "#2A9D8F" },
];

const FLOW = [
  { step: "01", label: "심사 세션 생성",  sub: "심사위원이 품새·단 설정 후 링크 공유" },
  { step: "02", label: "응시자 입장",     sub: "링크 클릭 → 카메라 켜고 즉시 시작" },
  { step: "03", label: "AI + 심사위원",   sub: "실시간 점수 합산 → 합격/불합격 결정" },
];

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

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ color: "#E63946", textDecoration: "none", fontSize: 13 }}>← TKP</Link>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>🥋 원격 승단 심사</span>
        </div>
        <Link href="/exam/create"
          style={{ padding: "8px 20px", background: "#E63946", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
          + {t("exam.createSession")}
        </Link>
      </div>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", padding: "60px 24px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500, height: 300,
          background: "radial-gradient(ellipse, rgba(230,57,70,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          border: "1px solid rgba(230,57,70,0.25)", background: "rgba(230,57,70,0.07)",
          borderRadius: 999, padding: "4px 14px", fontSize: 11,
          color: "rgba(230,57,70,0.8)", marginBottom: 24, letterSpacing: 1,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E63946", display: "inline-block" }} />
          WEBRTC · AI SCORING · POLYGON SBT
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.2rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, wordBreak: "keep-all" }}>
          승단 심사,<br />
          <span style={{ color: "#E63946" }}>전 세계 어디서나 실시간으로</span>
        </h1>

        <p style={{ color: "#60607A", fontSize: 15, maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.7, wordBreak: "keep-all" }}>
          심사위원과 응시자가 화상으로 직접 연결.<br />
          AI가 33개 관절을 분석해 객관적 점수를 자동 산출합니다.
        </p>

        <Link href="/exam/create" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#E63946", color: "#fff",
          padding: "14px 32px", borderRadius: 12,
          textDecoration: "none", fontWeight: 700, fontSize: 15,
          boxShadow: "0 8px 24px rgba(230,57,70,0.3)",
        }}>
          심사 세션 시작하기 →
        </Link>
      </div>

      {/* ── FLOW ── */}
      <div style={{ maxWidth: 720, margin: "0 auto 56px", padding: "0 24px" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "#E63946", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 24 }}>
          심사 진행 흐름
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {FLOW.map((f, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(230,57,70,0.15)",
                borderRadius: 14, padding: "24px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#E63946", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>{f.step}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, wordBreak: "keep-all" }}>{f.label}</div>
                <div style={{ fontSize: 11, color: "#404050" }}>{f.sub}</div>
              </div>
              {i < 2 && (
                <div style={{
                  position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)",
                  color: "#E63946", fontSize: 16, zIndex: 1,
                }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ maxWidth: 860, margin: "0 auto 56px", padding: "0 24px" }}>
        <p style={{ textAlign: "center", fontSize: 11, color: "#E63946", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
          Why Online Exam
        </p>
        <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 28, wordBreak: "keep-all" }}>
          기존 대면 심사와 무엇이 다른가
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
          <p style={{ fontSize: 11, color: "#E63946", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
            심사 세션 목록
          </p>
          <Link href="/exam/create" style={{ fontSize: 13, color: "#E63946", textDecoration: "none", fontWeight: 600 }}>
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
            <div style={{ fontSize: 36, marginBottom: 12 }}>🥋</div>
            <p style={{ marginBottom: 16 }}>아직 심사 세션이 없습니다.</p>
            <Link href="/exam/create"
              style={{ display: "inline-block", padding: "10px 24px", background: "#E63946", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
              {t("exam.createSession")}
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
                      background: `${statusColors[s.status] ?? "#606070"}20`,
                      color: statusColors[s.status] ?? "#606070",
                      border: `1px solid ${statusColors[s.status] ?? "#606070"}50`,
                    }}>{statusLabels[s.status] ?? s.status}</span>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{s.poomsae_type}</span>
                    <span style={{ fontSize: 13, color: "#606070" }}>{s.dan_level}단</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#808090" }}>
                    {t("exam.examinerName")}: {s.examiner_name} · {new Date(s.created_at).toLocaleString("ko-KR")}
                  </div>
                  {s.final_result && (
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      <span style={{ color: s.final_result === "pass" ? "#4ade80" : "#E63946", fontWeight: 700 }}>
                        {s.final_result === "pass" ? t("exam.pass") : t("exam.fail")}
                      </span>
                      {s.examiner_score !== null && <span style={{ color: "#606070" }}> · 심사 {s.examiner_score}점</span>}
                      {s.ai_score !== null && <span style={{ color: "#606070" }}> · AI {s.ai_score}점</span>}
                    </div>
                  )}
                </div>
                <Link href={`/exam/${s.id}/examiner`}
                  style={{ padding: "8px 16px", background: "rgba(230,57,70,0.15)", color: "#E63946", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>
                  심사위원 입장 →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(230,57,70,0.04)",
        padding: "48px 24px", textAlign: "center",
      }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, wordBreak: "keep-all" }}>
          도장에서 바로 시작하세요
        </h3>
        <p style={{ color: "#60607A", fontSize: 14, marginBottom: 24, wordBreak: "keep-all" }}>
          별도 장비 없이 스마트폰 하나로. 해외 교민 수련생도 현지에서 승단 심사 가능.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/exam/create" style={{
            background: "#E63946", color: "#fff",
            padding: "12px 28px", borderRadius: 10,
            textDecoration: "none", fontWeight: 700, fontSize: 13,
          }}>
            심사 세션 만들기 →
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
