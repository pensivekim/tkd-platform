"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { API_BASE } from "@/lib/api";

interface Event { id: string; title: string }
interface Player { id: string; name: string; dojang_name: string }
interface Photo { id: string; event_id: string; r2_key: string; player_id: string | null; player_name: string | null; captured_at: string }

export default function PhotosPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { t } = useI18n();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Photo | null>(null);
  const [tagPlayerId, setTagPlayerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const photoUrl = (r2Key: string) => `${API_BASE}/media/${r2Key}`;

  const loadPhotos = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/arena/${eventId}/photos`);
    if (res.ok) setPhotos(await res.json());
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetch(`${API_BASE}/api/arena/${eventId}`).then(r => r.json()).then(setEvent).catch(console.error);
    fetch(`${API_BASE}/api/arena/${eventId}/players`).then(r => r.json()).then(setPlayers).catch(console.error);
    loadPhotos();
  }, [eventId, loadPhotos]);

  const filteredPhotos = filter === "all" ? photos
    : filter === "untagged" ? photos.filter(p => !p.player_id)
    : photos.filter(p => p.player_id === filter);

  const handleTag = async () => {
    if (!selected || !tagPlayerId) return;
    setSaving(true);
    const player = players.find(p => p.id === tagPlayerId);
    try {
      await fetch(`${API_BASE}/api/arena/${eventId}/photos/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: tagPlayerId, player_name: player?.name ?? "" }),
      });
      await loadPhotos();
      setSelected(null);
      setTagPlayerId("");
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleDownload = (photo: Photo) => {
    const a = document.createElement("a");
    a.href = photoUrl(photo.r2_key);
    a.download = `${photo.player_name || "photo"}-${photo.id.slice(0, 8)}.jpg`;
    a.click();
  };

  const untaggedCount = photos.filter(p => !p.player_id).length;

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", color: "#F0F0F5" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/arena" style={{ color: "#E9C46A", textDecoration: "none", fontSize: 13 }}>← 목록</Link>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: "#E9C46A" }}>DOJANGWAN</span>
          <span style={{ color: "#404050" }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>📸 {t("arena.photos")}</span>
        </div>
        {event && (
          <div style={{ fontSize: 13, color: "#909090" }}>
            <span style={{ color: "#E9C46A", fontWeight: 700 }}>{event.title}</span>
            <span> · {t("arena.photoCount")} {photos.length}장</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {[
          { id: "all", label: `${t("arena.allPhotos")} (${photos.length})` },
          { id: "untagged", label: `${t("arena.untagged")} (${untaggedCount})` },
          ...players.map(p => ({ id: p.id, label: `${p.name} (${photos.filter(ph => ph.player_id === p.id).length})` })),
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            style={{
              padding: "6px 16px", borderRadius: 20, border: "1px solid",
              borderColor: filter === tab.id ? "#E9C46A" : "rgba(255,255,255,0.1)",
              background: filter === tab.id ? "rgba(233,196,106,0.15)" : "transparent",
              color: filter === tab.id ? "#E9C46A" : "#909090",
              fontSize: 12, cursor: "pointer",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#404050" }}>{t("common.loading")}</div>
        ) : filteredPhotos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#404050" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📸</div>
            <p>사진이 없습니다.</p>
            <p style={{ fontSize: 13, marginTop: 8, color: "#303040" }}>방송 화면에서 📸 버튼으로 캡처하세요.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {filteredPhotos.map(photo => (
              <div key={photo.id}
                onClick={() => { setSelected(photo); setTagPlayerId(photo.player_id ?? ""); }}
                style={{ cursor: "pointer", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#0E0E18", transition: "transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <div style={{ aspectRatio: "4/3", background: "#080810", overflow: "hidden" }}>
                  <img src={photoUrl(photo.r2_key)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "6px 10px", fontSize: 12 }}>
                  <div style={{ color: photo.player_name ? "#E9C46A" : "#404050", fontWeight: 600 }}>
                    {photo.player_name ?? t("arena.untagged")}
                  </div>
                  <div style={{ color: "#404050", fontSize: 11, marginTop: 2 }}>
                    {new Date(photo.captured_at).toLocaleTimeString("ko-KR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: "#0E0E18", borderRadius: 16, overflow: "hidden", maxWidth: 520, width: "100%", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <img src={photoUrl(selected.r2_key)} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: "#909090", marginBottom: 14 }}>
                {new Date(selected.captured_at).toLocaleString("ko-KR")}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "#909090", display: "block", marginBottom: 8 }}>{t("arena.tagPlayer")}</label>
                  <select value={tagPlayerId} onChange={e => setTagPlayerId(e.target.value)}
                    style={{ width: "100%", background: "#1A1A26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#F0F0F5", fontSize: 14, outline: "none", appearance: "none" as const }}>
                    <option value="">{t("arena.selectPlayer")}</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.dojang_name})</option>)}
                  </select>
                </div>
                <button onClick={handleTag} disabled={!tagPlayerId || saving}
                  style={{ padding: "10px 18px", background: tagPlayerId ? "#E9C46A" : "rgba(255,255,255,0.05)", color: tagPlayerId ? "#0A0A0F" : "#404050", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  {saving ? "..." : t("arena.save")}
                </button>
                <button onClick={() => handleDownload(selected)}
                  style={{ padding: "10px 18px", background: "rgba(42,157,143,0.15)", color: "#2A9D8F", border: "1px solid rgba(42,157,143,0.3)", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
                  ↓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
