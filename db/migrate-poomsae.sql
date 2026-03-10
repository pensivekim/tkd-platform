-- Poomsae results table
CREATE TABLE IF NOT EXISTS poomsae_results (
  id TEXT PRIMARY KEY,
  dojang_id TEXT NOT NULL REFERENCES dojangs(id),
  student_id TEXT REFERENCES students(id),
  student_name TEXT NOT NULL,
  poomsae_id TEXT NOT NULL,
  poomsae_name TEXT NOT NULL,
  total_score REAL NOT NULL,
  accuracy REAL,
  symmetry REAL,
  stability REAL,
  timing REAL,
  completeness REAL,
  duration_seconds INTEGER,
  mode TEXT NOT NULL DEFAULT 'practice',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_poomsae_results_dojang_id  ON poomsae_results(dojang_id);
CREATE INDEX IF NOT EXISTS idx_poomsae_results_student_id ON poomsae_results(student_id);
