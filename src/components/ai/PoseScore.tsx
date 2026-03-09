"use client";

interface PoseScoreProps {
  total: number;
  // 3-item mode (backward compat)
  visibility?: number;
  symmetry?: number;
  stability?: number;
  // 5-item mode (poomsae)
  accuracy?: number;
  timing?: number;
  completeness?: number;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginTop: 4 }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 2, transition: "width 0.5s" }} />
    </div>
  );
}

export default function PoseScore({
  total, visibility, symmetry, stability, accuracy, timing, completeness
}: PoseScoreProps) {
  const totalColor = total >= 80 ? "#4ade80" : total >= 60 ? "#E9C46A" : "#E63946";
  const fiveItem = accuracy !== undefined || timing !== undefined || completeness !== undefined;

  const items5 = [
    { label: "정확도", value: accuracy ?? 0, color: "#E63946" },
    { label: "대칭도", value: symmetry ?? 0, color: "#E9C46A" },
    { label: "안정성", value: stability ?? 0, color: "#7EC8E3" },
    { label: "타이밍", value: timing ?? 0, color: "#4ade80" },
    { label: "완성도", value: completeness ?? 0, color: "#A78BFA" },
  ];

  const items3 = [
    { label: "가시성", value: visibility ?? 0, color: "#4ade80" },
    { label: "대칭도", value: symmetry ?? 0, color: "#E9C46A" },
    { label: "안정성", value: stability ?? 0, color: "#7EC8E3" },
  ];

  const items = fiveItem ? items5 : items3;

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
        {items.map(item => (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#909090" }}>
              <span>{item.label}</span>
              <span style={{ color: item.color }}>{item.value}</span>
            </div>
            <ScoreBar value={item.value} color={item.color} />
          </div>
        ))}
      </div>
    </div>
  );
}
