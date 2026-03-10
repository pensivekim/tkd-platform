CREATE TABLE IF NOT EXISTS poomsae_invites (
  id TEXT PRIMARY KEY,
  dojang_id TEXT NOT NULL REFERENCES dojangs(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  poomsae_id TEXT NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  message TEXT,
  used_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_poomsae_invites_token      ON poomsae_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_poomsae_invites_student_id ON poomsae_invites(student_id);
