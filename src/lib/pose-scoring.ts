import type { PoomsaeData, PoomsaeMove, JointKey } from "./poomsae-data";

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// MediaPipe Pose landmark indices
const LM = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
};

// ── Core angle calculation ────────────────────────────────────────
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const cb = { x: b.x - c.x, y: b.y - c.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (magAB === 0 || magCB === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / (magAB * magCB)))) * (180 / Math.PI);
}

// Internal alias for backward compat
function angle(a: Landmark, b: Landmark, c: Landmark): number {
  return calculateAngle(a, b, c);
}

// Pivot landmark index for each joint (exported for PoseOverlay color coding)
export const PIVOT_IDX: Record<JointKey, number> = {
  leftElbow:    LM.LEFT_ELBOW,
  rightElbow:   LM.RIGHT_ELBOW,
  leftKnee:     LM.LEFT_KNEE,
  rightKnee:    LM.RIGHT_KNEE,
  leftShoulder: LM.LEFT_SHOULDER,
  rightShoulder:LM.RIGHT_SHOULDER,
  leftHip:      LM.LEFT_HIP,
  rightHip:     LM.RIGHT_HIP,
};

// Get angle for a named joint key
export function getJointAngle(landmarks: Landmark[], joint: JointKey): number | null {
  try {
    switch (joint) {
      case "leftElbow":
        return angle(landmarks[LM.LEFT_SHOULDER], landmarks[LM.LEFT_ELBOW], landmarks[LM.LEFT_WRIST]);
      case "rightElbow":
        return angle(landmarks[LM.RIGHT_SHOULDER], landmarks[LM.RIGHT_ELBOW], landmarks[LM.RIGHT_WRIST]);
      case "leftKnee":
        return angle(landmarks[LM.LEFT_HIP], landmarks[LM.LEFT_KNEE], landmarks[LM.LEFT_ANKLE]);
      case "rightKnee":
        return angle(landmarks[LM.RIGHT_HIP], landmarks[LM.RIGHT_KNEE], landmarks[LM.RIGHT_ANKLE]);
      case "leftShoulder":
        return angle(landmarks[LM.LEFT_HIP], landmarks[LM.LEFT_SHOULDER], landmarks[LM.LEFT_ELBOW]);
      case "rightShoulder":
        return angle(landmarks[LM.RIGHT_HIP], landmarks[LM.RIGHT_SHOULDER], landmarks[LM.RIGHT_ELBOW]);
      case "leftHip":
        return angle(landmarks[LM.LEFT_SHOULDER], landmarks[LM.LEFT_HIP], landmarks[LM.LEFT_KNEE]);
      case "rightHip":
        return angle(landmarks[LM.RIGHT_SHOULDER], landmarks[LM.RIGHT_HIP], landmarks[LM.RIGHT_KNEE]);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ── 3-item scores (backward compat) ──────────────────────────────
export function visibilityScore(landmarks: Landmark[]): number {
  const keyIndices = Object.values(LM);
  const visible = keyIndices.filter(i => landmarks[i] && (landmarks[i].visibility ?? 1) > 0.5);
  return Math.round((visible.length / keyIndices.length) * 100);
}

export function symmetryScore(landmarks: Landmark[]): number {
  const pairs: [number, number][] = [
    [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
    [LM.LEFT_ELBOW, LM.RIGHT_ELBOW],
    [LM.LEFT_WRIST, LM.RIGHT_WRIST],
    [LM.LEFT_HIP, LM.RIGHT_HIP],
    [LM.LEFT_KNEE, LM.RIGHT_KNEE],
    [LM.LEFT_ANKLE, LM.RIGHT_ANKLE],
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

let prevLandmarks: Landmark[] | null = null;
export function stabilityScore(landmarks: Landmark[]): number {
  if (!prevLandmarks) {
    prevLandmarks = landmarks;
    return 85;
  }

  const keyIndices = Object.values(LM);
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

// Original 3-item function (backward compat — used by exam/training pages)
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

// ── 5-item score (new) ────────────────────────────────────────────
export interface PoomsaeScore {
  total: number;
  accuracy: number;    // pose angle quality
  symmetry: number;    // left-right balance
  stability: number;   // movement steadiness
  timing: number;      // rhythm consistency
  completeness: number; // visible keypoints / sequence completion
}

// General accuracy: checks if key body angles are within "good form" ranges
function accuracyScore(landmarks: Landmark[]): number {
  const checks: Array<{ val: number | null; ideal: number; tol: number }> = [
    // Arm extension check (should not be hyper-extended or fully collapsed)
    { val: getJointAngle(landmarks, "leftElbow"),    ideal: 140, tol: 40 },
    { val: getJointAngle(landmarks, "rightElbow"),   ideal: 140, tol: 40 },
    // Knee check (some bend in stance)
    { val: getJointAngle(landmarks, "leftKnee"),     ideal: 130, tol: 40 },
    { val: getJointAngle(landmarks, "rightKnee"),    ideal: 130, tol: 40 },
    // Shoulder elevation check (arm should not be fully dropped or over-raised)
    { val: getJointAngle(landmarks, "leftShoulder"), ideal: 80,  tol: 40 },
    { val: getJointAngle(landmarks, "rightShoulder"),ideal: 80,  tol: 40 },
    // Hip/stance check (not fully collapsed or hyper-extended)
    { val: getJointAngle(landmarks, "leftHip"),      ideal: 140, tol: 40 },
    { val: getJointAngle(landmarks, "rightHip"),     ideal: 140, tol: 40 },
  ];

  let total = 0;
  let count = 0;
  for (const c of checks) {
    if (c.val === null) continue;
    const diff = Math.abs(c.val - c.ideal);
    total += Math.max(0, 100 - (diff / c.tol) * 100);
    count++;
  }
  return count === 0 ? 75 : Math.round(total / count);
}

// Timing history for compute5
const timingHistory: number[] = [];

export function computePoomsaeScore(landmarks: Landmark[]): PoomsaeScore {
  const acc = accuracyScore(landmarks);
  const sym = symmetryScore(landmarks);
  const sta = stabilityScore(landmarks);
  const comp = visibilityScore(landmarks);

  // Timing = smoothness of movement (higher stability over time = better rhythm)
  timingHistory.push(sta);
  if (timingHistory.length > 30) timingHistory.shift();
  const timingVariance = timingHistory.length > 1
    ? Math.sqrt(timingHistory.reduce((s, v) => s + (v - 80) ** 2, 0) / timingHistory.length)
    : 20;
  const tim = Math.max(0, Math.min(100, Math.round(100 - timingVariance * 0.8)));

  const total = Math.round(acc * 0.30 + sym * 0.25 + sta * 0.20 + tim * 0.15 + comp * 0.10);
  return { total, accuracy: acc, symmetry: sym, stability: sta, timing: tim, completeness: comp };
}

export function resetPoomsaeScore() {
  timingHistory.length = 0;
  prevLandmarks = null;
}

// ── PoomsaeScoringEngine — tracks move sequence ───────────────────
export interface PoomsaeScoringResult {
  accuracy: number;
  symmetry: number;
  stability: number;
  timing: number;
  completeness: number;
  total: number;
  currentMoveIndex: number;
  currentMoveName: string;
  advanced: boolean;
  done: boolean;
}

function computeMoveAccuracy(landmarks: Landmark[], move: PoomsaeMove): number {
  if (!move.angles.length) return 80;
  let totalScore = 0;
  let count = 0;
  for (const constraint of move.angles) {
    const val = getJointAngle(landmarks, constraint.joint);
    if (val === null) continue;
    // z-coordinate side-movement tolerance: if the pivot is turned away from camera
    // (|z| > 0.15), relax tolerance by 1.3× to avoid false negatives
    const pivotIdx = PIVOT_IDX[constraint.joint];
    const zFactor = (landmarks[pivotIdx] && Math.abs(landmarks[pivotIdx].z) > 0.15) ? 1.3 : 1.0;
    const effectiveTol = constraint.tolerance * zFactor;
    const diff = Math.abs(val - constraint.target);
    totalScore += Math.max(0, 100 - (diff / effectiveTol) * 100);
    count++;
  }
  return count === 0 ? 70 : totalScore / count;
}

function avg(arr: number[]): number {
  if (!arr.length) return 75;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export class PoomsaeScoringEngine {
  private poomsae: PoomsaeData;
  private moveIndex = 0;
  private moveHoldStart: number | null = null;
  private accHistory: number[] = [];
  private symHistory: number[] = [];
  private staHistory: number[] = [];
  private moveTimings: Array<{ actual: number; expected: number }> = [];
  private prevLandmarksLocal: Landmark[] | null = null;

  constructor(poomsae: PoomsaeData) {
    this.poomsae = poomsae;
  }

  reset() {
    this.moveIndex = 0;
    this.moveHoldStart = null;
    this.accHistory = [];
    this.symHistory = [];
    this.staHistory = [];
    this.moveTimings = [];
    this.prevLandmarksLocal = null;
  }

  process(landmarks: Landmark[], timestamp: number): PoomsaeScoringResult {
    const done = this.moveIndex >= this.poomsae.moves.length;

    const sym = symmetryScore(landmarks);
    const sta = this.localStability(landmarks);
    this.symHistory.push(sym);
    this.staHistory.push(sta);

    let accuracy = 75;
    let advanced = false;

    if (!done) {
      const move = this.poomsae.moves[this.moveIndex];
      const moveAcc = computeMoveAccuracy(landmarks, move);
      this.accHistory.push(moveAcc);
      accuracy = moveAcc;

      if (moveAcc >= 60) {
        if (!this.moveHoldStart) {
          this.moveHoldStart = timestamp;
        } else if (timestamp - this.moveHoldStart >= move.durationMs) {
          this.moveTimings.push({ actual: timestamp - this.moveHoldStart, expected: move.durationMs });
          this.moveIndex++;
          this.moveHoldStart = null;
          advanced = true;
        }
      } else {
        this.moveHoldStart = null;
      }
    }

    const completeness = Math.round((this.moveIndex / this.poomsae.moves.length) * 100);
    const avgAcc = Math.round(avg(this.accHistory));
    const avgSym = Math.round(avg(this.symHistory));
    const avgSta = Math.round(avg(this.staHistory));
    const timing = this.computeTimingScore();
    const total = Math.round(avgAcc * 0.35 + avgSym * 0.25 + avgSta * 0.20 + timing * 0.10 + completeness * 0.10);

    const currentMoveIndex = Math.min(this.moveIndex, this.poomsae.moves.length - 1);
    const currentMoveName = this.poomsae.moves[currentMoveIndex]?.nameKo ?? "";

    return {
      accuracy: done ? avgAcc : Math.round(accuracy),
      symmetry: avgSym,
      stability: avgSta,
      timing,
      completeness,
      total,
      currentMoveIndex: this.moveIndex,
      currentMoveName,
      advanced,
      done: this.moveIndex >= this.poomsae.moves.length,
    };
  }

  private localStability(landmarks: Landmark[]): number {
    if (!this.prevLandmarksLocal) {
      this.prevLandmarksLocal = landmarks;
      return 85;
    }
    const keyIndices = Object.values(LM);
    let totalMove = 0;
    let count = 0;
    for (const i of keyIndices) {
      if (!landmarks[i] || !this.prevLandmarksLocal[i]) continue;
      const dx = landmarks[i].x - this.prevLandmarksLocal[i].x;
      const dy = landmarks[i].y - this.prevLandmarksLocal[i].y;
      totalMove += Math.sqrt(dx ** 2 + dy ** 2);
      count++;
    }
    this.prevLandmarksLocal = landmarks;
    if (count === 0) return 85;
    return Math.max(0, Math.min(100, Math.round(100 - (totalMove / count) * 1000)));
  }

  private computeTimingScore(): number {
    if (!this.moveTimings.length) return 80;
    let total = 0;
    for (const { actual, expected } of this.moveTimings) {
      const diff = Math.abs(actual - expected);
      total += Math.max(0, 100 - (diff / expected) * 100);
    }
    return Math.round(total / this.moveTimings.length);
  }
}
