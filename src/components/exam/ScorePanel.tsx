"use client";

import { useState } from "react";
import PoseScore from "@/components/ai/PoseScore";
import { API_BASE } from "@/lib/api";

interface AiScore {
  total: number;
  visibility?: number;
  symmetry?: number;
  stability?: number;
  accuracy?: number;
  timing?: number;
  completeness?: number;
}

interface ScorePanelProps {
  sessionId: string;
  aiScore: AiScore;
  onSubmit?: (score: number, result: "pass" | "fail") => void;
}

export default function ScorePanel({ sessionId, aiScore, onSubmit }: ScorePanelProps) {
  const [score, setScore] = useState<string>("");
  const [result, setResult] = useState<"pass" | "fail" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!result || !score) return;
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/exam`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sessionId,
          examiner_score: Number(score),
          ai_score: aiScore.total,
          final_result: result,
          status: "completed",
        }),
      });
      setSubmitted(true);
      onSubmit?.(Number(score), result);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <PoseScore {...aiScore} />

      <div style={{
        background: "#0E0E18", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "16px 20px",
      }}>
        <div style={{ fontSize: 12, color: "#808090", letterSpacing: 1, marginBottom: 12 }}>심사위원 평가</div>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{result === "pass" ? "✅" : "❌"}</div>
            <div style={{ color: result === "pass" ? "#4ade80" : "#E63946", fontWeight: 700, fontSize: 16 }}>
              {result === "pass" ? "합격" : "불합격"}
            </div>
            <div style={{ color: "#606070", fontSize: 13, marginTop: 4 }}>점수: {score}점</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#909090", display: "block", marginBottom: 6 }}>심사위원 점수 (0-100)</label>
              <input
                type="number" min={0} max={100}
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="0 ~ 100"
                style={{
                  width: "100%", background: "#1A1A26", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8, padding: "10px 14px", color: "#F0F0F5", fontSize: 16,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setResult("pass")}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: result === "pass" ? "#4ade80" : "rgba(74,222,128,0.15)",
                  color: result === "pass" ? "#000" : "#4ade80",
                  fontWeight: 700, fontSize: 14,
                }}>
                합격
              </button>
              <button
                onClick={() => setResult("fail")}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: result === "fail" ? "#E63946" : "rgba(230,57,70,0.15)",
                  color: result === "fail" ? "#fff" : "#E63946",
                  fontWeight: 700, fontSize: 14,
                }}>
                불합격
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!result || !score || submitting}
              style={{
                width: "100%", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: result && score ? "#E63946" : "rgba(255,255,255,0.05)",
                color: result && score ? "#fff" : "#404050",
                fontWeight: 700, fontSize: 15, transition: "background 0.2s",
              }}>
              {submitting ? "제출 중..." : "평가 제출"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
