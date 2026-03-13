// Poomsae database — Taegeuk 1~8 (Kukkiwon standard)
//
// ⚠️  EXPERT REVIEW REQUIRED
// All joint angle targets are approximated from 2D MediaPipe projection.
// A certified Kukkiwon referee/instructor should verify every target/tolerance value.
//
// Angle reference (MediaPipe Pose, 2D degrees):
//   leftElbow:     angle(lm[11], lm[13], lm[15])  shoulder-elbow-wrist
//   rightElbow:    angle(lm[12], lm[14], lm[16])
//   leftKnee:      angle(lm[23], lm[25], lm[27])  hip-knee-ankle
//   rightKnee:     angle(lm[24], lm[26], lm[28])
//   leftShoulder:  angle(lm[23], lm[11], lm[13])  hip-shoulder-elbow
//   rightShoulder: angle(lm[24], lm[12], lm[14])
//   leftHip:       angle(lm[11], lm[23], lm[25])  shoulder-hip-knee
//   rightHip:      angle(lm[12], lm[24], lm[26])
//
// Technique angle estimates (pending expert review):
//   아래막기 elbow:    ~155° (near-extended, angled down)
//   아래막기 shoulder: ~50°  (arm lowered)
//   몸통지르기 elbow:  ~168° (near-straight punch forward)
//   몸통지르기 shldr:  ~90°  (arm level at chest)
//   얼굴막기 elbow:    ~100° (raised, bent)
//   얼굴막기 shoulder: ~55°  (arm elevated)
//   몸통막기 elbow:    ~90°  (90° block across body)
//   몸통막기 shoulder: ~85°
//   손날막기/치기 elbow: ~120°
//   손날 shoulder:    ~75°
//   앞굽이 front knee: ~115° (bent stance)
//   뒷굽이 front knee: ~135° (back stance — less bent)
//   학다리서기 knee:   ~70°  (raised knee)
//   앞차기 knee:       ~70°  (kicking knee raised, acute)
//   앞차기 hip:        ~65°
//   옆차기 knee:       ~160° (near-extended outward)
//   옆차기 hip:        ~90°
//   돌려차기 knee:     ~65°  (chamber)
//   반달차기 knee:     ~90°

export type JointKey =
  | "leftElbow"   | "rightElbow"
  | "leftKnee"    | "rightKnee"
  | "leftShoulder"| "rightShoulder"
  | "leftHip"     | "rightHip";

export interface AngleConstraint {
  joint:     JointKey;
  target:    number;   // ideal angle in degrees (NEEDS EXPERT REVIEW)
  tolerance: number;   // ± degrees for full score
}

export interface PoomsaeMove {
  nameKo:     string;
  nameEn:     string;
  durationMs: number;
  angles:     AngleConstraint[];
}

export interface PoomsaeData {
  id:     string;
  nameKo: string;
  nameEn: string;
  level:  string;
  color:  string;
  descKo: string;
  descEn: string;
  moves:  PoomsaeMove[];
}

function move(nameKo: string, nameEn: string, durationMs: number, angles: AngleConstraint[]): PoomsaeMove {
  return { nameKo, nameEn, durationMs, angles };
}

function a(joint: JointKey, target: number, tolerance: number): AngleConstraint {
  return { joint, target, tolerance };
}

// Stance shortcuts
const 앞굽이L = a("leftKnee",  115, 20);   // 왼발 앞굽이 (front leg bent)
const 앞굽이R = a("rightKnee", 115, 20);   // 오른발 앞굽이
const 뒷굽이L = a("leftKnee",  135, 20);   // 왼발 앞에 뒷굽이
const 뒷굽이R = a("rightKnee", 135, 20);   // 오른발 앞에 뒷굽이
const 학다리L = a("leftKnee",   70, 20);   // 왼발 들기 (학다리)
const 학다리R = a("rightKnee",  70, 20);   // 오른발 들기

