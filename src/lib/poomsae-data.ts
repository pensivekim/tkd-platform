// Poomsae database — Taegeuk 1~8 with joint angle definitions
// Angles computed using MediaPipe Pose landmarks (2D, degrees)

export type JointKey =
  | "leftElbow"  | "rightElbow"
  | "leftKnee"   | "rightKnee"
  | "leftShoulder" | "rightShoulder"
  | "leftHip"    | "rightHip";

export interface AngleConstraint {
  joint: JointKey;
  target: number;   // ideal angle in degrees
  tolerance: number; // ± degrees for full score; double for partial
}

export interface PoomsaeMove {
  nameKo: string;
  nameEn: string;
  durationMs: number; // minimum hold time to register the move (ms)
  angles: AngleConstraint[];
}

export interface PoomsaeData {
  id: string;
  nameKo: string;
  nameEn: string;
  level: string;
  color: string;
  descKo: string;
  descEn: string;
  moves: PoomsaeMove[];
}

// ── Angle reference ──────────────────────────────────────────────
// leftElbow:    angle(lm[11], lm[13], lm[15]) — shoulder-elbow-wrist
// rightElbow:   angle(lm[12], lm[14], lm[16])
// leftKnee:     angle(lm[23], lm[25], lm[27]) — hip-knee-ankle
// rightKnee:    angle(lm[24], lm[26], lm[28])
// leftShoulder: angle(lm[23], lm[11], lm[13]) — hip-shoulder-elbow
// rightShoulder:angle(lm[24], lm[12], lm[14])
// leftHip:      angle(lm[11], lm[23], lm[25]) — shoulder-hip-knee
// rightHip:     angle(lm[12], lm[24], lm[26])
//
// Technique targets (approximate 2D):
//   아래막기 (low block arm):       ~155° (near extended, angled down)
//   몸통지르기 (mid punch):         ~168° (near straight)
//   얼굴막기 (high block):          ~100° (arm raised, bent)
//   몸통막기 (middle block):        ~90°
//   손날 (knife-hand):              ~120°
//   앞차기 knee (front kick):       ~70° (acute — knee raised)
//   옆차기 knee (side kick):        ~160° (near extended outward)
//   돌려차기 knee (roundhouse):     ~65°
//   앞굽이 front knee (fwd stance): ~115°
//   뒷굽이 front knee (back stance):~135°

function move(
  nameKo: string,
  nameEn: string,
  durationMs: number,
  angles: AngleConstraint[]
): PoomsaeMove {
  return { nameKo, nameEn, durationMs, angles };
}

function a(joint: JointKey, target: number, tolerance: number): AngleConstraint {
  return { joint, target, tolerance };
}

// ── 태극 1장 ─────────────────────────────────────────────────────
const taegeuk1: PoomsaeData = {
  id: "taegeuk1",
  nameKo: "태극 1장",
  nameEn: "Taegeuk 1 Jang",
  level: "1~2단",
  color: "#E63946",
  descKo: "아래막기와 몸통지르기를 중심으로 한 기본 품새",
  descEn: "Fundamental poomsae focusing on low block and middle punch",
  moves: [
    move("왼 아래막기", "Left Low Block", 1500, [a("leftElbow", 155, 20), a("rightKnee", 115, 20), a("leftShoulder", 50, 20)]),
    move("오른 몸통지르기", "Right Middle Punch", 1200, [a("rightElbow", 168, 15), a("rightShoulder", 90, 20)]),
    move("오른 아래막기", "Right Low Block", 1500, [a("rightElbow", 155, 20), a("leftKnee", 115, 20), a("rightShoulder", 50, 20)]),
    move("왼 몸통지르기", "Left Middle Punch", 1200, [a("leftElbow", 168, 15), a("leftShoulder", 90, 20)]),
    move("왼 아래막기 (전환)", "Left Low Block (Turn)", 1500, [a("leftElbow", 155, 20), a("leftShoulder", 50, 20)]),
    move("오른·왼 연속 지르기", "Double Punch R+L", 1500, [a("rightElbow", 168, 15), a("leftElbow", 168, 15), a("rightShoulder", 90, 20)]),
    move("오른 아래막기 (전환)", "Right Low Block (Turn)", 1500, [a("rightElbow", 155, 20), a("rightShoulder", 50, 20)]),
    move("왼·오른 연속 지르기", "Double Punch L+R", 1500, [a("leftElbow", 168, 15), a("rightElbow", 168, 15), a("leftShoulder", 90, 20)]),
  ],
};

