-- =============================================
-- TKD-PLATFORM (도장관) Database Schema
-- tkd.genomic.cc
-- =============================================

-- =============================================
-- Layer 1: 도장 SaaS (원생 관리)
-- =============================================

-- 도장 정보
CREATE TABLE IF NOT EXISTS dojangs (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,                                  -- 도장명
  owner_name       TEXT NOT NULL,                                  -- 관장명
  phone            TEXT,                                           -- 대표 전화
  address          TEXT,                                           -- 주소
  region           TEXT,                                           -- 시/도 (예: 대구광역시)
  city             TEXT,                                           -- 시/군/구 (예: 수성구)
  logo_url         TEXT,
  description      TEXT,
  plan             TEXT NOT NULL DEFAULT 'free',                   -- 'free' | 'basic' | 'pro'
  plan_expires_at  TEXT,
  center_id        TEXT,                                           -- genomic.cc 통합 로그인 연동용 (nullable)
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 도장 관리자 계정 (SaaS 로그인 + WebRTC 참가자 통합)
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  dojang_id     TEXT REFERENCES dojangs(id),                      -- nullable: WebRTC 참가자는 null
  email         TEXT UNIQUE,                                       -- nullable: WebRTC 참가자는 이메일 없음
  password_hash TEXT,                                              -- nullable: same
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff',                     -- 'owner' | 'staff' | 'examiner' | 'instructor' | 'trainee'
  dojang_name   TEXT,                                              -- 도장명 (WebRTC 참가자용)
  dan_level     INTEGER,                                           -- 단 (WebRTC 참가자용)
  country       TEXT,                                              -- 국가 (WebRTC 참가자용)
  messenger_id  TEXT,                                              -- LINE or KakaoTalk ID
  messenger_type TEXT,                                             -- 'line' | 'kakao'
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 원생 정보
CREATE TABLE IF NOT EXISTS students (
  id           TEXT PRIMARY KEY,
  dojang_id    TEXT NOT NULL REFERENCES dojangs(id),
  name         TEXT NOT NULL,
  birth_date   TEXT,
  phone        TEXT,
  parent_phone TEXT,
  belt         TEXT DEFAULT '흰띠',                                -- 흰띠/노란띠/초록띠/파란띠/빨간띠/검은띠
  dan          TEXT,                                               -- 단증 번호 (국기원 연동 대비)
  joined_at    TEXT NOT NULL DEFAULT (datetime('now')),
  status       TEXT NOT NULL DEFAULT 'active',                     -- 'active' | 'inactive'
  memo         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 출석 기록
CREATE TABLE IF NOT EXISTS attendance (
  id         TEXT PRIMARY KEY,
  dojang_id  TEXT NOT NULL REFERENCES dojangs(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  date       TEXT NOT NULL,                                        -- YYYY-MM-DD (출석 날짜)
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  type       TEXT NOT NULL DEFAULT '출석',                         -- '출석' | '결석' | '조퇴'
  memo       TEXT
);

-- 공지사항
CREATE TABLE IF NOT EXISTS notices (
  id         TEXT PRIMARY KEY,
  dojang_id  TEXT NOT NULL REFERENCES dojangs(id),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  is_pinned  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================
-- Layer 2: AI 품새 채점 (WebRTC + MediaPipe)
-- =============================================

-- 원격 승단 심사 세션
CREATE TABLE IF NOT EXISTS exam_sessions (
  id             TEXT PRIMARY KEY,
  examiner_name  TEXT NOT NULL,
  applicant_name TEXT,
  poomsae_type   TEXT,
  dan_level      INTEGER,
  status         TEXT DEFAULT 'waiting',                           -- 'waiting' | 'active' | 'completed'
  ai_score       REAL,
  examiner_score REAL,
  final_result   TEXT,                                             -- 'pass' | 'fail'
  created_at     TEXT DEFAULT (datetime('now')),
  completed_at   TEXT
);

-- WebRTC 시그널링
CREATE TABLE IF NOT EXISTS webrtc_signals (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role       TEXT NOT NULL,
  type       TEXT NOT NULL,
  data       TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 사범 원격 연수 세션
CREATE TABLE IF NOT EXISTS training_sessions (
  id               TEXT PRIMARY KEY,
  instructor_name  TEXT NOT NULL,
  title            TEXT NOT NULL,
  poomsae_type     TEXT NOT NULL,
  max_trainees     INTEGER DEFAULT 30,
  status           TEXT DEFAULT 'waiting',
  created_at       TEXT DEFAULT (datetime('now'))
);

-- 연수 참가자
CREATE TABLE IF NOT EXISTS training_participants (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL,
  trainee_name  TEXT NOT NULL,
  dojang_name   TEXT,
  score         REAL DEFAULT 0,
  joined_at     TEXT DEFAULT (datetime('now'))
);

-- 연수 WebRTC 시그널링
CREATE TABLE IF NOT EXISTS training_signals (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  from_id    TEXT NOT NULL,
  to_id      TEXT NOT NULL,
  type       TEXT NOT NULL,
  data       TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- Layer 3: 대회 라이브 + AI 포토
-- =============================================

-- 대회
CREATE TABLE IF NOT EXISTS events (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  date             TEXT,
  location         TEXT,
  status           TEXT DEFAULT 'upcoming',
  broadcast_status TEXT DEFAULT 'off',
  viewer_count     INTEGER DEFAULT 0,
  scoreboard       TEXT DEFAULT '{}',
  created_at       TEXT DEFAULT (datetime('now'))
);

-- 대회 참가 선수
CREATE TABLE IF NOT EXISTS event_players (
  id                   TEXT PRIMARY KEY,
  event_id             TEXT NOT NULL,
  name                 TEXT NOT NULL,
  dojang_name          TEXT,
  dan_level            INTEGER,
  category             TEXT,
  parent_messenger_id  TEXT,
  parent_messenger_type TEXT,
  face_encoding        TEXT,
  created_at           TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- 대회 미디어 (사진/영상)
CREATE TABLE IF NOT EXISTS event_media (
  id          TEXT PRIMARY KEY,
  event_id    TEXT NOT NULL,
  type        TEXT DEFAULT 'photo',                                -- 'photo' | 'video' | 'highlight'
  r2_key      TEXT NOT NULL,
  player_id   TEXT,
  player_name TEXT,
  captured_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- 대회 WebRTC 시그널링
CREATE TABLE IF NOT EXISTS event_signals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   TEXT NOT NULL,
  from_id    TEXT NOT NULL,
  to_id      TEXT NOT NULL,
  type       TEXT NOT NULL,
  data       TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- 인덱스
-- =============================================

-- Layer 1 인덱스
CREATE INDEX IF NOT EXISTS idx_users_dojang_id        ON users(dojang_id);
CREATE INDEX IF NOT EXISTS idx_students_dojang_id     ON students(dojang_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id  ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_dojang_id   ON attendance(dojang_id);
CREATE INDEX IF NOT EXISTS idx_attendance_checked_at  ON attendance(checked_at);
CREATE INDEX IF NOT EXISTS idx_notices_dojang_id      ON notices(dojang_id);

-- Layer 2 인덱스
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_session ON webrtc_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_training_signals_session ON training_signals(session_id);

-- Layer 3 인덱스
CREATE INDEX IF NOT EXISTS idx_event_players_event    ON event_players(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_event      ON event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_event_signals_event    ON event_signals(event_id);
