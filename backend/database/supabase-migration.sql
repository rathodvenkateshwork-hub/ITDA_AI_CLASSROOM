-- Supabase PostgreSQL Migration for LMS Database
-- This creates all required tables for the Learning Management System

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
  grade TINYINT NOT NULL,
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
  grade TINYINT NOT NULL,
  order_num INTEGER DEFAULT 1,
  chapter_no TINYINT,
  month_label VARCHAR(128),
  periods TINYINT,
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
  date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'absent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 14. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_role VARCHAR(50),
  action VARCHAR(255),
  teacher_name VARCHAR(255),
  admin_name VARCHAR(255),
  full_name VARCHAR(255),
  school_name VARCHAR(255),
  class_name VARCHAR(255),
  gps VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Class Status Table
CREATE TABLE IF NOT EXISTS class_status (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'conducted',
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- 16. Teacher Leaves Table
CREATE TABLE IF NOT EXISTS teacher_leaves (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  applied_on DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- 17. Class Recordings Table
CREATE TABLE IF NOT EXISTS class_recordings (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  subject_name VARCHAR(255),
  chapter_name VARCHAR(255),
  record_date DATE,
  duration VARCHAR(50),
  size VARCHAR(50),
  status VARCHAR(50) DEFAULT 'uploaded',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 18. Homework Table
CREATE TABLE IF NOT EXISTS homework (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL,
  subject_name VARCHAR(255),
  chapter_name VARCHAR(255),
  title VARCHAR(255),
  due_date DATE,
  assigned_date DATE,
  submissions INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 19. Study Materials Table
CREATE TABLE IF NOT EXISTS study_materials (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL,
  type VARCHAR(50) DEFAULT 'pdf',
  title VARCHAR(255),
  url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

-- 20. Live Sessions Table
CREATE TABLE IF NOT EXISTS live_sessions (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  chapter_id INTEGER,
  topic_id INTEGER,
  topic_name VARCHAR(255),
  start_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  attendance_marked BOOLEAN DEFAULT FALSE,
  quiz_submitted BOOLEAN DEFAULT FALSE,
  recording_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- 21. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. Chapter Syllabus Table
CREATE TABLE IF NOT EXISTS chapter_syllabus (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  grade TINYINT,
  month_label VARCHAR(128),
  week_label VARCHAR(128),
  periods TINYINT,
  teaching_plan TEXT,
  is_current_week BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- 23. Teacher Effectiveness Table
CREATE TABLE IF NOT EXISTS teacher_effectiveness (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL,
  school_id INTEGER NOT NULL,
  rating DECIMAL(5,2) DEFAULT 0,
  lesson_completion_rate DECIMAL(5,2) DEFAULT 0,
  student_engagement DECIMAL(5,2) DEFAULT 0,
  quiz_avg_score DECIMAL(5,2) DEFAULT 0,
  classes_completed INTEGER DEFAULT 0,
  total_scheduled INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- Create indexes for common queries
CREATE INDEX idx_schools_code ON schools(code);
CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_classes_grade ON classes(grade);
CREATE INDEX idx_chapters_subject ON chapters(subject_id);
CREATE INDEX idx_chapters_grade ON chapters(grade);
CREATE INDEX idx_topics_chapter ON topics(chapter_id);
CREATE INDEX idx_teachers_school ON teachers(school_id);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_quiz_results_student ON quiz_results(student_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX idx_class_status_date ON class_status(date);
CREATE INDEX idx_chapter_syllabus_current ON chapter_syllabus(is_current_week);
