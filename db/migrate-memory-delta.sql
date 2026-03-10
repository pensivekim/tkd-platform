-- TKD Memory 델타 마이그레이션 (리모트 전용)
-- 이미 적용된 것 제외, 새로 추가되는 것만 포함

-- albums에 share_token 컬럼 추가 (SQLite: UNIQUE는 인덱스로 분리)
ALTER TABLE albums ADD COLUMN share_token TEXT;

-- push_subscriptions 테이블 신규 생성
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  dojang_id TEXT NOT NULL REFERENCES dojangs(id),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- students에 parent_email 추가 (face_r2_key, face_embedding, notification_channel은 이미 적용됨)
ALTER TABLE students ADD COLUMN parent_email TEXT;

-- 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_albums_share_token ON albums(share_token);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_student_id ON push_subscriptions(student_id);
