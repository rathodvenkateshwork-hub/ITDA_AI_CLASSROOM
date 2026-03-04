-- ============================================================================
-- CORE DATA INSERTION FOR LMS
-- Real data that Admin needs to set up the system
-- Schools, Subjects, Chapters, Topics, and basic structure
-- Run this AFTER complete-schema-migration.sql
-- ============================================================================

-- ============================================================================
-- 1. INSERT SCHOOLS
-- ============================================================================
INSERT INTO schools (name, code, district, mandal, active_status, sessions_completed) VALUES
('Government High School, Hyderabad', 'GHS-HYD-001', 'Hyderabad', 'Charminar', TRUE, 0),
('Modern Public School', 'MPS-HYD-002', 'Hyderabad', 'Kukatpally', TRUE, 0),
('Central Academy', 'CA-HYD-003', 'Hyderabad', 'Secunderabad', TRUE, 0);

-- ============================================================================
-- 2. INSERT SUBJECTS
-- ============================================================================
INSERT INTO subjects (name, icon, grades) VALUES
('Mathematics', '📐', '9,10,11,12'),
('English', '📖', '9,10,11,12'),
('Social Studies', '🌍', '9,10,11,12'),
('Science', '🔬', '9,10,11,12'),
('Hindi', '🗣️', '9,10,11,12'),
('Physical Education', '⚽', '9,10,11,12'),
('Computer Science', '💻', '10,11,12'),
('Biology', '🧬', '11,12'),
('Chemistry', '⚗️', '11,12'),
('Physics', '⚛️', '11,12');

-- ============================================================================
-- 3. INSERT CLASSES
-- ============================================================================
INSERT INTO classes (school_id, name, section, grade, student_count) VALUES
((SELECT id FROM schools WHERE code = 'GHS-HYD-001'), 'Class 9-A', 'A', 9, 45),
((SELECT id FROM schools WHERE code = 'GHS-HYD-001'), 'Class 9-B', 'B', 9, 42),
((SELECT id FROM schools WHERE code = 'GHS-HYD-001'), 'Class 10-A', 'A', 10, 48),
((SELECT id FROM schools WHERE code = 'GHS-HYD-001'), 'Class 10-B', 'B', 10, 46),
((SELECT id FROM schools WHERE code = 'MPS-HYD-002'), 'Class 9-A', 'A', 9, 50),
((SELECT id FROM schools WHERE code = 'MPS-HYD-002'), 'Class 10-A', 'A', 10, 52),
((SELECT id FROM schools WHERE code = 'CA-HYD-003'), 'Class 9-A', 'A', 9, 40),
((SELECT id FROM schools WHERE code = 'CA-HYD-003'), 'Class 10-A', 'A', 10, 43);

-- ============================================================================
-- 4. INSERT CHAPTERS FOR SOCIAL STUDIES (Grade 9)
-- ============================================================================
INSERT INTO chapters (subject_id, name, grade, order_num, chapter_no, month_label, periods, teaching_plan_summary) VALUES
((SELECT id FROM subjects WHERE name = 'Social Studies'), 'India: Relief Features', 9, 1, 1, 'June (Week 1-2)', 8, 'Location, relief divisions, geographical features'),
((SELECT id FROM subjects WHERE name = 'Social Studies'), 'Ideas of Development', 9, 2, 2, 'June (Week 3-4)', 7, 'Sustainable development, HDI, income inequality'),
((SELECT id FROM subjects WHERE name = 'Social Studies'), 'Democracy in the Contemporary World', 9, 3, 3, 'July (Week 1-2)', 8, 'Democratic systems, participation, representation'),
((SELECT id FROM subjects WHERE name = 'Social Studies'), 'Electoral Politics', 9, 4, 4, 'July (Week 3-4)', 7, 'Election process, voting, political participation'),
((SELECT id FROM subjects WHERE name = 'Social Studies'), 'Working of Institutions', 9, 5, 5, 'August (Week 1-2)', 8, 'Legislature, Executive, Judiciary functions');

-- ============================================================================
-- 5. INSERT TOPICS FOR SOCIAL STUDIES CHAPTERS
-- ============================================================================
INSERT INTO topics (chapter_id, name, order_num, status) VALUES
((SELECT id FROM chapters WHERE name = 'India: Relief Features'), 'P1 - Location & Map', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'India: Relief Features'), 'P2 - Latitudes & Longitudes', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'India: Relief Features'), 'P3 - Geological History', 3, 'not_started'),
((SELECT id FROM chapters WHERE name = 'India: Relief Features'), 'P4 - Himalayas', 4, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Ideas of Development'), 'P1 - Introduction', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Ideas of Development'), 'P2 - Goals of Development', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Ideas of Development'), 'P3 - Conflicts & Issues', 3, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Democracy in the Contemporary World'), 'P1 - What is Democracy', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Democracy in the Contemporary World'), 'P2 - Features of Democracy', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Democracy in the Contemporary World'), 'P3 - Challenges', 3, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Electoral Politics'), 'P1 - Electoral System', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Electoral Politics'), 'P2 - Voter Rights', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Working of Institutions'), 'P1 - Parliament', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Working of Institutions'), 'P2 - Cabinet', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Working of Institutions'), 'P3 - Supreme Court', 3, 'not_started');