// ── 태극 2장 ─────────────────────────────────────────────────────
const taegeuk2: PoomsaeData = {
  id: "taegeuk2",
  nameKo: "태극 2장",
  nameEn: "Taegeuk 2 Jang",
  level: "1~2단",
  color: "#E9C46A",
  descKo: "얼굴막기가 추가된 품새",
  descEn: "Poomsae introducing the high face block",
  moves: [
    move("왼 아래막기", "Left Low Block", 1500, [a("leftElbow", 155, 20), a("leftShoulder", 50, 20)]),
    move("오른 몸통지르기", "Right Middle Punch", 1200, [a("rightElbow", 168, 15), a("rightShoulder", 90, 20)]),
    move("오른 얼굴막기", "Right High Block", 1500, [a("rightElbow", 100, 20), a("rightShoulder", 55, 20)]),
    move("왼 몸통지르기", "Left Middle Punch", 1200, [a("leftElbow", 168, 15), a("leftShoulder", 90, 20)]),
    move("왼 아래막기", "Left Low Block", 1500, [a("leftElbow", 155, 20), a("leftShoulder", 50, 20)]),
    move("오른 얼굴막기", "Right High Block", 1500, [a("rightElbow", 100, 20), a("rightShoulder", 55, 20)]),
    move("오른 아래막기", "Right Low Block", 1500, [a("rightElbow", 155, 20), a("rightShoulder", 50, 20)]),
    move("왼 얼굴막기", "Left High Block", 1500, [a("leftElbow", 100, 20), a("leftShoulder", 55, 20)]),
  ],
};

// ── 태극 3장 ─────────────────────────────────────────────────────
const taegeuk3: PoomsaeData = {
  id: "taegeuk3",
  nameKo: "태극 3장",
  nameEn: "Taegeuk 3 Jang",
  level: "2~3단",
  color: "#2A9D8F",
  descKo: "몸통막기와 손날목치기가 포함된 품새",
  descEn: "Poomsae with middle block and knife-hand strike",
  moves: [
    move("왼 아래막기", "Left Low Block", 1500, [a("leftElbow", 155, 20), a("leftShoulder", 50, 20)]),
    move("오른 몸통막기", "Right Middle Block", 1500, [a("rightElbow", 90, 20), a("rightShoulder", 85, 20)]),
    move("왼 손날목치기", "Left Knife-Hand Strike", 1500, [a("leftElbow", 120, 20), a("leftShoulder", 75, 20)]),
    move("오른 몸통지르기", "Right Middle Punch", 1200, [a("rightElbow", 168, 15), a("rightShoulder", 90, 20)]),
    move("오른 아래막기", "Right Low Block", 1500, [a("rightElbow", 155, 20), a("rightShoulder", 50, 20)]),
    move("왼 몸통막기", "Left Middle Block", 1500, [a("leftElbow", 90, 20), a("leftShoulder", 85, 20)]),
    move("오른 손날목치기", "Right Knife-Hand Strike", 1500, [a("rightElbow", 120, 20), a("rightShoulder", 75, 20)]),
    move("왼 몸통지르기", "Left Middle Punch", 1200, [a("leftElbow", 168, 15), a("leftShoulder", 90, 20)]),
  ],
};

