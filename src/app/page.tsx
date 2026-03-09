"use client";

import { useEffect, useRef, useState } from "react";

const fontLink = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@300;400;500;700&family=Outfit:wght@300;400;500;600;700&display=swap');`;

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, start]);
  return value;
}

const modules = [
  {
    icon: "🥋",
    title: "원격 승단 심사",
    color: "#E63946",
    price: "건당 32원",
    priceDetail: "시간당 약 480원 (Egress 기준)",
    desc: "심사위원(한국)과 응시자(해외)를 WebRTC로 실시간 양방향 연결. AI가 품새 동작을 스켈레톤으로 분석하여 즉시 채점.",
    features: ["1:1 WebRTC HD 영상", "MediaPipe Pose 실시간 분석", "AI 채점 + 심사위원 최종 판단", "심사 영상 자동 녹화"],
  },
  {
    icon: "🎓",
    title: "사범 원격 연수",
    color: "#E9C46A",
    price: "회당 150원",
    priceDetail: "2시간 기준, 30명 참가",
    desc: "강사 1명이 사범·관장 최대 30명에게 원격 품새 연수. AI가 각 사범의 동작을 실시간 분석하여 강사 화면에 표시.",
    features: ["1:N Cloudflare SFU", "AI 동작 분석 (엣지 처리)", "30명 동시 모니터링", "음성 85% 비용 절감 옵션"],
  },
  {
    icon: "📡",
    title: "대회 라이브 + AI 포토",
    color: "#2A9D8F",
    price: "대회당 28,000원",
    priceDetail: "200명 시청, 6시간 기준",
    desc: "스마트폰으로 대회 실시간 중계 + AI 얼굴인식으로 선수별 사진 자동 분류. 학부모에게 메신저로 즉시 전송.",
    features: ["WebRTC 실시간 중계", "AI 얼굴인식 포토 분류", "LINE / 카카오 자동 전송", "대용량 HLS 전환 지원"],
  },
];

const statsData = [
  { label: "태국 도장", target: 4000, suffix: "+", unit: "개" },
  { label: "수련생", target: 100, suffix: "만+", unit: "" },
  { label: "WebRTC 지연", target: 500, suffix: "ms", unit: "<" },
  { label: "Cloudflare PoP", target: 330, suffix: "+", unit: "개" },
];

const costRows = [
  { phase: "Phase 1 (무료 티어)", exam: "0원", training: "0원", arena: "0원", total: "0원" },
  { phase: "Phase 2 (~50회/월)", exam: "1,600원", training: "7,500원", arena: "28,000원", total: "~37,100원" },
  { phase: "Phase 3 (대규모)", exam: "16,000원", training: "75,000원", arena: "280,000원", total: "~371,000원" },
];

const techItems = [
  { label: "WebRTC SFU", value: "Cloudflare Realtime", color: "#E63946", desc: "$0.05/GB · 330+ PoP" },
  { label: "AI 동작 분석", value: "MediaPipe Pose", color: "#E9C46A", desc: "33 keypoints · 브라우저 실행" },
  { label: "AI 얼굴인식", value: "Cloudflare R2 기반", color: "#2A9D8F", desc: "선수별 자동 분류" },
  { label: "프레임워크", value: "Next.js 15", color: "#E63946", desc: "App Router + TypeScript" },
  { label: "데이터베이스", value: "Cloudflare D1", color: "#E9C46A", desc: "SQLite · 서버리스" },
  { label: "메시지", value: "LINE + 카카오톡", color: "#2A9D8F", desc: "태국 LINE · 한국 알림톡" },
];

