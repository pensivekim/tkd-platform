"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Landmark } from "@/lib/pose-scoring";

interface PoseOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: Landmark[] | null;
  enabled?: boolean;
}

// MediaPipe Pose connections
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32],
];

export default function PoseOverlay({ videoRef, landmarks, enabled = true }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !landmarks || !enabled) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    ctx.strokeStyle = "rgba(230,57,70,0.8)";
    ctx.lineWidth = 2;
    for (const [a, b] of POSE_CONNECTIONS) {
      if (!landmarks[a] || !landmarks[b]) continue;
      if ((landmarks[a].visibility ?? 1) < 0.3 || (landmarks[b].visibility ?? 1) < 0.3) continue;
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * canvas.width, landmarks[a].y * canvas.height);
      ctx.lineTo(landmarks[b].x * canvas.width, landmarks[b].y * canvas.height);
      ctx.stroke();
    }

    // Draw keypoints
    for (const lm of landmarks) {
      if (!lm || (lm.visibility ?? 1) < 0.3) continue;
      ctx.beginPath();
      ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(233,196,106,0.9)";
      ctx.fill();
    }
  }, [landmarks, enabled, videoRef]);

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
