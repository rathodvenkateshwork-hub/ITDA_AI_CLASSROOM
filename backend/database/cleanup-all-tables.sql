-- ============================================================================
-- CLEANUP SCRIPT: Drop all portal feature tables (if they exist)
-- Run this BEFORE running the complete-schema-migration.sql
-- This ensures a clean database state
-- ============================================================================

-- Drop all portal feature tables in reverse dependency order
DROP TABLE IF EXISTS teacher_qr_cards CASCADE;
DROP TABLE IF EXISTS student_qr_cards CASCADE;
DROP TABLE IF EXISTS course_completion CASCADE;
DROP TABLE IF EXISTS class_status CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS chapter_progress CASCADE;
DROP TABLE IF EXISTS teacher_subject_assignment CASCADE;
DROP TABLE IF EXISTS student_performance CASCADE;
DROP TABLE IF EXISTS weak_topics CASCADE;
DROP TABLE IF EXISTS activity_registrations CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS student_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS session_attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS quiz_answers CASCADE;
DROP TABLE IF EXISTS quiz_submissions CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS study_materials CASCADE;

-- Also drop base tables to start completely fresh (optional - only if you have no important data)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS topic_materials CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- ============================================================================
-- All tables dropped. Now you can run complete-schema-migration.sql
-- ============================================================================
