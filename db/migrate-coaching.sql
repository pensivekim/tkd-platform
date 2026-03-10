-- =============================================
-- TKD Live Coach — D1 스키마 확장
-- migrate-coaching.sql
-- =============================================

-- coaching_sessions 테이블
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id               TEXT PRIMARY KEY,
  dojang_id        TEXT NOT NULL REFERENCES dojangs(id),
  coach_id         TEXT NOT NULL REFERENCES users(id),
  title            TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL DEFAULT 'individual', -- 'individual' | 'group'
  status           TEXT NOT NULL DEFAULT 'waiting',    -- 'waiting' | 'active' | 'ended'
  invite_token     TEXT UNIQUE NOT NULL,               -- 원생 초대 링크용
  max_participants INTEGER NOT NULL DEFAULT 10,
  started_at       TEXT,
  ended_at         TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- coaching_participants 테이블
CREATE TABLE IF NOT EXISTS coaching_participants (
  id           TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL REFERENCES coaching_sessions(id),
  student_id   TEXT REFERENCES students(id),
  peer_id      TEXT NOT NULL,   -- WebRTC peer 식별자
  display_name TEXT NOT NULL,
  joined_at    TEXT NOT NULL DEFAULT (datetime('now')),
  left_at      TEXT
);

-- coaching_signals 테이블 (WebRTC 시그널링)
CREATE TABLE IF NOT EXISTS coaching_signals (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES coaching_sessions(id),
  from_peer  TEXT NOT NULL,
  to_peer    TEXT NOT NULL,
  type       TEXT NOT NULL, -- 'offer' | 'answer' | 'ice-candidate'
  payload    TEXT NOT NULL, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_dojang_id    ON coaching_sessions(dojang_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_invite_token ON coaching_sessions(invite_token);
CREATE INDEX IF NOT EXISTS idx_coaching_participants_session_id ON coaching_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_signals_session_id    ON coaching_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_signals_to_peer       ON coaching_signals(to_peer);
