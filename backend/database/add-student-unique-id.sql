-- Add student_unique_id column to students table (Phase 11)
-- Format: TG-<school_id 2 digits>-<student_id 3 digits>
-- Example: TG-01-001

ALTER TABLE students ADD COLUMN student_unique_id VARCHAR(20) NULL DEFAULT NULL UNIQUE;

-- Optional: Add index on student_unique_id for faster lookups
CREATE INDEX idx_students_unique_id ON students(student_unique_id);