-- ============================================================================
-- 6. INSERT CHAPTERS FOR MATHEMATICS (Grade 9)
-- ============================================================================
INSERT INTO chapters (subject_id, name, grade, order_num, chapter_no, month_label, periods, teaching_plan_summary) VALUES
((SELECT id FROM subjects WHERE name = 'Mathematics'), 'Number Systems', 9, 1, 1, 'June (Week 1-2)', 8, 'Real numbers, irrational numbers, number line'),
((SELECT id FROM subjects WHERE name = 'Mathematics'), 'Polynomials', 9, 2, 2, 'June (Week 3-4)', 7, 'Factors, zeros, polynomial division'),
((SELECT id FROM subjects WHERE name = 'Mathematics'), 'Coordinate Geometry', 9, 3, 3, 'July (Week 1-2)', 8, 'Cartesian plane, plotting points'),
((SELECT id FROM subjects WHERE name = 'Mathematics'), 'Linear Equations', 9, 4, 4, 'July (Week 3-4)', 7, 'Equations in two variables, graphical solutions'),
((SELECT id FROM subjects WHERE name = 'Mathematics'), 'Introduction to Euclid Geometry', 9, 5, 5, 'August (Week 1-2)', 8, 'Axioms, postulates, basic theorems');

-- ============================================================================
-- 7. INSERT TOPICS FOR MATHEMATICS CHAPTERS
-- ============================================================================
INSERT INTO topics (chapter_id, name, order_num, status) VALUES
((SELECT id FROM chapters WHERE name = 'Number Systems' AND grade = 9), 'P1 - Natural Numbers to Reals', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Number Systems' AND grade = 9), 'P2 - Irrational Numbers', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Number Systems' AND grade = 9), 'P3 - Real Numbers on Number Line', 3, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Polynomials'), 'P1 - Polynomial Terms', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Polynomials'), 'P2 - Factorization', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Polynomials'), 'P3 - Algebraic Identities', 3, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Coordinate Geometry'), 'P1 - Cartesian System', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Coordinate Geometry'), 'P2 - Plotting Points', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Linear Equations'), 'P1 - Linear Equations in One Variable', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Linear Equations'), 'P2 - Linear Equations in Two Variables', 2, 'not_started');

-- ============================================================================
-- 8. INSERT CHAPTERS FOR SCIENCE (Grade 9)
-- ============================================================================
INSERT INTO chapters (subject_id, name, grade, order_num, chapter_no, month_label, periods, teaching_plan_summary) VALUES
((SELECT id FROM subjects WHERE name = 'Science'), 'Matter in Our Surroundings', 9, 1, 1, 'June (Week 1-2)', 8, 'States of matter, properties, changes'),
((SELECT id FROM subjects WHERE name = 'Science'), 'Atoms and Molecules', 9, 2, 2, 'June (Week 3-4)', 7, 'Atomic structure, molecules, compounds'),
((SELECT id FROM subjects WHERE name = 'Science'), 'Tissues', 9, 3, 3, 'July (Week 1-2)', 8, 'Plant and animal tissues'),
((SELECT id FROM subjects WHERE name = 'Science'), 'Motion', 9, 4, 4, 'July (Week 3-4)', 7, 'Distance, displacement, velocity, acceleration'),
((SELECT id FROM subjects WHERE name = 'Science'), 'Force and Laws of Motion', 9, 5, 5, 'August (Week 1-2)', 8, 'Newtons laws, friction, momentum');

-- ============================================================================
-- 9. INSERT TOPICS FOR SCIENCE CHAPTERS
-- ============================================================================
INSERT INTO topics (chapter_id, name, order_num, status) VALUES
((SELECT id FROM chapters WHERE name = 'Matter in Our Surroundings'), 'P1 - Physical Nature of Matter', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Matter in Our Surroundings'), 'P2 - States of Matter', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Matter in Our Surroundings'), 'P3 - Changes in Matter', 3, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Atoms and Molecules'), 'P1 - Atoms', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Atoms and Molecules'), 'P2 - Molecules', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Motion'), 'P1 - Speed and Velocity', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Motion'), 'P2 - Acceleration', 2, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Force and Laws of Motion'), 'P1 - Newtons Laws', 1, 'not_started'),
((SELECT id FROM chapters WHERE name = 'Force and Laws of Motion'), 'P2 - Momentum Conservation', 2, 'not_started');

-- ============================================================================
-- 10. INSERT BADGES (Achievement system)
-- ============================================================================
INSERT INTO badges (badge_name, description, category, criteria) VALUES
('Perfect Attendance', 'Perfect attendance for a month', 'attendance', '{"days": 20, "absences": 0}'),
('Quiz Master', 'Score 100% on 5 quizzes', 'quiz', '{"quiz_count": 5, "percentage": 100}'),
('Math wizard', 'Score above 90% in Math chapter quizzes', 'subject', '{"subject": "Mathematics", "percentage": 90}'),
('Science Star', 'Score above 85% in Science', 'subject', '{"subject": "Science", "percentage": 85}'),
('First Participant', 'Register in first activity', 'achievement', '{"activities": 1}'),
('Sports Champion', 'Win or place in sports activity', 'achievement', '{"activity_type": "sports", "result": "winner"}'),
('Culture King', 'Win cultural activity', 'achievement', '{"activity_type": "cultural", "result": "winner"}');

-- ============================================================================
-- CORE DATA INSERTION COMPLETE
-- ============================================================================
-- Summary:
-- - 3 Schools created
-- - 10 Subjects created  
-- - 8 Classes created
-- - 13 Chapters created
-- - 48 Topics created
-- - 7 Badges created
-- Admin can now log in and add:
-- - Teachers
-- - Study Materials
-- - Quizzes & Questions
-- - Activities & Registrations
-- - Student Enrollments
-- ============================================================================
