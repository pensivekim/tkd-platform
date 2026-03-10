-- migrate-layer1.sql

-- 1. dojangs 테이블
CREATE TABLE IF NOT EXISTS dojangs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  region TEXT,
  city TEXT,
  logo_url TEXT,
  description TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_expires_at TEXT,
  center_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. students 테이블
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  dojang_id TEXT NOT NULL REFERENCES dojangs(id),
  name TEXT NOT NULL,
  birth_date TEXT,
  phone TEXT,
  parent_phone TEXT,
  belt TEXT DEFAULT '흰띠',
  dan TEXT,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'active',
  memo TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. attendance 테이블
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  dojang_id TEXT NOT NULL REFERENCES dojangs(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  date TEXT NOT NULL,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  type TEXT NOT NULL DEFAULT '출석',
  memo TEXT
);

-- 4. notices 테이블
CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY,
  dojang_id TEXT NOT NULL REFERENCES dojangs(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. users 컬럼 추가
ALTER TABLE users ADD COLUMN dojang_id TEXT;
ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN messenger_id TEXT;
ALTER TABLE users ADD COLUMN messenger_type TEXT;

-- 6. 인덱스
CREATE INDEX IF NOT EXISTS idx_users_dojang_id ON users(dojang_id);
CREATE INDEX IF NOT EXISTS idx_students_dojang_id ON students(dojang_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_dojang_id ON attendance(dojang_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_notices_dojang_id ON notices(dojang_id);
