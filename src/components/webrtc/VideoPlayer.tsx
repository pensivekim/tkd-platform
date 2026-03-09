"use client";

import { useEffect, useRef } from "react";
import type { ConnectionState } from "@/lib/useWebRTC";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  label?: string;
  connectionState?: ConnectionState;
  style?: React.CSSProperties;
  mirrored?: boolean;
}

const stateColors: Record<string, string> = {
  connected: "#4ade80",
  connecting: "#facc15",
  failed: "#E63946",
  disconnected: "#E63946",
  idle: "#606070",
};

const stateLabels: Record<string, string> = {
  connected: "연결됨",
  connecting: "연결 중...",
  failed: "연결 실패",
  disconnected: "끊김",
  idle: "대기 중",
};

export default function VideoPlayer({ stream, muted = false, label, connectionState, style, mirrored }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const color = connectionState ? stateColors[connectionState] ?? "#606070" : undefined;
  const stateLabel = connectionState ? stateLabels[connectionState] ?? connectionState : undefined;

  return (
    <div style={{
      position: "relative", background: "#0A0A14",
      borderRadius: 12, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.1)",
      aspectRatio: "16/9",
      ...style,
    }}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay playsInline muted={muted}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: mirrored ? "scaleX(-1)" : "none" }}
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#404050" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎥</div>
            <div style={{ fontSize: 13 }}>영상 없음</div>
          </div>
        </div>
      )}

      {/* Label + status */}
      <div style={{
        position: "absolute", bottom: 8, left: 8, right: 8,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        {label && (
          <span style={{
            background: "rgba(0,0,0,0.65)", color: "#E0E0E8",
            padding: "3px 10px", borderRadius: 20, fontSize: 12, backdropFilter: "blur(4px)",
          }}>{label}</span>
        )}
        {connectionState && (
          <span style={{
            background: "rgba(0,0,0,0.65)", color: color,
            padding: "3px 10px", borderRadius: 20, fontSize: 11,
            display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(4px)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
            {stateLabel}
          </span>
        )}
      </div>
    </div>
  );
}
