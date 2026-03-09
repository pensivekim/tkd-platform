"use client";

interface PoseScoreProps {
  total: number;
  visibility: number;
  symmetry: number;
  stability: number;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginTop: 4 }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 2, transition: "width 0.5s" }} />
    </div>
  );
}

export default function PoseScore({ total, visibility, symmetry, stability }: PoseScoreProps) {
  const totalColor = total >= 80 ? "#4ade80" : total >= 60 ? "#E9C46A" : "#E63946";

  return (
    <div style={{
      background: "#0E0E18", border: "1px solid rgba(230,57,70,0.3)",
      borderRadius: 12, padding: "16px 20px",
    }}>
      <div style={{ fontSize: 12, color: "#E63946", letterSpacing: 1, marginBottom: 10 }}>AI 참고 점수</div>

      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 48, fontWeight: 700, color: totalColor, lineHeight: 1 }}>
          {total}
        </span>
        <span style={{ color: "#606070", fontSize: 14, marginLeft: 4 }}>/100</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#909090" }}>
            <span>가시성</span><span style={{ color: "#A0F0C0" }}>{visibility}</span>
          </div>
          <ScoreBar value={visibility} color="#4ade80" />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#909090" }}>
            <span>대칭도</span><span style={{ color: "#E9C46A" }}>{symmetry}</span>
          </div>
          <ScoreBar value={symmetry} color="#E9C46A" />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#909090" }}>
            <span>안정성</span><span style={{ color: "#7EC8E3" }}>{stability}</span>
          </div>
          <ScoreBar value={stability} color="#7EC8E3" />
        </div>
      </div>
    </div>
  );
}
