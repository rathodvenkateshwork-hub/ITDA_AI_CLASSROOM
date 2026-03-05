-- ============================================================================
-- VECTOR DB & RAG INTEGRATION SCHEMA
-- For intelligent material chunking, embedding, and retrieval
-- ============================================================================

-- Enable pgvector extension (required for vector type)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. MATERIAL CHUNKS TABLE - Store chunked material content
CREATE TABLE IF NOT EXISTS material_chunks (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  chunk_number INTEGER NOT NULL, -- Sequential chunk number
  chunk_text TEXT NOT NULL, -- The actual text content
  chunk_metadata JSONB, -- Additional metadata (page numbers, section, etc.)
  embedding vector(1536), -- OpenAI embedding (1536 dimensions)
  token_count INTEGER, -- Number of tokens in chunk
  embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_material_chunks_material ON material_chunks(material_id);
CREATE INDEX IF NOT EXISTS idx_material_chunks_chapter ON material_chunks(chapter_id);
CREATE INDEX IF NOT EXISTS idx_material_chunks_topic ON material_chunks(topic_id);
-- Note: ivfflat index requires rows to exist first; create after inserting data
-- CREATE INDEX IF NOT EXISTS idx_material_chunks_embedding ON material_chunks USING ivfflat (embedding vector_cosine_ops);

-- 2. CHAPTER SESSIONS TABLE - Divide chapters into teaching sessions
CREATE TABLE IF NOT EXISTS chapter_sessions (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  total_sessions INTEGER NOT NULL, -- Total sessions for this chapter
  title VARCHAR(255), -- Session title
  description TEXT,
  estimated_duration INTEGER, -- in minutes
  learning_objectives TEXT[], -- Array of learning goals
  session_chunks JSONB, -- Array of chunk_ids included in this session
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chapter_sessions_chapter ON chapter_sessions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_sessions_subject ON chapter_sessions(subject_id);

-- 3. AUTOMATIC ASSIGNMENT RULES TABLE
CREATE TABLE IF NOT EXISTS assignment_rules (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'class_subject', 'grade_subject', 'custom'
  school_id INTEGER REFERENCES schools(id),
  class_id INTEGER REFERENCES classes(id),
  subject_id INTEGER REFERENCES subjects(id),
  grade_level SMALLINT,
  material_category VARCHAR(100),
  material_type VARCHAR(50),
  auto_assign BOOLEAN DEFAULT TRUE,
  assignment_date_offset INTEGER DEFAULT 0, -- days from material creation
  due_date_offset INTEGER DEFAULT 7, -- days from assignment
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignment_rules_class ON assignment_rules(class_id);
CREATE INDEX IF NOT EXISTS idx_assignment_rules_subject ON assignment_rules(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignment_rules_active ON assignment_rules(is_active);

-- 4. AUTOMATIC ASSIGNMENTS LOG TABLE
CREATE TABLE IF NOT EXISTS automatic_assignments (
  id SERIAL PRIMARY KEY,
  assignment_rule_id INTEGER NOT NULL REFERENCES assignment_rules(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived', 'removed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automatic_assignments_rule ON automatic_assignments(assignment_rule_id);
CREATE INDEX IF NOT EXISTS idx_automatic_assignments_material ON automatic_assignments(material_id);
CREATE INDEX IF NOT EXISTS idx_automatic_assignments_teacher ON automatic_assignments(teacher_id);

-- 5. INTERACTIVE SESSION TABLE - Track teacher-student interactive sessions
CREATE TABLE IF NOT EXISTS interactive_teaching_sessions (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  chapter_session_id INTEGER REFERENCES chapter_sessions(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  session_type VARCHAR(50) NOT NULL, -- 'ppt_generation', 'quiz_generation', 'summary', 'youtube_recommendation', 'interactive_lesson'
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  student_count INTEGER,
  interactive_content JSONB, -- Generated content (PPT, quiz, etc.)
  context_embeddings_retrieved INTEGER DEFAULT 0,
  ai_model_used VARCHAR(100), -- 'gpt-4', 'gpt-3.5-turbo', etc.
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'archived'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interactive_sessions_teacher ON interactive_teaching_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_interactive_sessions_class ON interactive_teaching_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_interactive_sessions_date ON interactive_teaching_sessions(session_date);

-- 6. SESSION ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS session_analytics (
  id SERIAL PRIMARY KEY,
  interactive_session_id INTEGER NOT NULL REFERENCES interactive_teaching_sessions(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50), -- 'view', 'click', 'answer', 'comment'
  interaction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  interaction_data JSONB,
  engagement_score NUMERIC(3,2) -- 0-1 scale
);

CREATE INDEX IF NOT EXISTS idx_session_analytics_session ON session_analytics(interactive_session_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_student ON session_analytics(student_id);

-- 7. GENERATED CONTENT CACHE TABLE - Cache generated PPTs, quizzes, etc.
CREATE TABLE IF NOT EXISTS generated_content_cache (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL, -- 'ppt', 'quiz', 'summary', 'worksheet'
  class_id INTEGER REFERENCES classes(id),
  chapter_session_id INTEGER REFERENCES chapter_sessions(id),
  subject_id INTEGER REFERENCES subjects(id),
  content_url TEXT, -- URL to generated content
  content_file_name VARCHAR(255),
  content_metadata JSONB, -- Slides count for PPT, questions count for quiz, etc.
  generation_prompt TEXT, -- The prompt used to generate
  ai_model_used VARCHAR(100),
  generation_time_seconds INTEGER,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  cache_valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content_cache(content_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_class ON generated_content_cache(class_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_chapter_session ON generated_content_cache(chapter_session_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_cache_lookup ON generated_content_cache(content_type, class_id, subject_id, chapter_session_id, cache_valid_until);

-- 8. EMBEDDING JOB QUEUE TABLE - Track chunking and embedding progress
CREATE TABLE IF NOT EXISTS embedding_jobs (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL, -- 'chunk', 'embed', 'session_division'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  total_chunks INTEGER,
  processed_chunks INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_embedding_jobs_material ON embedding_jobs(material_id);
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_status ON embedding_jobs(status);

-- 9. RAG RETRIEVAL LOG TABLE - Track what was retrieved and used
CREATE TABLE IF NOT EXISTS rag_retrieval_log (
  id SERIAL PRIMARY KEY,
  interactive_session_id INTEGER REFERENCES interactive_teaching_sessions(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL, -- The search query
  query_embedding vector(1536),
  retrieved_chunks JSONB, -- Array of chunk IDs retrieved
  relevance_scores JSONB, -- Cosine similarity scores
  chunk_count INTEGER, -- Number of chunks retrieved
  retrieval_time_ms INTEGER, -- Time taken to retrieve
  used_for_generation BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rag_retrieval_session ON rag_retrieval_log(interactive_session_id);

-- 10. TEACHER-CLASS-SUBJECT MAPPING TABLE (Enhanced)
CREATE TABLE IF NOT EXISTS teacher_class_subject_mapping (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE, -- Primary subject for this class
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_class_subject ON teacher_class_subject_mapping(teacher_id, class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_subject_class ON teacher_class_subject_mapping(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_subject_subject ON teacher_class_subject_mapping(subject_id);

-- ============================================================================
-- VIEWS FOR RAG & INTERACTIVE TEACHING
-- ============================================================================

-- View: Get all teachers for a specific class and subject
CREATE OR REPLACE VIEW teachers_for_class_subject AS
SELECT DISTINCT
  t.id as teacher_id,
  t.full_name,
  t.email,
  c.id as class_id,
  c.name as class_name,
  s.id as subject_id,
  s.name as subject_name,
  tcm.is_primary
FROM teachers t
JOIN teacher_class_subject_mapping tcm ON t.id = tcm.teacher_id
JOIN classes c ON tcm.class_id = c.id
JOIN subjects s ON tcm.subject_id = s.id
WHERE tcm.end_date IS NULL OR tcm.end_date >= CURRENT_DATE;

-- View: Get all chunks for a chapter session
CREATE OR REPLACE VIEW chapter_session_chunks AS
SELECT
  cs.id as session_id,
  cs.chapter_id,
  cs.session_number,
  cs.title,
  c.id as chunk_id,
  c.chunk_number,
  c.chunk_text,
  c.token_count,
  cs.learning_objectives
FROM chapter_sessions cs
JOIN LATERAL jsonb_array_elements(cs.session_chunks) AS chunk_refs ON true
JOIN material_chunks c ON c.id = cast(chunk_refs->>'chunk_id' as integer)
ORDER BY cs.session_number, c.chunk_number;

-- View: Get most recent interactive session per class per day
CREATE OR REPLACE VIEW recent_sessions_by_class AS
SELECT DISTINCT ON (class_id, session_date)
  id,
  teacher_id,
  class_id,
  subject_id,
  chapter_id,
  session_date,
  session_type,
  duration_minutes,
  student_count
FROM interactive_teaching_sessions
WHERE status = 'active'
ORDER BY class_id, session_date DESC, created_at DESC;

-- ============================================================================
-- DATABASE FUNCTIONS FOR AUTOMATIC OPERATIONS
-- ============================================================================

-- Function: Create chapter sessions (split chapter into N sessions)
CREATE OR REPLACE FUNCTION create_chapter_sessions(
  p_chapter_id INTEGER,
  p_subject_id INTEGER,
  p_num_sessions INTEGER
)
RETURNS TABLE (session_id INTEGER, session_number INTEGER, title VARCHAR) AS $$
DECLARE
  v_chapter_name VARCHAR;
  v_chunk_count INTEGER;
  v_chunks_per_session INTEGER;
  v_i INTEGER;
BEGIN
  -- Get chapter name
  SELECT name INTO v_chapter_name FROM chapters WHERE id = p_chapter_id;
  
  -- Get total chunks for this chapter
  SELECT COUNT(*) INTO v_chunk_count FROM material_chunks WHERE chapter_id = p_chapter_id;
  
  -- Calculate chunks per session
  v_chunks_per_session := CEILING(CAST(v_chunk_count AS DECIMAL) / p_num_sessions);
  
  -- Create sessions
  FOR v_i IN 1..p_num_sessions LOOP
    INSERT INTO chapter_sessions (
      chapter_id,
      subject_id,
      session_number,
      total_sessions,
      title,
      session_chunks
    ) VALUES (
      p_chapter_id,
      p_subject_id,
      v_i,
      p_num_sessions,
      v_chapter_name || ' - Session ' || v_i,
      '[]'::jsonb
    )
    RETURNING id, session_number, title;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-assign materials based on rules
CREATE OR REPLACE FUNCTION auto_assign_materials_for_rule(
  p_rule_id INTEGER
)
RETURNS TABLE (assignment_count INTEGER) AS $$
DECLARE
  v_rule RECORD;
  v_material_id INTEGER;
  v_teacher_id INTEGER;
  v_assignment_count INTEGER := 0;
BEGIN
  -- Get rule details
  SELECT * INTO v_rule FROM assignment_rules WHERE id = p_rule_id AND is_active = TRUE;
  
  IF v_rule IS NULL THEN
    RETURN QUERY SELECT 0::INTEGER;
    RETURN;
  END IF;
  
  -- Get matching teachers
  FOR v_teacher_id IN
    SELECT teacher_id FROM teacher_class_subject_mapping
    WHERE class_id = v_rule.class_id AND subject_id = v_rule.subject_id
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  LOOP
    -- Get matching materials
    FOR v_material_id IN
      SELECT id FROM materials
      WHERE subject_id = v_rule.subject_id
        AND category = v_rule.material_category
        AND (v_rule.material_type IS NULL OR material_type = v_rule.material_type)
        AND is_published = TRUE
    LOOP
      -- Insert assignment
      INSERT INTO teacher_material_assignments (
        teacher_id,
        material_id,
        class_id,
        assigned_date,
        due_date
      ) VALUES (
        v_teacher_id,
        v_material_id,
        v_rule.class_id,
        CURRENT_DATE + (v_rule.assignment_date_offset || ' days')::INTERVAL,
        CURRENT_DATE + ((v_rule.assignment_date_offset + v_rule.due_date_offset) || ' days')::INTERVAL
      )
      ON CONFLICT DO NOTHING;
      
      v_assignment_count := v_assignment_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN QUERY SELECT v_assignment_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get relevant chunks for class and subject (RAG retrieval)
CREATE OR REPLACE FUNCTION get_relevant_chunks_for_context(
  p_class_id INTEGER,
  p_subject_id INTEGER,
  p_chapter_id INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  chunk_id INTEGER,
  chunk_text TEXT,
  material_id INTEGER,
  relevance_score NUMERIC,
  chapter_name VARCHAR,
  topic_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.chunk_text,
    mc.material_id,
    1.0::NUMERIC as relevance_score,
    ch.name,
    t.name
  FROM material_chunks mc
  JOIN materials m ON mc.material_id = m.id
  JOIN chapters ch ON mc.chapter_id = ch.id
  LEFT JOIN topics t ON mc.topic_id = t.id
  WHERE m.subject_id = p_subject_id
    AND (p_chapter_id IS NULL OR mc.chapter_id = p_chapter_id)
    AND m.is_published = TRUE
  ORDER BY mc.chunk_number
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NOTES:
-- - Embeddings stored in vector column (requires pgvector extension)
-- - Automatic assignment rules enable one-step material distribution
-- - Chapter sessions divide materials into teaching units
-- - RAG pipeline supports intelligent content generation
-- - Interactive sessions track real-time teaching analytics
-- ============================================================================
