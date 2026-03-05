-- ============================================================================
-- MATERIALS MANAGEMENT DATABASE SCHEMA
-- Enhanced schema for comprehensive materials management
-- Includes textbooks, study materials, assignments, and resources
-- ============================================================================

-- 1. MATERIALS TABLE - Main table for all learning materials
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  material_type VARCHAR(50) NOT NULL, -- 'textbook', 'ppt', 'video', 'pdf', 'worksheet', 'example', 'ref_link', 'youtube'
  category VARCHAR(100) NOT NULL, -- 'textbook_chapter', 'teaching_resource', 'study_guide', 'sample_problem', 'assessment', 'reference'
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(100),
  duration INTEGER, -- in seconds for videos
  youtube_link TEXT, -- for YouTube video recommendations
  external_link TEXT, -- for reference links
  grade_level SMALLINT,
  difficulty_level VARCHAR(50), -- 'basic', 'intermediate', 'advanced'
  is_published BOOLEAN DEFAULT FALSE,
  is_sharedacross_schools BOOLEAN DEFAULT FALSE,
  upload_by INTEGER REFERENCES admins(id),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materials_subject ON materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_chapter ON materials(chapter_id);
CREATE INDEX IF NOT EXISTS idx_materials_topic ON materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_school ON materials(school_id);

-- 2. MATERIAL ATTACHMENTS TABLE - For multiple files per material
CREATE TABLE IF NOT EXISTS material_attachments (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  attachment_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_material_attachments_material ON material_attachments(material_id);

-- 3. TEXTBOOK MAPPINGS TABLE - Link textbook chapters to topics
CREATE TABLE IF NOT EXISTS textbook_mappings (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  textbook_name VARCHAR(255), -- e.g., "TGSCERT Class 6 Mathematics"
  textbook_version VARCHAR(100),
  chapter_name VARCHAR(255),
  page_numbers VARCHAR(100), -- e.g., "45-67"
  tgscert_reference VARCHAR(255), -- TGSCERT standard reference
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_textbook_mappings_material ON textbook_mappings(material_id);

-- 4. MATERIAL ACCESS TABLE - Track who has access to materials
CREATE TABLE IF NOT EXISTS material_access (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  access_type VARCHAR(50) DEFAULT 'view', -- 'view', 'edit', 'share'
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_material_access_material ON material_access(material_id);
CREATE INDEX IF NOT EXISTS idx_material_access_teacher ON material_access(teacher_id);
CREATE INDEX IF NOT EXISTS idx_material_access_class ON material_access(class_id);

-- 5. TEACHER MATERIAL ASSIGNMENTS TABLE - Track what materials teacher assigns to classes
CREATE TABLE IF NOT EXISTS teacher_material_assignments (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  due_date DATE,
  optional BOOLEAN DEFAULT FALSE,
  assignment_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teacher_material_assignments_teacher ON teacher_material_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_material_assignments_material ON teacher_material_assignments(material_id);
CREATE INDEX IF NOT EXISTS idx_teacher_material_assignments_class ON teacher_material_assignments(class_id);

-- 6. STUDENT MATERIAL ACCESS TABLE - Track student interactions with materials
CREATE TABLE IF NOT EXISTS student_material_access (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_viewed INTEGER, -- in seconds
  completed BOOLEAN DEFAULT FALSE,
  completion_percentage INTEGER DEFAULT 0,
  last_accessed TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_material_access_student ON student_material_access(student_id);
CREATE INDEX IF NOT EXISTS idx_student_material_access_material ON student_material_access(material_id);

-- 7. MATERIAL TAGS TABLE - For flexible categorization
CREATE TABLE IF NOT EXISTS material_tags (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_material_tags_material ON material_tags(material_id);
CREATE INDEX IF NOT EXISTS idx_material_tags_name ON material_tags(tag_name);

-- 8. MATERIAL RATINGS TABLE - Student feedback on materials
CREATE TABLE IF NOT EXISTS material_ratings (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(material_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_material_ratings_material ON material_ratings(material_id);
CREATE INDEX IF NOT EXISTS idx_material_ratings_student ON material_ratings(student_id);

-- 9. YOUTUBE RECOMMENDATIONS TABLE - Store recommended YouTube videos
CREATE TABLE IF NOT EXISTS youtube_recommendations (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  youtube_title VARCHAR(255) NOT NULL,
  youtube_url TEXT NOT NULL,
  youtube_video_id VARCHAR(20),
  description TEXT,
  duration INTEGER, -- in seconds
  channel_name VARCHAR(255),
  added_by INTEGER REFERENCES admins(id),
  is_curated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_youtube_recommendations_topic ON youtube_recommendations(topic_id);
CREATE INDEX IF NOT EXISTS idx_youtube_recommendations_chapter ON youtube_recommendations(chapter_id);

-- 10. MATERIAL DOWNLOAD LOGS TABLE - Track downloads for analytics
CREATE TABLE IF NOT EXISTS material_download_logs (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_type VARCHAR(50) -- 'desktop', 'tablet', 'mobile'
);

CREATE INDEX IF NOT EXISTS idx_material_download_logs_material ON material_download_logs(material_id);
CREATE INDEX IF NOT EXISTS idx_material_download_logs_teacher ON material_download_logs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_material_download_logs_student ON material_download_logs(student_id);

-- ============================================================================
-- VIEWS FOR EASIER QUERYING
-- ============================================================================

-- View: Get materials with user counts
CREATE OR REPLACE VIEW material_stats AS
SELECT 
  m.id,
  m.title,
  m.material_type,
  m.category,
  COUNT(DISTINCT sma.student_id) as student_count,
  COUNT(DISTINCT tma.teacher_id) as teacher_count,
  m.view_count,
  m.created_at
FROM materials m
LEFT JOIN student_material_access sma ON m.id = sma.material_id
LEFT JOIN teacher_material_assignments tma ON m.id = tma.material_id
GROUP BY m.id, m.title, m.material_type, m.category, m.view_count, m.created_at;

-- View: Get materials by class
CREATE OR REPLACE VIEW class_materials AS
SELECT DISTINCT
  m.id,
  m.title,
  m.material_type,
  m.category,
  c.id as class_id,
  c.name as class_name,
  t.id as teacher_id,
  t.full_name as teacher_name
FROM materials m
JOIN teacher_material_assignments tma ON m.id = tma.material_id
JOIN classes c ON tma.class_id = c.id
JOIN teachers t ON tma.teacher_id = t.id;

-- ============================================================================
-- NOTES:
-- - Materials can be linked to subjects, chapters, and topics
-- - Each material can have multiple attachments
-- - Materials can be assigned to specific classes by teachers
-- - Students' material access is tracked for analytics
-- - YouTube recommendations are curated per topic/chapter
-- - Material ratings provide feedback for continuous improvement
-- ============================================================================
