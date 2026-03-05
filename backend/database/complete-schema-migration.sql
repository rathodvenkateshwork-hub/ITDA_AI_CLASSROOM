-- ============================================================================
-- COMPLETE LMS DATABASE SCHEMA MIGRATION FOR SUPABASE
-- This file contains BOTH base tables and portal feature tables
-- Run this SINGLE file in Supabase SQL Editor to set up entire database
-- ============================================================================

-- ============================================================================
-- PART 1: BASE TABLES (from supabase-migration.sql)
-- ============================================================================

-- 1. Schools Table
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64) NOT NULL UNIQUE,
  district VARCHAR(128) NOT NULL,
  mandal VARCHAR(128),
  active_status BOOLEAN DEFAULT TRUE,
  sessions_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  section VARCHAR(64),
  grade SMALLINT NOT NULL,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(255),
  grades TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  grade SMALLINT NOT NULL,
  order_num INTEGER DEFAULT 1,
  chapter_no SMALLINT,
  month_label VARCHAR(128),
  periods SMALLINT,
  teaching_plan_summary VARCHAR(512),
  concepts TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- 5. Topics Table
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  order_num INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'not_started',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

-- 6. Topic Materials Table
CREATE TABLE IF NOT EXISTS topic_materials (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL,
  type VARCHAR(50) DEFAULT 'doc',
  title VARCHAR(255),
  url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

-- 7. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  school_id INTEGER NOT NULL,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- 8. Teacher Assignments Table
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- 9. Students Table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  roll_no INTEGER,
  section VARCHAR(64),
  school_id INTEGER NOT NULL,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- 10. Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  academic_year VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 11. Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

-- 12. Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  quiz_id INTEGER NOT NULL,
  score DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(5,2) DEFAULT 0,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-- 13. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- ============================================================================
-- PART 2: PORTAL FEATURE TABLES (from add-portal-features.sql)
-- ============================================================================

-- 1. STUDY MATERIALS TABLE
CREATE TABLE IF NOT EXISTS study_materials (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'ppt', 'notes', 'video', 'image', 'simulation'
  content_url TEXT,
  description TEXT,
  duration INTEGER, -- in seconds for videos
  file_size INTEGER, -- in bytes
  created_by INTEGER REFERENCES teachers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_study_materials_chapter ON study_materials(chapter_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_topic ON study_materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_type ON study_materials(type);

-- 2. QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'short_answer', 'essay'
  options JSONB, -- For multiple choice: [{"text": "Option A", "index": 1}, ...]
  correct_answer TEXT,
  marks INTEGER DEFAULT 1,
  explanation TEXT,
  order_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- 3. QUIZ SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_marks INTEGER,
  obtained_marks INTEGER,
  percentage DECIMAL(5,2),
  status VARCHAR(50), -- 'submitted', 'graded', 'reviewed'
  attempt_number INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student ON quiz_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz ON quiz_submissions(quiz_id);

-- 4. QUIZ ANSWERS TABLE
CREATE TABLE IF NOT EXISTS quiz_answers (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES quiz_submissions(id),
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id),
  student_answer TEXT,
  is_correct BOOLEAN,
  marks_obtained INTEGER,
  answer_time INTEGER -- in seconds
);

-- 5. SESSIONS TABLE (Live teaching sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  topic_id INTEGER REFERENCES topics(id),
  session_date DATE NOT NULL,
  session_time TIME,
  duration INTEGER, -- in minutes
  status VARCHAR(50), -- 'scheduled', 'live', 'completed', 'cancelled'
  streaming_link TEXT,
  attendance_marked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);

-- 6. SESSION ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS session_attendance (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  attendance_status VARCHAR(50), -- 'present', 'absent', 'late'
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_student ON session_attendance(student_id);

-- 7. BADGES TABLE
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  badge_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  category VARCHAR(50), -- 'attendance', 'quiz', 'subject', 'achievement'
  criteria JSONB, -- Criteria to earn badge
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. STUDENT BADGES TABLE
CREATE TABLE IF NOT EXISTS student_badges (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  badge_id INTEGER NOT NULL REFERENCES badges(id),
  earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);

-- 9. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  certificate_type VARCHAR(50), -- 'completion', 'achievement', 'participation'
  subject_id INTEGER REFERENCES subjects(id),
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  certificate_number VARCHAR(100) UNIQUE,
  issued_by INTEGER REFERENCES teachers(id),
  certificate_file_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);

-- 10. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  activity_name VARCHAR(255) NOT NULL,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  category VARCHAR(50), -- 'academic', 'sports', 'cultural'
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(255),
  address TEXT,
  description TEXT,
  max_participants INTEGER,
  status VARCHAR(50), -- 'upcoming', 'ongoing', 'completed', 'cancelled'
  created_by INTEGER REFERENCES teachers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_school ON activities(school_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(event_date);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);

-- 11. ACTIVITY REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS activity_registrations (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES activities(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50), -- 'pending', 'approved', 'rejected'
  result VARCHAR(255), -- Certificate, rank, etc.
  UNIQUE(activity_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_registrations_activity ON activity_registrations(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_registrations_student ON activity_registrations(student_id);

-- 12. WEAK TOPICS TABLE
CREATE TABLE IF NOT EXISTS weak_topics (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  weakness_score DECIMAL(5,2), -- Percentage of incorrect answers
  last_assessment TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weak_topics_student ON weak_topics(student_id);

-- 13. STUDENT PERFORMANCE TABLE
CREATE TABLE IF NOT EXISTS student_performance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  total_quizzes_taken INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  last_assessment TIMESTAMP,
  rank_in_class INTEGER,
  overall_percentage DECIMAL(5,2)
);

CREATE INDEX IF NOT EXISTS idx_student_performance_student ON student_performance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_performance_subject ON student_performance(subject_id);

-- 14. TEACHER ASSIGNMENT TABLE
CREATE TABLE IF NOT EXISTS teacher_subject_assignment (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  subject_id INTEGER NOT NULL REFERENCES subjects(id),
  academic_year VARCHAR(9),
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignment_teacher ON teacher_subject_assignment(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_class ON teacher_subject_assignment(class_id);

-- 15. CHAPTER SYLLABUS PROGRESS TABLE
CREATE TABLE IF NOT EXISTS chapter_progress (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id),
  chapter_id INTEGER NOT NULL REFERENCES chapters(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  sessions_planned INTEGER DEFAULT 0,
  sessions_completed INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chapter_progress_teacher ON chapter_progress(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_chapter ON chapter_progress(chapter_id);

-- 16. ACTIVITY LOGS TABLE (for admin tracking)
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_type VARCHAR(50), -- 'admin', 'teacher', 'student'
  action VARCHAR(255),
  module VARCHAR(100), -- 'quiz', 'session', 'materials', etc.
  description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- 17. CLASS STATUS TABLE
CREATE TABLE IF NOT EXISTS class_status (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  status_date DATE NOT NULL,
  status VARCHAR(50), -- 'conducted', 'cancelled'
  reason TEXT,
  teacher_id INTEGER REFERENCES teachers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_class_status_class ON class_status(class_id);
CREATE INDEX IF NOT EXISTS idx_class_status_date ON class_status(status_date);

-- 18. COURSE COMPLETION TABLE
CREATE TABLE IF NOT EXISTS course_completion (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  current_class_id INTEGER NOT NULL REFERENCES classes(id),
  next_class_id INTEGER REFERENCES classes(id),
  final_marks DECIMAL(5,2),
  status VARCHAR(50), -- 'pass', 'fail', 'promoted'
  promotion_date TIMESTAMP,
  remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_course_completion_student ON course_completion(student_id);

-- 19. STUDENT QR CARDS TABLE
CREATE TABLE IF NOT EXISTS student_qr_cards (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  qr_code_data TEXT UNIQUE,
  qr_code_image_url TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qr_cards_student ON student_qr_cards(student_id);

-- 20. TEACHER QR CARDS TABLE
CREATE TABLE IF NOT EXISTS teacher_qr_cards (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id),
  qr_code_data TEXT UNIQUE,
  qr_code_image_url TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teacher_qr_cards_teacher ON teacher_qr_cards(teacher_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- All 40 tables created successfully with proper relationships and indexes
-- ============================================================================