// ── 태극 1장 (18 동작) ────────────────────────────────────────────
// 아래막기 + 몸통지르기. 앞굽이 일관.
const taegeuk1: PoomsaeData = {
  id: "taegeuk1", nameKo: "태극 1장", nameEn: "Taegeuk Il Jang",
  level: "8급", color: "#E63946",
  descKo: "아래막기와 몸통지르기를 중심으로 한 기본 품새",
  descEn: "Fundamental poomsae focusing on low block and middle punch",
  moves: [
    move("왼 아래막기",         "Left Low Block",          1500, [a("leftElbow",155,20), a("leftShoulder",50,20),   앞굽이L]),
    move("오른 몸통지르기",     "Right Middle Punch",      1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("오른 아래막기",       "Right Low Block",         1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 몸통지르기",       "Left Middle Punch",       1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
    move("왼 아래막기 (전환)",  "Left Low Block (Turn)",   1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통지르기",     "Right Middle Punch",      1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("오른 몸통지르기 ②",  "Right Middle Punch ②",   1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("왼 몸통지르기 (기합)","Left Middle Punch·Kihap", 1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
    move("오른 아래막기",       "Right Low Block",         1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 몸통지르기",       "Left Middle Punch",       1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
    move("왼 아래막기 (전환)",  "Left Low Block (Turn)",   1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통지르기",     "Right Middle Punch",      1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("오른 몸통지르기 ②",  "Right Middle Punch ②",   1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("왼 몸통지르기 (기합)","Left Middle Punch·Kihap", 1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
    move("왼 아래막기",         "Left Low Block",          1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통지르기",     "Right Middle Punch",      1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("오른 아래막기",       "Right Low Block",         1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 몸통지르기",       "Left Middle Punch",       1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
  ],
};

// ── 태극 2장 (18 동작) ────────────────────────────────────────────
// 얼굴막기 추가
const taegeuk2: PoomsaeData = {
  id: "taegeuk2", nameKo: "태극 2장", nameEn: "Taegeuk Yi Jang",
  level: "7급", color: "#E9C46A",
  descKo: "얼굴막기가 추가된 품새",
  descEn: "Poomsae introducing the high face block",
  moves: [
    move("왼 아래막기",           "Left Low Block",           1500, [a("leftElbow",155,20), a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통지르기",       "Right Middle Punch",       1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("오른 아래막기",         "Right Low Block",          1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 몸통지르기",         "Left Middle Punch",        1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
    move("왼 아래막기 (전환)",    "Left Low Block (Turn)",    1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 얼굴막기",         "Right High Block",         1500, [a("rightElbow",100,20), a("rightShoulder",55,20), 앞굽이R]),
    move("오른 아래막기 (전환)",  "Right Low Block (Turn)",   1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 얼굴막기",           "Left High Block",          1500, [a("leftElbow",100,20),  a("leftShoulder",55,20),  앞굽이L]),
    move("왼 아래막기",           "Left Low Block",           1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통지르기",       "Right Middle Punch",       1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("오른 아래막기",         "Right Low Block",          1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 몸통지르기",         "Left Middle Punch",        1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
    move("왼 아래막기 (전환)",    "Left Low Block (Turn)",    1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 얼굴막기",         "Right High Block",         1500, [a("rightElbow",100,20), a("rightShoulder",55,20), 앞굽이R]),
    move("오른 아래막기 (전환)",  "Right Low Block (Turn)",   1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 얼굴막기",           "Left High Block",          1500, [a("leftElbow",100,20),  a("leftShoulder",55,20),  앞굽이L]),
    move("왼 아래막기",           "Left Low Block",           1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통지르기",       "Right Middle Punch",       1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
  ],
};

// ── 태극 3장 (20 동작) ────────────────────────────────────────────
// 몸통막기, 손날목치기, 앞차기 추가
const taegeuk3: PoomsaeData = {
  id: "taegeuk3", nameKo: "태극 3장", nameEn: "Taegeuk Sam Jang",
  level: "6급", color: "#2A9D8F",
  descKo: "몸통막기·손날목치기·앞차기가 포함된 품새",
  descEn: "Poomsae with middle block, knife-hand strike, and front kick",
  moves: [
    move("왼 아래막기",           "Left Low Block",             1500, [a("leftElbow",155,20), a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통막기",         "Right Middle Block",         1500, [a("rightElbow",90,20),  a("rightShoulder",85,20), 앞굽이R]),
    move("오른 아래막기",         "Right Low Block",            1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 몸통막기",           "Left Middle Block",          1500, [a("leftElbow",90,20),   a("leftShoulder",85,20),  앞굽이L]),
    move("왼 아래막기 (전환)",    "Left Low Block (Turn)",      1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 앞차기",           "Right Front Kick",           1500, [a("rightKnee",70,20),   a("rightHip",65,20)]),
    move("오른 손날목치기",       "Right Knife-Hand Strike",    1500, [a("rightElbow",120,20), a("rightShoulder",75,20), 앞굽이R]),
    move("왼 앞차기",             "Left Front Kick",            1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("왼 손날목치기",         "Left Knife-Hand Strike",     1500, [a("leftElbow",120,20),  a("leftShoulder",75,20),  앞굽이L]),
    move("왼 아래막기",           "Left Low Block",             1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통지르기",       "Right Middle Punch",         1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("오른 아래막기",         "Right Low Block",            1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 몸통막기",           "Left Middle Block",          1500, [a("leftElbow",90,20),   a("leftShoulder",85,20),  앞굽이L]),
    move("왼 아래막기 (전환)",    "Left Low Block (Turn)",      1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 앞차기",           "Right Front Kick",           1500, [a("rightKnee",70,20),   a("rightHip",65,20)]),
    move("오른 손날목치기",       "Right Knife-Hand Strike",    1500, [a("rightElbow",120,20), a("rightShoulder",75,20), 앞굽이R]),
    move("왼 앞차기",             "Left Front Kick",            1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("왼 손날목치기 (기합)",  "Left Knife-Hand·Kihap",      1500, [a("leftElbow",120,20),  a("leftShoulder",75,20),  앞굽이L]),
    move("오른 아래막기",         "Right Low Block",            1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 몸통지르기",         "Left Middle Punch",          1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
  ],
};

// ── 태극 4장 (20 동작) ────────────────────────────────────────────
// 앞차기, 옆차기 추가
const taegeuk4: PoomsaeData = {
  id: "taegeuk4", nameKo: "태극 4장", nameEn: "Taegeuk Sa Jang",
  level: "5급", color: "#3B82F6",
  descKo: "앞차기·옆차기가 추가된 품새",
  descEn: "Poomsae adding front kick and side kick",
  moves: [
    move("왼 아래막기",           "Left Low Block",        1500, [a("leftElbow",155,20), a("leftShoulder",50,20),  앞굽이L]),
    move("오른 앞차기",           "Right Front Kick",      1500, [a("rightKnee",70,20),  a("rightHip",65,20)]),
    move("오른 몸통막기",         "Right Middle Block",    1500, [a("rightElbow",90,20),  a("rightShoulder",85,20), 앞굽이R]),
    move("왼 앞차기",             "Left Front Kick",       1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("왼 몸통막기",           "Left Middle Block",     1500, [a("leftElbow",90,20),   a("leftShoulder",85,20),  앞굽이L]),
    move("왼 아래막기 (전환)",    "Left Low Block (Turn)", 1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 옆차기",           "Right Side Kick",       1500, [a("rightKnee",160,20),  a("rightHip",90,20)]),
    move("오른 아래막기",         "Right Low Block",       1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 옆차기",             "Left Side Kick",        1500, [a("leftKnee",160,20),   a("leftHip",90,20)]),
    move("왼 몸통막기",           "Left Middle Block",     1500, [a("leftElbow",90,20),   a("leftShoulder",85,20),  앞굽이L]),
    move("오른 몸통지르기",       "Right Middle Punch",    1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("오른 아래막기",         "Right Low Block",       1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 앞차기",             "Left Front Kick",       1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("왼 몸통막기",           "Left Middle Block",     1500, [a("leftElbow",90,20),   a("leftShoulder",85,20),  앞굽이L]),
    move("왼 아래막기 (전환)",    "Left Low Block (Turn)", 1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 옆차기",           "Right Side Kick",       1500, [a("rightKnee",160,20),  a("rightHip",90,20)]),
    move("오른 아래막기",         "Right Low Block",       1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 옆차기",             "Left Side Kick",        1500, [a("leftKnee",160,20),   a("leftHip",90,20)]),
    move("왼 몸통막기 (기합)",    "Left Middle Block·Kihap",1500,[a("leftElbow",90,20),   a("leftShoulder",85,20),  앞굽이L]),
    move("오른 몸통지르기",       "Right Middle Punch",    1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
  ],
};

// ── 태극 5장 (20 동작) ────────────────────────────────────────────
// 등주먹, 망치주먹, 역손날 추가
const taegeuk5: PoomsaeData = {
  id: "taegeuk5", nameKo: "태극 5장", nameEn: "Taegeuk Oh Jang",
  level: "4급", color: "#9B59B6",
  descKo: "등주먹·망치주먹·역손날이 추가된 품새",
  descEn: "Poomsae adding back fist, hammer fist, and reverse knife-hand",
  moves: [
    move("왼 아래막기",              "Left Low Block",               1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 앞차기",              "Right Front Kick",             1500, [a("rightKnee",70,20),   a("rightHip",65,20)]),
    move("등주먹 옆치기 (오른)",    "Right Back Fist Side Strike",  1500, [a("rightElbow",150,20), a("rightShoulder",90,20), 앞굽이R]),
    move("왼 아래막기 + 오른 망치주먹","Low Block + Hammer Fist",  1500, [a("leftElbow",155,20),  a("rightElbow",150,20),   앞굽이L]),
    move("오른 아래막기",            "Right Low Block",              1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 앞차기",                "Left Front Kick",              1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("역손날 안치기 (왼)",       "Left Reverse Knife-Hand",      1500, [a("leftElbow",120,20),  a("leftShoulder",75,20),  앞굽이L]),
    move("오른 아래막기 + 왼 망치주먹","Low Block + Hammer Fist L", 1500, [a("rightElbow",155,20), a("leftElbow",150,20),    앞굽이R]),
    move("왼 아래막기",              "Left Low Block",               1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통막기",            "Right Middle Block",           1500, [a("rightElbow",90,20),  a("rightShoulder",85,20), 앞굽이R]),
    move("왼 앞차기",                "Left Front Kick",              1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("오른 앞차기",              "Right Front Kick",             1500, [a("rightKnee",70,20),   a("rightHip",65,20)]),
    move("왼 몸통막기",              "Left Middle Block",            1500, [a("leftElbow",90,20),   a("leftShoulder",85,20),  앞굽이L]),
    move("오른 아래막기",            "Right Low Block",              1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 앞차기",                "Left Front Kick",              1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("등주먹 옆치기 (왼)",      "Left Back Fist Side Strike",   1500, [a("leftElbow",150,20),  a("leftShoulder",90,20),  앞굽이L]),
    move("오른 아래막기 + 왼 망치주먹","Low Block + Hammer Fist L", 1500, [a("rightElbow",155,20), a("leftElbow",150,20),    앞굽이R]),
    move("왼 아래막기",              "Left Low Block",               1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("역손날 안치기 (오른) 기합","Right Rev Knife-Hand·Kihap",  1500, [a("rightElbow",120,20), a("rightShoulder",75,20), 앞굽이R]),
    move("왼 몸통지르기",            "Left Middle Punch",            1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
  ],
};

// ── 태극 6장 (23 동작) ────────────────────────────────────────────
// 뒷굽이, 손날막기 추가
const taegeuk6: PoomsaeData = {
  id: "taegeuk6", nameKo: "태극 6장", nameEn: "Taegeuk Yuk Jang",
  level: "3급", color: "#E67E22",
  descKo: "뒷굽이·손날막기가 추가된 품새",
  descEn: "Poomsae adding back stance and knife-hand block",
  moves: [
    move("뒷굽이 왼 손날막기",     "Back Stance L Knife-Hand Block",  1500, [a("leftElbow",120,20),  a("leftShoulder",75,20),  뒷굽이L]),
    move("오른 몸통지르기",         "Right Middle Punch",              1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("뒷굽이 오른 손날막기",   "Back Stance R Knife-Hand Block",  1500, [a("rightElbow",120,20), a("rightShoulder",75,20), 뒷굽이R]),
    move("왼 몸통지르기",           "Left Middle Punch",               1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
    move("왼 아래막기 (전환)",      "Left Low Block (Turn)",           1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 앞차기",             "Right Front Kick",                1500, [a("rightKnee",70,20),   a("rightHip",65,20)]),
    move("뒷굽이 오른 손날막기",   "Back Stance R Knife-Hand Block",  1500, [a("rightElbow",120,20), a("rightShoulder",75,20), 뒷굽이R]),
    move("왼 앞차기",               "Left Front Kick",                 1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("뒷굽이 왼 손날막기",     "Back Stance L Knife-Hand Block",  1500, [a("leftElbow",120,20),  a("leftShoulder",75,20),  뒷굽이L]),
    move("왼 얼굴막기",             "Left High Block",                 1500, [a("leftElbow",100,20),  a("leftShoulder",55,20),  앞굽이L]),
    move("오른 몸통지르기",         "Right Middle Punch",              1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("오른 얼굴막기",           "Right High Block",                1500, [a("rightElbow",100,20), a("rightShoulder",55,20), 앞굽이R]),
    move("왼 몸통지르기",           "Left Middle Punch",               1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
    move("뒷굽이 왼 손날막기",     "Back Stance L Knife-Hand Block",  1500, [a("leftElbow",120,20),  a("leftShoulder",75,20),  뒷굽이L]),
    move("오른 몸통지르기",         "Right Middle Punch",              1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
    move("뒷굽이 오른 손날막기",   "Back Stance R Knife-Hand Block",  1500, [a("rightElbow",120,20), a("rightShoulder",75,20), 뒷굽이R]),
    move("왼 몸통지르기",           "Left Middle Punch",               1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),  앞굽이L]),
    move("왼 아래막기",             "Left Low Block",                  1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 앞차기",             "Right Front Kick",                1500, [a("rightKnee",70,20),   a("rightHip",65,20)]),
    move("오른 아래막기",           "Right Low Block",                 1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 앞차기",               "Left Front Kick",                 1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("왼 아래막기 (기합)",      "Left Low Block·Kihap",            1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통지르기",         "Right Middle Punch",              1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
  ],
};

// ── 태극 7장 (25 동작) ────────────────────────────────────────────
// 학다리서기, 팔굽치기, 돌려차기 추가
const taegeuk7: PoomsaeData = {
  id: "taegeuk7", nameKo: "태극 7장", nameEn: "Taegeuk Chil Jang",
  level: "2급", color: "#1ABC9C",
  descKo: "학다리서기·팔굽치기·돌려차기가 포함된 품새",
  descEn: "Poomsae with crane stance, elbow techniques, and roundhouse kick",
  moves: [
    move("왼 학다리 + 팔굽올려치기","Crane Stance + Upward Elbow L", 1500, [학다리L, a("rightElbow",90,20),  a("rightShoulder",120,20)]),
    move("오른 아래막기",            "Right Low Block",               1500, [a("rightElbow",155,20), a("rightShoulder",50,20),  앞굽이R]),
    move("오른 학다리 + 팔굽올려치기","Crane Stance + Upward Elbow R",1500, [학다리R, a("leftElbow",90,20),   a("leftShoulder",120,20)]),
    move("왼 아래막기",              "Left Low Block",                1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),   앞굽이L]),
    move("왼 몸통막기",              "Left Middle Block",             1500, [a("leftElbow",90,20),   a("leftShoulder",85,20),   앞굽이L]),
    move("오른 몸통지르기",          "Right Middle Punch",            1200, [a("rightElbow",168,15), a("rightShoulder",90,20),  앞굽이R]),
    move("오른 몸통막기",            "Right Middle Block",            1500, [a("rightElbow",90,20),  a("rightShoulder",85,20),  앞굽이R]),
    move("왼 몸통지르기",            "Left Middle Punch",             1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),   앞굽이L]),
    move("왼 아래막기 (전환)",       "Left Low Block (Turn)",         1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),   앞굽이L]),
    move("오른 돌려차기",            "Right Roundhouse Kick",         1500, [a("rightKnee",65,20),   a("rightHip",70,20)]),
    move("오른 아래막기",            "Right Low Block",               1500, [a("rightElbow",155,20), a("rightShoulder",50,20),  앞굽이R]),
    move("왼 돌려차기",              "Left Roundhouse Kick",          1500, [a("leftKnee",65,20),    a("leftHip",70,20)]),
    move("왼 아래막기",              "Left Low Block",                1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),   앞굽이L]),
    move("오른 학다리 + 팔굽올려치기","Crane Stance + Upward Elbow R",1500, [학다리R, a("leftElbow",90,20),   a("leftShoulder",120,20)]),
    move("오른 몸통막기",            "Right Middle Block",            1500, [a("rightElbow",90,20),  a("rightShoulder",85,20),  앞굽이R]),
    move("왼 학다리 + 팔굽올려치기","Crane Stance + Upward Elbow L", 1500, [학다리L, a("rightElbow",90,20),  a("rightShoulder",120,20)]),
    move("왼 몸통막기",              "Left Middle Block",             1500, [a("leftElbow",90,20),   a("leftShoulder",85,20),   앞굽이L]),
    move("왼 아래막기 (전환)",       "Left Low Block (Turn)",         1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),   앞굽이L]),
    move("오른 돌려차기",            "Right Roundhouse Kick",         1500, [a("rightKnee",65,20),   a("rightHip",70,20)]),
    move("오른 아래막기",            "Right Low Block",               1500, [a("rightElbow",155,20), a("rightShoulder",50,20),  앞굽이R]),
    move("왼 돌려차기",              "Left Roundhouse Kick",          1500, [a("leftKnee",65,20),    a("leftHip",70,20)]),
    move("왼 아래막기",              "Left Low Block",                1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),   앞굽이L]),
    move("오른 앞차기",              "Right Front Kick",              1500, [a("rightKnee",70,20),   a("rightHip",65,20)]),
    move("오른 손날목치기 (기합)",   "Right Knife-Hand Strike·Kihap", 1500, [a("rightElbow",120,20), a("rightShoulder",75,20),  앞굽이R]),
    move("왼 몸통지르기",            "Left Middle Punch",             1200, [a("leftElbow",168,15),  a("leftShoulder",90,20),   앞굽이L]),
  ],
};

// ── 태극 8장 (27 동작) ────────────────────────────────────────────
// 바탕손, 팔굽내려치기, 반달차기, 잡아당기기+앞차기 추가
const taegeuk8: PoomsaeData = {
  id: "taegeuk8", nameKo: "태극 8장", nameEn: "Taegeuk Pal Jang",
  level: "1급", color: "#F39C12",
  descKo: "고급 연결 기술 — 태극 품새 최고 난이도",
  descEn: "Advanced combination poomsae — highest Taegeuk difficulty",
  moves: [
    move("뒷굽이 왼 손날막기",     "Back Stance L Knife-Hand Block",   1500, [a("leftElbow",120,20),  a("leftShoulder",75,20),  뒷굽이L]),
    move("바탕손올려막기 (오른)",  "Right Palm Heel Rising Block",     1500, [a("rightElbow",100,20), a("rightShoulder",55,20), 앞굽이R]),
    move("잡아당기기 + 오른 앞차기","Grab + Right Front Kick",         1500, [a("rightKnee",70,20),   a("rightHip",65,20)]),
    move("팔굽내려치기 (오른)",    "Right Downward Elbow Strike",      1500, [a("rightElbow",60,20),  a("rightShoulder",130,20), 앞굽이R]),
    move("뒷굽이 오른 손날막기",   "Back Stance R Knife-Hand Block",   1500, [a("rightElbow",120,20), a("rightShoulder",75,20), 뒷굽이R]),
    move("바탕손올려막기 (왼)",    "Left Palm Heel Rising Block",      1500, [a("leftElbow",100,20),  a("leftShoulder",55,20),  앞굽이L]),
    move("잡아당기기 + 왼 앞차기", "Grab + Left Front Kick",           1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("팔굽내려치기 (왼)",      "Left Downward Elbow Strike",       1500, [a("leftElbow",60,20),   a("leftShoulder",130,20), 앞굽이L]),
    move("왼 아래막기 (전환)",     "Left Low Block (Turn)",            1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 앞차기",            "Right Front Kick",                 1500, [a("rightKnee",70,20),   a("rightHip",65,20)]),
    move("오른 손날목치기",        "Right Knife-Hand Strike",          1500, [a("rightElbow",120,20), a("rightShoulder",75,20), 앞굽이R]),
    move("왼 앞차기",              "Left Front Kick",                  1500, [a("leftKnee",70,20),    a("leftHip",65,20)]),
    move("왼 손날목치기",          "Left Knife-Hand Strike",           1500, [a("leftElbow",120,20),  a("leftShoulder",75,20),  앞굽이L]),
    move("왼 아래막기",            "Left Low Block",                   1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 옆차기",            "Right Side Kick",                  1500, [a("rightKnee",160,20),  a("rightHip",90,20)]),
    move("왼 몸통막기",            "Left Middle Block",                1500, [a("leftElbow",90,20),   a("leftShoulder",85,20),  앞굽이L]),
    move("오른 반달차기",          "Right Crescent Kick",              1500, [a("rightKnee",90,25),   a("rightHip",80,20)]),
    move("오른 아래막기",          "Right Low Block",                  1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 옆차기",              "Left Side Kick",                   1500, [a("leftKnee",160,20),   a("leftHip",90,20)]),
    move("오른 몸통막기",          "Right Middle Block",               1500, [a("rightElbow",90,20),  a("rightShoulder",85,20), 앞굽이R]),
    move("왼 반달차기",            "Left Crescent Kick",               1500, [a("leftKnee",90,25),    a("leftHip",80,20)]),
    move("왼 아래막기",            "Left Low Block",                   1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 돌려차기",          "Right Roundhouse Kick",            1500, [a("rightKnee",65,20),   a("rightHip",70,20)]),
    move("오른 아래막기",          "Right Low Block",                  1500, [a("rightElbow",155,20), a("rightShoulder",50,20), 앞굽이R]),
    move("왼 돌려차기",            "Left Roundhouse Kick",             1500, [a("leftKnee",65,20),    a("leftHip",70,20)]),
    move("왼 아래막기 (기합)",     "Left Low Block·Kihap",             1500, [a("leftElbow",155,20),  a("leftShoulder",50,20),  앞굽이L]),
    move("오른 몸통지르기",        "Right Middle Punch",               1200, [a("rightElbow",168,15), a("rightShoulder",90,20), 앞굽이R]),
  ],
};

export const POOMSAE_LIST: PoomsaeData[] = [
  taegeuk1, taegeuk2, taegeuk3, taegeuk4,
  taegeuk5, taegeuk6, taegeuk7, taegeuk8,
];

export function getPoomsae(id: string): PoomsaeData | undefined {
  return POOMSAE_LIST.find(p => p.id === id);
}
