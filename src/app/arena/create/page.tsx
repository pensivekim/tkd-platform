"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { API_BASE } from "@/lib/api";

interface Player { id: string; name: string; dojang_name: string; dan_level: number; category: string; parent_messenger_id: string; parent_messenger_type: string }
interface CreatedEvent { id: string; title: string }

export default function ArenaCreatePage() {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [creating, setCreating] = useState(false);
  const [event, setEvent] = useState<CreatedEvent | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  // Player form state
  const [pName, setPName] = useState("");
  const [pDojang, setPDojang] = useState("");
  const [pDan, setPDan] = useState("1");
  const [pCategory, setPCategory] = useState("품새");
  const [pMessenger, setPMessenger] = useState("");
  const [pMessengerType, setPMessengerType] = useState("line");
  const [addingPlayer, setAddingPlayer] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/arena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, location }),
      });
      setEvent(await res.json());
    } catch (e) { console.error(e); } finally { setCreating(false); }
  };

  const handleAddPlayer = async () => {
    if (!pName.trim() || !event) return;
    setAddingPlayer(true);
    try {
      const res = await fetch(`${API_BASE}/api/arena/${event.id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pName, dojang_name: pDojang, dan_level: Number(pDan), category: pCategory, parent_messenger_id: pMessenger, parent_messenger_type: pMessengerType }),
      });
      const p = await res.json();
      setPlayers(prev => [...prev, p]);
      setPName(""); setPDojang(""); setPMessenger("");
    } catch (e) { console.error(e); } finally { setAddingPlayer(false); }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const inputStyle = {
    width: "100%", background: "#1A1A26", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, padding: "11px 14px", color: "#F0F0F5", fontSize: 14,
    outline: "none", appearance: "none" as const, boxSizing: "border-box" as const,
  };

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/arena" style={{ color: "#2A9D8F", textDecoration: "none", fontSize: 13 }}>← 목록</Link>
        <span style={{ color: "#404050" }}>|</span>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, color: "#E9C46A" }}>TKP</span>
        <span style={{ color: "#404050" }}>|</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>🏆 {t("arena.createEvent")}</span>
      </div>

      <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {!event ? (
          <div style={{ background: "#0E0E16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{t("arena.createEvent")}</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("arena.eventTitle")} *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 2026 전국 태권도 품새 대회" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("arena.eventDate")}</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#909090", display: "block", marginBottom: 8 }}>{t("arena.eventLocation")}</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="예: 서울 올림픽 공원" style={inputStyle} />
              </div>
              <button onClick={handleCreate} disabled={!title.trim() || creating}
                style={{ padding: "13px", background: title.trim() ? "#2A9D8F" : "rgba(255,255,255,0.05)", color: title.trim() ? "#fff" : "#404050", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                {creating ? t("common.loading") : t("arena.create")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Success card */}
            <div style={{ background: "#0E0E16", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: 24, textAlign: "center", marginBottom: 8 }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 20 }}>{event.title}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: t("arena.broadcastLink"), color: "#2A9D8F", path: "broadcast" },
                  { label: t("arena.watchLink"), color: "#4ade80", path: "watch" },
                  { label: t("arena.photosLink"), color: "#E9C46A", path: "photos" },
                ].map(({ label, color, path }) => (
                  <div key={path} style={{ background: "#1A1A26", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, color, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 11, color: "#A0A0B0", wordBreak: "break-all", marginBottom: 8 }}>{origin}/arena/{event.id}/{path}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={`/arena/${event.id}/${path}`}
                        style={{ padding: "7px 16px", background: `${color}20`, color, border: `1px solid ${color}50`, borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                        입장 →
                      </a>
                      <button onClick={() => navigator.clipboard.writeText(`${origin}/arena/${event.id}/${path}`)}
                        style={{ padding: "7px 16px", background: "rgba(255,255,255,0.05)", color: "#909090", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                        {t("exam.copyLink")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player registration */}
            <div style={{ background: "#0E0E16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>🥋 {t("arena.addPlayer")}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#909090", display: "block", marginBottom: 6 }}>{t("arena.playerName")} *</label>
                  <input value={pName} onChange={e => setPName(e.target.value)} placeholder="홍길동" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#909090", display: "block", marginBottom: 6 }}>{t("arena.playerDojang")}</label>
                  <input value={pDojang} onChange={e => setPDojang(e.target.value)} placeholder="도장명" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#909090", display: "block", marginBottom: 6 }}>{t("arena.playerDan")}</label>
                  <select value={pDan} onChange={e => setPDan(e.target.value)} style={inputStyle}>
                    {[1,2,3,4,5,6,7,8,9].map(d => <option key={d} value={d}>{d}단</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#909090", display: "block", marginBottom: 6 }}>{t("arena.playerCategory")}</label>
                  <select value={pCategory} onChange={e => setPCategory(e.target.value)} style={inputStyle}>
                    {["품새","겨루기","격파"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#909090", display: "block", marginBottom: 6 }}>{t("arena.messengerType")}</label>
                  <select value={pMessengerType} onChange={e => setPMessengerType(e.target.value)} style={inputStyle}>
                    <option value="line">LINE</option>
                    <option value="kakao">카카오톡</option>
                    <option value="other">기타</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#909090", display: "block", marginBottom: 6 }}>{t("arena.parentMessenger")}</label>
                  <input value={pMessenger} onChange={e => setPMessenger(e.target.value)} placeholder="@username" style={inputStyle} />
                </div>
              </div>
              <button onClick={handleAddPlayer} disabled={!pName.trim() || addingPlayer}
                style={{ padding: "10px 20px", background: pName.trim() ? "#2A9D8F" : "rgba(255,255,255,0.05)", color: pName.trim() ? "#fff" : "#404050", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                + {t("arena.addPlayer")}
              </button>

              {players.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, color: "#909090", marginBottom: 10 }}>등록된 선수 ({players.length}명)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {players.map((p, i) => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#1A1A26", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>
                        <span style={{ color: "#2A9D8F", fontWeight: 700 }}>{i + 1}</span>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        <span style={{ color: "#606070" }}>{p.dojang_name}</span>
                        <span style={{ color: "#606070" }}>{p.dan_level}단</span>
                        <span style={{ color: "#606070" }}>{p.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
