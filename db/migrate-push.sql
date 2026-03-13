-- Web Push 구독 테이블
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         TEXT PRIMARY KEY,
  dojang_id  TEXT REFERENCES dojangs(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_push_dojang   ON push_subscriptions(dojang_id);
CREATE INDEX IF NOT EXISTS idx_push_student  ON push_subscriptions(student_id);
