-- TKD Memory: 대회/훈련 앨범 + AI 포토 분류 마이그레이션 v2

-- albums 테이블 (대회/훈련 앨범)
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  dojang_id TEXT NOT NULL REFERENCES dojangs(id),
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'training', -- 'training' | 'competition'
  cover_r2_key TEXT,
  photo_count INTEGER NOT NULL DEFAULT 0,
  share_token TEXT UNIQUE, -- 공개 앨범 URL 토큰
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- photos 테이블
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES albums(id),
  dojang_id TEXT NOT NULL REFERENCES dojangs(id),
  r2_key TEXT NOT NULL,
  student_id TEXT REFERENCES students(id),
  face_confidence REAL,
  classified_at TEXT,
  is_confirmed INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 웹 푸시 구독 테이블
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  dojang_id TEXT NOT NULL REFERENCES dojangs(id),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- students 컬럼 추가
ALTER TABLE students ADD COLUMN face_r2_key TEXT;
ALTER TABLE students ADD COLUMN face_embedding TEXT;
ALTER TABLE students ADD COLUMN parent_email TEXT;
ALTER TABLE students ADD COLUMN notification_channel TEXT DEFAULT 'web'; -- 'web' | 'kakaotalk' | 'line' | 'whatsapp'

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_albums_dojang_id ON albums(dojang_id);
CREATE INDEX IF NOT EXISTS idx_albums_share_token ON albums(share_token);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_student_id ON photos(student_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_student_id ON push_subscriptions(student_id);
