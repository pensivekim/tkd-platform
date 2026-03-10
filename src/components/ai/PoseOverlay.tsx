"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Landmark } from "@/lib/pose-scoring";
import { getJointAngle, PIVOT_IDX } from "@/lib/pose-scoring";
import type { PoomsaeMove } from "@/lib/poomsae-data";

interface PoseOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: Landmark[] | null;
  enabled?: boolean;
  currentMove?: PoomsaeMove;
}

// MediaPipe Pose connections
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32],
];

const COLOR_DEFAULT = "rgba(230,57,70,0.8)";
const COLOR_GREEN   = "rgba(74,222,128,0.9)";
const COLOR_YELLOW  = "rgba(233,196,106,0.9)";
const COLOR_RED     = "rgba(230,57,70,0.9)";

function buildPivotColorMap(
  landmarks: Landmark[],
  move: PoomsaeMove,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const constraint of move.angles) {
    const val = getJointAngle(landmarks, constraint.joint);
    const pivotIdx = PIVOT_IDX[constraint.joint];
    if (val === null) continue;
    const diff = Math.abs(val - constraint.target);
    map.set(pivotIdx, diff <= 15 ? COLOR_GREEN : diff <= 30 ? COLOR_YELLOW : COLOR_RED);
  }
  return map;
}

export default function PoseOverlay({
  videoRef,
  landmarks,
  enabled = true,
  currentMove,
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video || !landmarks || !enabled) return;

    canvas.width  = video.clientWidth;
    canvas.height = video.clientHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pivotColors = currentMove ? buildPivotColorMap(landmarks, currentMove) : new Map<number, string>();

    // Connection color: if either endpoint is a colored pivot, use that color
    const getConnColor = (a: number, b: number): string => {
      return pivotColors.get(a) ?? pivotColors.get(b) ?? COLOR_DEFAULT;
    };

    // Draw connections
    ctx.lineWidth = 2;
    for (const [a, b] of POSE_CONNECTIONS) {
      if (!landmarks[a] || !landmarks[b]) continue;
      if ((landmarks[a].visibility ?? 1) < 0.3 || (landmarks[b].visibility ?? 1) < 0.3) continue;
      ctx.strokeStyle = getConnColor(a, b);
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * canvas.width, landmarks[a].y * canvas.height);
      ctx.lineTo(landmarks[b].x * canvas.width, landmarks[b].y * canvas.height);
      ctx.stroke();
    }

    // Draw keypoints
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm || (lm.visibility ?? 1) < 0.3) continue;
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, Math.PI * 2);
      ctx.fillStyle = pivotColors.get(i) ?? "rgba(233,196,106,0.9)";
      ctx.fill();
    }
  }, [landmarks, enabled, videoRef, currentMove]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
