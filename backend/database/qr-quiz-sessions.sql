-- ============================================================
-- QR-Based Classroom Quiz Session System
-- ============================================================

-- Live quiz sessions (one per question displayed on board)
CREATE TABLE IF NOT EXISTS qr_quiz_sessions (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  class_id INTEGER,
  subject_id INTEGER,
  chapter_id INTEGER,
  topic_id INTEGER,
  session_code VARCHAR(10) UNIQUE NOT NULL,  -- short code for easy reference
  title VARCHAR(500),
  status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created','active','collecting','submitted','revealed','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Questions within a session (ordered)
CREATE TABLE IF NOT EXISTS qr_quiz_questions (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES qr_quiz_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  time_limit_seconds INTEGER DEFAULT 30,
  points INTEGER DEFAULT 10,
  explanation TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','displaying','collecting','revealed')),
  displayed_at TIMESTAMPTZ,
  revealed_at TIMESTAMPTZ
);

-- Scanned student responses
CREATE TABLE IF NOT EXISTS qr_quiz_responses (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES qr_quiz_sessions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES qr_quiz_questions(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL,
  selected_option CHAR(1) NOT NULL CHECK (selected_option IN ('A','B','C','D')),
  is_correct BOOLEAN,
  points_awarded INTEGER DEFAULT 0,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, student_id)  -- prevent duplicate scans per question
);

-- Session leaderboard (computed after each question reveal)
CREATE TABLE IF NOT EXISTS qr_quiz_leaderboard (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES qr_quiz_sessions(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL,
  total_correct INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  total_answered INTEGER DEFAULT 0,
  rank_position INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_qr_quiz_sessions_teacher ON qr_quiz_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_qr_quiz_sessions_code ON qr_quiz_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_qr_quiz_questions_session ON qr_quiz_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_quiz_responses_session ON qr_quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_quiz_responses_question ON qr_quiz_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_qr_quiz_responses_student ON qr_quiz_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_qr_quiz_leaderboard_session ON qr_quiz_leaderboard(session_id);
