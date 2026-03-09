CREATE TABLE IF NOT EXISTS exam_sessions (
  id TEXT PRIMARY KEY,
  examiner_name TEXT NOT NULL,
  applicant_name TEXT,
  poomsae_type TEXT,
  dan_level INTEGER,
  status TEXT DEFAULT 'waiting',
  ai_score REAL,
  examiner_score REAL,
  final_result TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  dojang_name TEXT,
  dan_level INTEGER,
  country TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webrtc_signals (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id TEXT PRIMARY KEY,
  instructor_name TEXT NOT NULL,
  title TEXT NOT NULL,
  poomsae_type TEXT NOT NULL,
  max_trainees INTEGER DEFAULT 30,
  status TEXT DEFAULT 'waiting',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  trainee_name TEXT NOT NULL,
  dojang_name TEXT,
  score REAL DEFAULT 0,
  joined_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS training_signals (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  location TEXT,
  status TEXT DEFAULT 'upcoming',
  broadcast_status TEXT DEFAULT 'off',
  viewer_count INTEGER DEFAULT 0,
  scoreboard TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS event_players (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dojang_name TEXT,
  dan_level INTEGER,
  category TEXT,
  parent_messenger_id TEXT,
  parent_messenger_type TEXT,
  face_encoding TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS event_media (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  type TEXT DEFAULT 'photo',
  r2_key TEXT NOT NULL,
  player_id TEXT,
  player_name TEXT,
  captured_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS event_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