// ── 태극 4장 ─────────────────────────────────────────────────────
const taegeuk4: PoomsaeData = {
  id: "taegeuk4",
  nameKo: "태극 4장",
  nameEn: "Taegeuk 4 Jang",
  level: "2~3단",
  color: "#3B82F6",
  descKo: "앞차기와 옆차기가 추가된 품새",
  descEn: "Poomsae adding front kick and side kick",
  moves: [
    move("왼 아래막기", "Left Low Block", 1500, [a("leftElbow", 155, 20), a("leftShoulder", 50, 20)]),
    move("오른 앞차기", "Right Front Kick", 1500, [a("rightKnee", 70, 20), a("rightHip", 65, 20)]),
    move("오른 아래막기", "Right Low Block", 1500, [a("rightElbow", 155, 20), a("rightShoulder", 50, 20)]),
    move("왼 앞차기", "Left Front Kick", 1500, [a("leftKnee", 70, 20), a("leftHip", 65, 20)]),
    move("왼 몸통막기", "Left Middle Block", 1500, [a("leftElbow", 90, 20), a("leftShoulder", 85, 20)]),
    move("오른 옆차기", "Right Side Kick", 1500, [a("rightKnee", 160, 20), a("rightHip", 90, 20)]),
    move("오른 몸통막기", "Right Middle Block", 1500, [a("rightElbow", 90, 20), a("rightShoulder", 85, 20)]),
    move("왼 옆차기", "Left Side Kick", 1500, [a("leftKnee", 160, 20), a("leftHip", 90, 20)]),
  ],
};

// ── 태극 5장 ─────────────────────────────────────────────────────
const taegeuk5: PoomsaeData = {
  id: "taegeuk5",
  nameKo: "태극 5장",
  nameEn: "Taegeuk 5 Jang",
  level: "3~4단",
  color: "#9B59B6",
  descKo: "등주먹치기와 망치주먹이 추가된 품새",
  descEn: "Poomsae adding back fist and hammer fist strikes",
  moves: [
    move("왼 아래막기", "Left Low Block", 1500, [a("leftElbow", 155, 20)]),
    move("오른 앞차기", "Right Front Kick", 1500, [a("rightKnee", 70, 20)]),
    move("등주먹 옆치기", "Back Fist Side Strike", 1500, [a("rightElbow", 150, 20)]),
    move("왼 아래막기 + 오른 망치주먹", "Low Block + Hammer Fist", 1500, [a("leftElbow", 155, 20), a("rightElbow", 150, 20)]),
    move("오른 아래막기", "Right Low Block", 1500, [a("rightElbow", 155, 20)]),
    move("왼 앞차기", "Left Front Kick", 1500, [a("leftKnee", 70, 20)]),
    move("역손날 안치기", "Reverse Knife-Hand", 1500, [a("leftElbow", 120, 20)]),
    move("오른 아래막기 + 왼 망치주먹", "Low Block + Hammer Fist L", 1500, [a("rightElbow", 155, 20), a("leftElbow", 150, 20)]),
  ],
};

// ── 태극 6장 ─────────────────────────────────────────────────────
const taegeuk6: PoomsaeData = {
  id: "taegeuk6",
  nameKo: "태극 6장",
  nameEn: "Taegeuk 6 Jang",
  level: "3~4단",
  color: "#E67E22",
  descKo: "뒷굽이와 손날막기가 추가된 품새",
  descEn: "Poomsae adding back stance and knife-hand block",
  moves: [
    move("뒷굽이 왼 손날막기", "Back Stance Left Knife-Hand Block", 1500, [a("leftElbow", 120, 20), a("leftKnee", 135, 20)]),
    move("오른 몸통지르기", "Right Middle Punch", 1200, [a("rightElbow", 168, 15)]),
    move("뒷굽이 오른 손날막기", "Back Stance Right Knife-Hand Block", 1500, [a("rightElbow", 120, 20), a("rightKnee", 135, 20)]),
    move("왼 몸통지르기", "Left Middle Punch", 1200, [a("leftElbow", 168, 15)]),
    move("왼 얼굴막기", "Left High Block", 1500, [a("leftElbow", 100, 20)]),
    move("오른 몸통지르기", "Right Middle Punch", 1200, [a("rightElbow", 168, 15)]),
    move("오른 얼굴막기", "Right High Block", 1500, [a("rightElbow", 100, 20)]),
    move("왼 몸통지르기", "Left Middle Punch", 1200, [a("leftElbow", 168, 15)]),
  ],
};

