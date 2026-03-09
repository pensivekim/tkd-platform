"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n, LANG_FLAGS, type Lang } from "@/lib/i18n";

const fontLink = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+KR:wght@300;400;500;700&family=Outfit:wght@300;400;500;600;700&display=swap');`;

function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t: number | null = null;
    const animate = (ts: number) => {
      if (!t) t = ts;
      const p = Math.min((ts - t) / duration, 1);
      setValue(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, start]);
  return value;
}

const POOMSAE_LIST = [
  "태극 1장","태극 2장","태극 3장","태극 4장","태극 5장",
  "태극 6장","태극 7장","태극 8장","고려","금강","태백","평원","십진","지태","천권","한수","일여",
];

const COST_ROWS = [
  { phase: "Phase 1 (무료 티어)", exam: "0원", training: "0원", arena: "0원", total: "0원" },
  { phase: "Phase 2 (~50회/월)", exam: "1,600원", training: "7,500원", arena: "28,000원", total: "~37,100원" },
  { phase: "Phase 3 (대규모)", exam: "16,000원", training: "75,000원", arena: "280,000원", total: "~371,000원" },
];

const LANGS: Lang[] = ["ko", "en", "th", "es"];

export default function Home() {
  const { t, lang, setLang } = useI18n();
  const [navBg, setNavBg] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [openLayer, setOpenLayer] = useState<number | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = fontLink;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  useEffect(() => {
    const fn = () => setNavBg(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const c0 = useCountUp(210, 1800, statsVisible);
  const c1 = useCountUp(15000, 1800, statsVisible);
  const c2 = useCountUp(4000, 1800, statsVisible);
  const c3 = useCountUp(294, 1800, statsVisible);
  const c4 = useCountUp(5, 1800, statsVisible);

  const statsData = [
    { label: t("stats.countries"), value: c0, suffix: "+", prefix: "", unit: "개국" },
    { label: t("stats.usDojang"), value: c1, suffix: "", prefix: "", unit: "개" },
    { label: t("stats.thDojang"), value: c2, suffix: "", prefix: "", unit: "개" },
    { label: t("stats.usPopulation"), value: c3, suffix: "만", prefix: "", unit: "" },
    { label: t("stats.marketSize"), value: c4, suffix: "~5조원", prefix: "", unit: "" },
  ];

  const sbtFlow = ["sbt.flow1","sbt.flow2","sbt.flow3","sbt.flow4","sbt.flow5"].map(k => t(k));

  const layers = [
    { title: t("layers.layer1Title"), desc: t("layers.layer1Desc"), price: t("layers.layer1Price"), status: t("layers.comingSoon"), color: "#808090", available: false },
    { title: t("layers.layer2Title"), desc: t("layers.layer2Desc"), price: "", status: t("layers.available"), color: "#4ade80", available: true },
    { title: t("layers.layer3Title"), desc: t("layers.layer3Desc"), price: "", status: t("layers.comingSoon"), color: "#808090", available: false },
  ];

  const techItems = [
    { label: t("tech.webrtc"), desc: t("tech.webrtcDesc") },
    { label: t("tech.mediapipe"), desc: t("tech.mediapipeDesc") },
    { label: t("tech.polygon"), desc: t("tech.polygonDesc") },
    { label: t("tech.faceAi"), desc: t("tech.faceAiDesc") },
  ];

  return (
    <div style={{ fontFamily: "'Noto Sans KR','Outfit',sans-serif", background: "#0A0A0F", color: "#F0F0F5", minHeight: "100vh" }}>
      {/* ─── Nav ─── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 60,
        padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: navBg ? "rgba(10,10,15,0.88)" : "transparent",
        backdropFilter: navBg ? "blur(12px)" : "none",
        borderBottom: navBg ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "background 0.3s",
      }}>
        <a href="/" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 3, color: "#E63946", textDecoration: "none" }}>
          DOJANGWAN
        </a>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#A0A0B0", alignItems: "center", flexWrap: "wrap" }}>
          {[
            { key: "nav.dojangSaas", href: "#layers" },
            { key: "nav.aiPoomsae", href: "#tech" },
            { key: "nav.remoteExam", href: "/exam" },
            { key: "nav.instructorTraining", href: "/training" },
            { key: "nav.liveArena", href: "/arena" },
            { key: "nav.digitalCert", href: "#sbt" },
          ].map(item => (
            <a key={item.key} href={item.href} style={{ color: "inherit", textDecoration: "none" }}>{t(item.key)}</a>
          ))}
          {/* Language selector */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setLangOpen(v => !v)} style={{
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6, padding: "4px 10px", color: "#F0F0F5", cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {LANG_FLAGS[lang]} {lang.toUpperCase()} ▾
            </button>
            {langOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0,
                background: "#1A1A26", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, overflow: "hidden", zIndex: 200, minWidth: 140,
              }}>
                {LANGS.map(l => (
                  <button key={l} onClick={() => { setLang(l); setLangOpen(false); }} style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "9px 14px", background: l === lang ? "rgba(230,57,70,0.12)" : "transparent",
                    color: l === lang ? "#E63946" : "#C0C0D0", border: "none", cursor: "pointer", fontSize: 13, textAlign: "left",
                  }}>
                    {LANG_FLAGS[l]} {t(`common.lang${l.charAt(0).toUpperCase()}${l.slice(1)}` as never)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center", padding: "80px 24px 60px",
        background: "radial-gradient(ellipse at 50% 40%, rgba(230,57,70,0.13) 0%, transparent 65%)",
      }}>
        <div style={{ fontSize: 12, letterSpacing: 5, color: "#E9C46A", marginBottom: 20, fontFamily: "'Outfit',sans-serif" }}>
          道場館 · TAEKWONDO BIRTHPLACE PLATFORM
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "clamp(72px, 14vw, 160px)", lineHeight: 0.9, letterSpacing: 6,
          background: "linear-gradient(135deg, #FFFFFF 0%, #E63946 55%, #E9C46A 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 20,
        }}>
          {t("hero.title")}
        </h1>
        <p style={{ fontSize: "clamp(15px, 2.5vw, 20px)", color: "#C0C0D0", marginBottom: 14, letterSpacing: 1 }}>
          {t("hero.subtitle")}
        </p>
        <p style={{ fontSize: 14, color: "#606070", maxWidth: 560, lineHeight: 1.8, marginBottom: 40 }}>
          {t("hero.desc")}
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="#layers" style={{
            padding: "14px 36px", background: "#E63946", color: "#fff",
            borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15,
          }}>{t("hero.ctaExplore")}</a>
          <a href="mailto:contact@genomic.cc" style={{
            padding: "14px 36px", border: "1px solid rgba(255,255,255,0.15)", color: "#F0F0F5",
            borderRadius: 8, textDecoration: "none", fontWeight: 500, fontSize: 15,
          }}>{t("hero.ctaPartner")}</a>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <div ref={statsRef} style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))",
        gap: 1, background: "rgba(255,255,255,0.04)", margin: "0 20px", borderRadius: 12, overflow: "hidden",
      }}>
        {statsData.map((s, i) => (
          <div key={i} style={{ padding: "28px 16px", textAlign: "center", background: "#0E0E18" }}>
            <div style={{
              fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, lineHeight: 1,
              color: ["#E63946","#E9C46A","#2A9D8F","#E63946","#E9C46A"][i],
            }}>
              {s.prefix}{s.value.toLocaleString()}{s.suffix}
            </div>
            <div style={{ fontSize: 12, color: "#606070", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Why Now ─── */}
      <section style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, textAlign: "center", letterSpacing: 3, marginBottom: 40 }}>
          {t("market.headline")}
        </h2>
        <div style={{
          background: "rgba(230,57,70,0.07)", border: "1px solid rgba(230,57,70,0.2)",
          borderRadius: 12, padding: "28px 32px", marginBottom: 28, textAlign: "center",
        }}>
          <p style={{ fontSize: 18, color: "#E9C46A", fontWeight: 700, lineHeight: 1.6 }}>{t("market.paradox")}</p>
        </div>
        <div style={{
          background: "#0E0E18", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, padding: "20px 28px", marginBottom: 28, textAlign: "center",
        }}>
          <p style={{ fontSize: 15, color: "#909090", lineHeight: 1.7 }}>{t("market.competition")}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 16 }}>
          {[
            { title: t("market.timing1"), desc: t("market.timing1Desc"), color: "#E63946" },
            { title: t("market.timing2"), desc: t("market.timing2Desc"), color: "#E9C46A" },
            { title: t("market.timing3"), desc: t("market.timing3Desc"), color: "#2A9D8F" },
          ].map((card, i) => (
            <div key={i} style={{ background: "#0E0E18", borderRadius: 10, padding: "20px 22px", border: `1px solid ${card.color}30` }}>
              <div style={{ color: card.color, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{card.title}</div>
              <div style={{ color: "#808090", fontSize: 13, lineHeight: 1.7 }}>{card.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3 Moats ─── */}
      <section style={{ padding: "80px 24px", background: "#07070E" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, textAlign: "center", letterSpacing: 3, marginBottom: 48 }}>
            {t("moat.sectionTitle")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 20 }}>
            {[
              { icon: "🏛️", title: t("moat.moat1Title"), desc: t("moat.moat1Desc"), color: "#E63946" },
              { icon: "🤖", title: t("moat.moat2Title"), desc: t("moat.moat2Desc"), color: "#E9C46A" },
              { icon: "🥋", title: t("moat.moat3Title"), desc: t("moat.moat3Desc"), color: "#2A9D8F" },
            ].map((m, i) => (
              <div key={i} style={{
                background: "#0E0E18", borderRadius: 14, padding: "28px",
                border: `1px solid ${m.color}30`, position: "relative", overflow: "hidden",
              }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{m.icon}</div>
                <div style={{ color: m.color, fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{m.title}</div>
                <div style={{ color: "#808090", fontSize: 14, lineHeight: 1.8 }}>{m.desc}</div>
                <div style={{
                  position: "absolute", bottom: -20, right: -20, width: 80, height: 80,
                  borderRadius: "50%", background: `${m.color}15`,
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3-Layer Structure ─── */}
      <section id="layers" style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, textAlign: "center", letterSpacing: 3, marginBottom: 48 }}>
          {t("layers.sectionTitle")}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {layers.map((layer, i) => (
            <div key={i}
              onClick={() => setOpenLayer(openLayer === i ? null : i)}
              style={{
                background: "#0E0E18", borderRadius: 12,
                border: `1px solid ${openLayer === i ? layer.color : "rgba(255,255,255,0.07)"}`,
                padding: "20px 26px", cursor: "pointer", transition: "border-color 0.3s",
              }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{
                    padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: `${layer.color}20`, color: layer.color, border: `1px solid ${layer.color}50`,
                  }}>{layer.status}</span>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{layer.title}</span>
                </div>
                <span style={{ color: "#606070", transform: openLayer === i ? "rotate(180deg)" : "none", transition: "transform 0.3s", display: "inline-block" }}>▼</span>
              </div>
              {openLayer === i && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "#909090", lineHeight: 1.8, fontSize: 14 }}>{layer.desc}</p>
                  {layer.price && <p style={{ color: "#E9C46A", marginTop: 8, fontWeight: 700 }}>{layer.price}</p>}
                  {layer.available && (
                    <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Link href="/poomsae" style={{ padding: "8px 18px", background: "rgba(230,57,70,0.15)", color: "#E63946", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                        🥋 {t("poomsae.tryNow")}
                      </Link>
                      <Link href="/exam" style={{ padding: "8px 18px", background: "rgba(230,57,70,0.10)", color: "#E63946", border: "1px solid rgba(230,57,70,0.2)", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>
                        {t("nav.remoteExam")} →
                      </Link>
                      <Link href="/training" style={{ padding: "8px 18px", background: "rgba(233,196,106,0.12)", color: "#E9C46A", border: "1px solid rgba(233,196,106,0.3)", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>
                        {t("nav.instructorTraining")} →
                      </Link>
                      <Link href="/arena" style={{ padding: "8px 18px", background: "rgba(42,157,143,0.12)", color: "#2A9D8F", border: "1px solid rgba(42,157,143,0.3)", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>
                        {t("nav.liveArena")} →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── SBT Digital Certificate ─── */}
      <section id="sbt" style={{ padding: "80px 24px", background: "#07070E" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, textAlign: "center", letterSpacing: 3, marginBottom: 10 }}>
            {t("sbt.sectionTitle")}
          </h2>
          <p style={{ textAlign: "center", color: "#606070", marginBottom: 48, fontSize: 15 }}>{t("sbt.sectionDesc")}</p>

          {/* Flow */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8, marginBottom: 48 }}>
            {sbtFlow.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  background: "#0E0E18", border: "1px solid rgba(230,57,70,0.3)",
                  borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#C0C0D0", textAlign: "center",
                }}>
                  <span style={{ color: "#E63946", fontWeight: 700, marginRight: 5 }}>{i+1}</span>{step}
                </div>
                {i < sbtFlow.length - 1 && <span style={{ color: "#E63946", fontSize: 18 }}>→</span>}
              </div>
            ))}
          </div>

          {/* 3 features */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16 }}>
            {[
              { title: t("sbt.feature1Title"), desc: t("sbt.feature1Desc"), icon: "🔒" },
              { title: t("sbt.feature2Title"), desc: t("sbt.feature2Desc"), icon: "🌐" },
              { title: t("sbt.feature3Title"), desc: t("sbt.feature3Desc"), icon: "♾️" },
            ].map((f, i) => (
              <div key={i} style={{ background: "#0E0E18", borderRadius: 12, padding: "22px", border: "1px solid rgba(233,196,106,0.15)" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ color: "#E9C46A", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</div>
                <div style={{ color: "#808090", fontSize: 14, lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Partners ─── */}
      <section style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, textAlign: "center", letterSpacing: 3, marginBottom: 48 }}>
          {t("partners.sectionTitle")}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 16 }}>
          {[
            { name: t("partners.kukkiwon"), desc: t("partners.kukkiwonDesc"), icon: "🏛️" },
            { name: t("partners.choi"), desc: t("partners.choiDesc"), icon: "🥇" },
            { name: t("partners.kbs"), desc: t("partners.kbsDesc"), icon: "📺" },
          ].map((p, i) => (
            <div key={i} style={{ background: "#0E0E18", borderRadius: 12, padding: "24px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{p.name}</div>
              <div style={{ color: "#808090", fontSize: 13, lineHeight: 1.7 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section id="tech" style={{ padding: "80px 24px", background: "#07070E" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, textAlign: "center", letterSpacing: 3, marginBottom: 48 }}>
            Tech Stack
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 14 }}>
            {techItems.map((t2, i) => (
              <div key={i} style={{ background: "#0E0E18", borderRadius: 12, padding: "22px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color: ["#E63946","#E9C46A","#2A9D8F","#E63946"][i], fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{t2.label}</div>
                <div style={{ color: "#707080", fontSize: 13, lineHeight: 1.7 }}>{t2.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cost Table ─── */}
      <section style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, textAlign: "center", letterSpacing: 3, marginBottom: 48 }}>
          비용 구조
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#0E0E18" }}>
                {["단계","원격 심사","사범 연수","대회 중계","합계"].map((h,i) => (
                  <th key={i} style={{ padding: "12px 16px", textAlign: "left", color: "#808090", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COST_ROWS.map((r, i) => (
                <tr key={i} style={{ background: i%2===0 ? "#0A0A0F" : "#0C0C14" }}>
                  <td style={{ padding: "12px 16px", color: "#E9C46A", fontWeight: 600 }}>{r.phase}</td>
                  <td style={{ padding: "12px 16px", color: "#909090" }}>{r.exam}</td>
                  <td style={{ padding: "12px 16px", color: "#909090" }}>{r.training}</td>
                  <td style={{ padding: "12px 16px", color: "#909090" }}>{r.arena}</td>
                  <td style={{ padding: "12px 16px", color: "#E63946", fontWeight: 700 }}>{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{
        padding: "80px 24px", textAlign: "center",
        background: "radial-gradient(ellipse at 50% 50%, rgba(230,57,70,0.10) 0%, transparent 65%)",
      }}>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, letterSpacing: 3, marginBottom: 16, lineHeight: 1.1 }}>
          {lang === "ko" ? "도장관과 함께\n태권도의 디지털 전환을 시작하세요" :
           lang === "en" ? "Start the Digital Transformation\nof Taekwondo with DOJANGWAN" :
           lang === "th" ? "เริ่มการเปลี่ยนแปลงดิจิทัล\nของเทควันโดกับ DOJANGWAN" :
           "Comienza la Transformación Digital\ndel Taekwondo con DOJANGWAN"}
        </h2>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
          <a href="mailto:contact@genomic.cc" style={{
            padding: "15px 44px", background: "#E63946", color: "#fff",
            borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16,
            boxShadow: "0 0 40px rgba(230,57,70,0.3)",
          }}>{t("hero.ctaPartner")}</a>
          <Link href="/exam" style={{
            padding: "15px 44px", border: "1px solid rgba(255,255,255,0.15)", color: "#F0F0F5",
            borderRadius: 8, textDecoration: "none", fontWeight: 500, fontSize: 16,
          }}>Demo →</Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px",
        textAlign: "center", color: "#404050", fontSize: 13,
      }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#E63946", marginBottom: 8, letterSpacing: 3 }}>DOJANGWAN</div>
        <div style={{ marginBottom: 6 }}>{t("footer.company")}</div>
        <div>{t("footer.copyright")}</div>
      </footer>
    </div>
  );
}