export default function Home() {
  const [openModule, setOpenModule] = useState<number | null>(null);
  const [navBg, setNavBg] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = fontLink;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    const handleScroll = () => setNavBg(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const count0 = useCountUp(statsData[0].target, 1800, statsVisible);
  const count1 = useCountUp(statsData[1].target, 1800, statsVisible);
  const count2 = useCountUp(statsData[2].target, 1800, statsVisible);
  const count3 = useCountUp(statsData[3].target, 1800, statsVisible);
  const counts = [count0, count1, count2, count3];

  const colors = ["#E63946", "#E9C46A", "#2A9D8F", "#E63946"];

  return (
    <div style={{ fontFamily: "'Noto Sans KR', 'Outfit', sans-serif", background: "#0A0A0F", color: "#F0F0F5", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 24px",
        background: navBg ? "rgba(10,10,15,0.85)" : "transparent",
        backdropFilter: navBg ? "blur(12px)" : "none",
        transition: "background 0.3s",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
        borderBottom: navBg ? "1px solid rgba(255,255,255,0.07)" : "none",
      }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 2, color: "#E63946" }}>TKD PLATFORM</span>
        <div style={{ display: "flex", gap: 24, fontSize: 14, color: "#B0B0C0" }}>
          <a href="#modules" style={{ color: "inherit", textDecoration: "none" }}>모듈</a>
          <a href="#tech" style={{ color: "inherit", textDecoration: "none" }}>기술</a>
          <a href="#cost" style={{ color: "inherit", textDecoration: "none" }}>비용</a>
          <a href="mailto:contact@genomic.cc" style={{ color: "#E63946", textDecoration: "none", fontWeight: 600 }}>문의</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "80px 24px 60px",
        background: "radial-gradient(ellipse at 50% 40%, rgba(230,57,70,0.12) 0%, rgba(10,10,15,0) 70%)",
      }}>
        <div style={{ fontSize: 13, letterSpacing: 4, color: "#E9C46A", marginBottom: 20, fontFamily: "'Outfit', sans-serif" }}>
          tkd.genomic.cc
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(56px, 10vw, 120px)",
          lineHeight: 1, letterSpacing: 4,
          background: "linear-gradient(135deg, #FFFFFF 0%, #E63946 60%, #E9C46A 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 24,
        }}>
          TAEKWONDO<br />AI PLATFORM
        </h1>
        <p style={{ fontSize: "clamp(16px, 3vw, 22px)", color: "#B0B0C0", marginBottom: 16, letterSpacing: 2 }}>
          원격 심사 · 사범 연수 · 대회 미디어화
        </p>
        <p style={{ fontSize: 14, color: "#606070", maxWidth: 500, lineHeight: 1.7, marginBottom: 40 }}>
          Cloudflare Realtime SFU + MediaPipe Pose + AI 얼굴인식<br />
          국기원 승단부터 태국 4,000개 도장 사범 연수까지
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="#modules" style={{
            padding: "14px 36px", background: "#E63946", color: "#fff",
            borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15,
            fontFamily: "'Outfit', sans-serif",
          }}>모듈 살펴보기</a>
          <a href="#cost" style={{
            padding: "14px 36px", border: "1px solid rgba(255,255,255,0.15)", color: "#F0F0F5",
            borderRadius: 8, textDecoration: "none", fontWeight: 500, fontSize: 15,
            fontFamily: "'Outfit', sans-serif",
          }}>비용 확인</a>
        </div>
      </section>

      {/* Stats */}
      <div ref={statsRef} style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 1, background: "rgba(255,255,255,0.05)", margin: "0 24px",
        borderRadius: 12, overflow: "hidden",
      }}>
        {statsData.map((s, i) => (
          <div key={i} style={{ padding: "32px 24px", textAlign: "center", background: "#0E0E16" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, lineHeight: 1, color: colors[i] }}>
              {s.unit === "<" ? "<" : ""}{counts[i].toLocaleString()}{s.suffix}
            </div>
            <div style={{ fontSize: 13, color: "#707080", marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <section id="modules" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, textAlign: "center", letterSpacing: 3, marginBottom: 48 }}>
          3개 독립 모듈
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {modules.map((m, i) => (
            <div key={i}
              onClick={() => setOpenModule(openModule === i ? null : i)}
              style={{
                background: "#0E0E16",
                border: `1px solid ${openModule === i ? m.color : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, padding: "24px 28px", cursor: "pointer",
                transition: "border-color 0.3s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 32 }}>{m.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#F0F0F5" }}>{m.title}</h3>
                    <span style={{ fontSize: 14, color: m.color, fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{m.price}</span>
                  </div>
                </div>
                <span style={{ color: "#606070", fontSize: 20, display: "inline-block", transform: openModule === i ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>▼</span>
              </div>
              {openModule === i && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ color: "#A0A0B0", lineHeight: 1.8, marginBottom: 16 }}>{m.desc}</p>
                  <p style={{ fontSize: 13, color: "#606070", marginBottom: 16 }}>{m.priceDetail}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {m.features.map((f, j) => (
                      <span key={j} style={{
                        padding: "6px 14px", borderRadius: 20,
                        background: `${m.color}20`, border: `1px solid ${m.color}50`,
                        fontSize: 13, color: m.color,
                      }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" style={{ padding: "80px 24px", background: "#08080F" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, textAlign: "center", letterSpacing: 3, marginBottom: 16 }}>
            기술 스택
          </h2>
          <p style={{ textAlign: "center", color: "#606070", marginBottom: 48 }}>엣지 처리 + SFU = 최소 비용, 최대 성능</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {techItems.map((t, i) => (
              <div key={i} style={{ background: "#0E0E16", borderRadius: 12, padding: "24px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 12, color: t.color, fontFamily: "'Outfit', sans-serif", letterSpacing: 1, marginBottom: 8 }}>{t.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{t.value}</div>
                <div style={{ fontSize: 13, color: "#606070" }}>{t.desc}</div>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div style={{ marginTop: 60, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div style={{ background: "#0E0E16", borderRadius: 12, padding: 28, border: "1px solid rgba(230,57,70,0.2)" }}>
              <h3 style={{ color: "#E63946", marginBottom: 16, fontSize: 16, fontFamily: "'Outfit', sans-serif" }}>원격 심사 파이프라인</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "#A0A0B0" }}>
                {["응시자 카메라 → MediaPipe Pose", "키포인트 → 품새 채점 알고리즘", "AI 점수 → 심사위원 화면 표시", "심사위원 최종 결정 → D1 저장"].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#E63946", fontSize: 10 }}>▶</span>{s}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#0E0E16", borderRadius: 12, padding: 28, border: "1px solid rgba(42,157,143,0.2)" }}>
              <h3 style={{ color: "#2A9D8F", marginBottom: 16, fontSize: 16, fontFamily: "'Outfit', sans-serif" }}>대회 중계 파이프라인</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "#A0A0B0" }}>
                {["스마트폰 카메라 → Cloudflare SFU", "SFU → 시청자 브라우저 (WebRTC)", "사진 → R2 저장 + AI 얼굴인식", "선수 매칭 → LINE/카카오 자동 전송"].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#2A9D8F", fontSize: 10 }}>▶</span>{s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Table */}
      <section id="cost" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, textAlign: "center", letterSpacing: 3, marginBottom: 16 }}>
          비용 구조
        </h2>
        <p style={{ textAlign: "center", color: "#606070", marginBottom: 48 }}>
          Phase 1 파일럿은 무료 티어(월 1,000GB) 내에서 운영 — 비용 0원
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr style={{ background: "#0E0E16" }}>
                {["단계", "원격 심사", "사범 연수", "대회 중계", "합계"].map((h, i) => (
                  <th key={i} style={{ padding: "14px 20px", textAlign: "left", color: "#808090", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {costRows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#0A0A0F" : "#0C0C14" }}>
                  <td style={{ padding: "14px 20px", color: "#E9C46A", fontWeight: 600 }}>{r.phase}</td>
                  <td style={{ padding: "14px 20px", color: "#A0A0B0" }}>{r.exam}</td>
                  <td style={{ padding: "14px 20px", color: "#A0A0B0" }}>{r.training}</td>
                  <td style={{ padding: "14px 20px", color: "#A0A0B0" }}>{r.arena}</td>
                  <td style={{ padding: "14px 20px", color: "#E63946", fontWeight: 700 }}>{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "80px 24px", textAlign: "center",
        background: "radial-gradient(ellipse at 50% 50%, rgba(230,57,70,0.1) 0%, rgba(10,10,15,0) 70%)",
      }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, letterSpacing: 3, marginBottom: 16 }}>
          지금 시작하세요
        </h2>
        <p style={{ color: "#606070", marginBottom: 32, fontSize: 16 }}>tkd.genomic.cc — 태권도 AI 플랫폼</p>
        <a href="mailto:contact@genomic.cc" style={{
          display: "inline-block", padding: "16px 48px",
          background: "linear-gradient(135deg, #E63946, #C1121F)",
          color: "#fff", borderRadius: 8, textDecoration: "none",
          fontWeight: 700, fontSize: 16, fontFamily: "'Outfit', sans-serif",
          boxShadow: "0 0 40px rgba(230,57,70,0.3)",
        }}>
          파트너십 문의
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "32px 24px", textAlign: "center",
        color: "#404050", fontSize: 13,
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "#E63946", marginBottom: 8, letterSpacing: 2 }}>TKD PLATFORM</div>
        <div>tkd.genomic.cc · Powered by Cloudflare + MediaPipe + AI</div>
        <div style={{ marginTop: 8 }}>© 2026 Genomic AI. All rights reserved.</div>
      </footer>
    </div>
  );
}