// ── 태극 7장 ─────────────────────────────────────────────────────
const taegeuk7: PoomsaeData = {
  id: "taegeuk7",
  nameKo: "태극 7장",
  nameEn: "Taegeuk 7 Jang",
  level: "4~5단",
  color: "#1ABC9C",
  descKo: "팔꿈치 기술과 돌려차기가 포함된 품새",
  descEn: "Poomsae with elbow techniques and roundhouse kick",
  moves: [
    move("왼 학다리서기 + 팔굽올려치기", "Crane Stance + Upward Elbow L", 1500, [a("leftKnee", 70, 20), a("rightElbow", 90, 20)]),
    move("오른 몸통막기", "Right Middle Block", 1500, [a("rightElbow", 90, 20)]),
    move("오른 학다리서기 + 팔굽올려치기", "Crane Stance + Upward Elbow R", 1500, [a("rightKnee", 70, 20), a("leftElbow", 90, 20)]),
    move("왼 몸통막기", "Left Middle Block", 1500, [a("leftElbow", 90, 20)]),
    move("왼 아래막기", "Left Low Block", 1500, [a("leftElbow", 155, 20)]),
    move("오른 돌려차기", "Right Roundhouse Kick", 1500, [a("rightKnee", 65, 20)]),
    move("오른 아래막기", "Right Low Block", 1500, [a("rightElbow", 155, 20)]),
    move("왼 돌려차기", "Left Roundhouse Kick", 1500, [a("leftKnee", 65, 20)]),
  ],
};

// ── 태극 8장 ─────────────────────────────────────────────────────
const taegeuk8: PoomsaeData = {
  id: "taegeuk8",
  nameKo: "태극 8장",
  nameEn: "Taegeuk 8 Jang",
  level: "4~5단",
  color: "#F39C12",
  descKo: "고급 연결 기술의 품새 — 최고 난이도",
  descEn: "Advanced combination poomsae — highest difficulty",
  moves: [
    move("뒷굽이 왼 손날막기", "Back Stance Left Knife-Hand Block", 1500, [a("leftElbow", 120, 20), a("leftKnee", 135, 20)]),
    move("바탕손올려막기", "Palm Heel Rising Block", 1500, [a("rightElbow", 100, 20)]),
    move("잡아당기기 + 앞차기", "Grab + Front Kick", 1500, [a("leftKnee", 70, 20)]),
    move("팔굽내려치기", "Downward Elbow Strike", 1500, [a("rightElbow", 60, 20)]),
    move("뒷굽이 오른 손날막기", "Back Stance Right Knife-Hand Block", 1500, [a("rightElbow", 120, 20), a("rightKnee", 135, 20)]),
    move("왼 옆차기", "Left Side Kick", 1500, [a("leftKnee", 160, 20)]),
    move("왼 몸통막기", "Left Middle Block", 1500, [a("leftElbow", 90, 20)]),
    move("반달차기", "Crescent Kick", 1500, [a("leftKnee", 90, 25)]),
  ],
};

export const POOMSAE_LIST: PoomsaeData[] = [
  taegeuk1, taegeuk2, taegeuk3, taegeuk4,
  taegeuk5, taegeuk6, taegeuk7, taegeuk8,
];

export function getPoomsae(id: string): PoomsaeData | undefined {
  return POOMSAE_LIST.find(p => p.id === id);
}
