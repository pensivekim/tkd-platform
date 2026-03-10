-- =============================================
-- TKD-PLATFORM (도장관) Layer 1 Schema
-- 도장 SaaS: 원생 관리, 출석, 공지사항
-- =============================================
-- 신규 DB: 이 파일 그대로 실행
-- 기존 DB(users 테이블 이미 존재): db/migrate-users.sql 을 먼저 실행
-- =============================================

-- 도장 정보
CREATE TABLE IF NOT EXISTS dojangs (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  owner_name       TEXT NOT NULL,
  phone            TEXT,
  address          TEXT,
  region           TEXT,
  city             TEXT,
  logo_url         TEXT,
  description      TEXT,
  plan             TEXT NOT NULL DEFAULT 'free',
  plan_expires_at  TEXT,
  center_id        TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 도장 관리자 계정
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  dojang_id      TEXT REFERENCES dojangs(id),
  email          TEXT UNIQUE,
  password_hash  TEXT,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'staff',
  dojang_name    TEXT,
  dan_level      INTEGER,
  country        TEXT,
  messenger_id   TEXT,
  messenger_type TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 원생 정보
CREATE TABLE IF NOT EXISTS students (
  id           TEXT PRIMARY KEY,
  dojang_id    TEXT NOT NULL REFERENCES dojangs(id),
  name         TEXT NOT NULL,
  birth_date   TEXT,
  phone        TEXT,
  parent_phone TEXT,
  belt         TEXT DEFAULT '흰띠',
  dan          TEXT,
  joined_at    TEXT NOT NULL DEFAULT (datetime('now')),
  status       TEXT NOT NULL DEFAULT 'active',
  memo         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 출석 기록
CREATE TABLE IF NOT EXISTS attendance (
  id         TEXT PRIMARY KEY,
  dojang_id  TEXT NOT NULL REFERENCES dojangs(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  date       TEXT NOT NULL,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  type       TEXT NOT NULL DEFAULT '출석',
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
-- Layer 1 인덱스
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_dojang_id       ON users(dojang_id);
CREATE INDEX IF NOT EXISTS idx_students_dojang_id    ON students(dojang_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_dojang_id  ON attendance(dojang_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date       ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_notices_dojang_id     ON notices(dojang_id);
