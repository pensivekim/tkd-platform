export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// MediaPipe Pose landmark indices
const LANDMARKS = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
};

// 두 랜드마크 간 각도 계산
function angle(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const cb = { x: b.x - c.x, y: b.y - c.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / (magAB * magCB)))) * (180 / Math.PI);
}

// 가시성 점수 (키포인트가 잘 보이는지)
export function visibilityScore(landmarks: Landmark[]): number {
  const keyIndices = Object.values(LANDMARKS);
  const visible = keyIndices.filter(i => landmarks[i] && (landmarks[i].visibility ?? 1) > 0.5);
  return Math.round((visible.length / keyIndices.length) * 100);
}

// 좌우 대칭도 점수
export function symmetryScore(landmarks: Landmark[]): number {
  const pairs: [number, number][] = [
    [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER],
    [LANDMARKS.LEFT_ELBOW, LANDMARKS.RIGHT_ELBOW],
    [LANDMARKS.LEFT_WRIST, LANDMARKS.RIGHT_WRIST],
    [LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
    [LANDMARKS.LEFT_KNEE, LANDMARKS.RIGHT_KNEE],
    [LANDMARKS.LEFT_ANKLE, LANDMARKS.RIGHT_ANKLE],
  ];

  let totalDiff = 0;
  let count = 0;
  const midX = 0.5;

  for (const [l, r] of pairs) {
    if (!landmarks[l] || !landmarks[r]) continue;
    const lDist = Math.abs(landmarks[l].x - midX);
    const rDist = Math.abs(landmarks[r].x - midX);
    totalDiff += Math.abs(lDist - rDist);
    count++;
  }

  if (count === 0) return 50;
  const avgDiff = totalDiff / count;
  return Math.max(0, Math.round(100 - avgDiff * 300));
}

// 자세 안정성 점수 (이전 프레임과의 움직임 비교)
let prevLandmarks: Landmark[] | null = null;
export function stabilityScore(landmarks: Landmark[]): number {
  if (!prevLandmarks) {
    prevLandmarks = landmarks;
    return 85;
  }

  const keyIndices = Object.values(LANDMARKS);
  let totalMove = 0;
  let count = 0;

  for (const i of keyIndices) {
    if (!landmarks[i] || !prevLandmarks[i]) continue;
    const dx = landmarks[i].x - prevLandmarks[i].x;
    const dy = landmarks[i].y - prevLandmarks[i].y;
    totalMove += Math.sqrt(dx ** 2 + dy ** 2);
    count++;
  }

  prevLandmarks = landmarks;
  if (count === 0) return 85;
  const avgMove = totalMove / count;
  return Math.max(0, Math.min(100, Math.round(100 - avgMove * 1000)));
}

export function resetStability() {
  prevLandmarks = null;
}

// 종합 AI 참고 점수
export function computePoseScore(landmarks: Landmark[]): {
  total: number;
  visibility: number;
  symmetry: number;
  stability: number;
} {
  const vis = visibilityScore(landmarks);
  const sym = symmetryScore(landmarks);
  const sta = stabilityScore(landmarks);
  const total = Math.round(vis * 0.3 + sym * 0.4 + sta * 0.3);
  return { total, visibility: vis, symmetry: sym, stability: sta };
}
