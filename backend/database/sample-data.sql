-- SAMPLE DATA FOR TESTING ALL PORTALS

-- 1. SCHOOLS (Sample Data)
INSERT INTO schools (name, code, district, state) VALUES
('Oxford School', 'OXF001', 'Hyderabad', 'Telangana'),
('Delhi Public School', 'DPS001', 'Delhi', 'Delhi'),
('DAV School', 'DAV001', 'Bangalore', 'Karnataka')
ON CONFLICT DO NOTHING;

-- 2. CLASSES (Sample Data)
INSERT INTO classes (name, school_id, teacher_id, academic_year) VALUES
(1, 1, 1, '2025-26'),
(2, 1, 2, '2025-26'),
(3, 2, 3, '2025-26'),
(4, 2, 4, '2025-26')
ON CONFLICT DO NOTHING;

-- 3. SUBJECTS (Sample Data)
INSERT INTO subjects (name, code, school_id) VALUES
('Mathematics', 'MATH101', 1),
('Science', 'SCI101', 1),
('English', 'ENG101', 1),
('Social Studies', 'SS101', 1),
('Hindi', 'HIN101', 1),
('Telugu', 'TEL101', 1)
ON CONFLICT DO NOTHING;

-- 4. CHAPTERS (Sample Data)
INSERT INTO chapters (name, subject_id, academic_year, chapter_number) VALUES
('Algebra Basics', 1, '2025-26', 1),
('Geometry Fundamentals', 1, '2025-26', 2),
('Physics - Motion', 2, '2025-26', 1),
('Chemistry - Elements', 2, '2025-26', 2),
('Grammar Essentials', 3, '2025-26', 1),
('Literature - Poems', 3, '2025-26', 2)
ON CONFLICT DO NOTHING;

-- 5. TOPICS (Sample Data)
INSERT INTO topics (name, chapter_id, topic_number) VALUES
('Linear Equations', 1, 1),
('Quadratic Equations', 1, 2),
('Triangles and Angles', 2, 1),
('Circles', 2, 2),
('Newton\'s Laws of Motion', 3, 1),
('Velocity and Acceleration', 3, 2)
ON CONFLICT DO NOTHING;

-- 6. STUDY MATERIALS (Sample Data - PPTs, Notes, Videos)
INSERT INTO study_materials (chapter_id, topic_id, title, type, content_url, description, duration, created_by) VALUES
(1, 1, 'Linear Equations Explained', 'ppt', 'https://example.com/ppts/linear_equations.ppt', 'Comprehensive PPT on linear equations', NULL, 1),
(1, 1, 'Linear Equations Notes', 'notes', 'https://example.com/notes/linear_equations.pdf', 'Detailed notes with examples', NULL, 1),
(1, 1, 'Linear Equations Video', 'video', 'https://www.youtube.com/embed/dQnUH3e5m2o', 'Educational video on linear equations', 600, 1),
(1, 2, 'Quadratic Equations PPT', 'ppt', 'https://example.com/ppts/quadratic.ppt', 'Quadratic equations explained', NULL, 1),
(2, 3, 'Triangles Geometry', 'ppt', 'https://example.com/ppts/triangles.ppt', 'Triangle properties and theorems', NULL, 2),
(2, 3, 'Triangle Simulation', 'simulation', 'https://example.com/sim/triangles', 'Interactive triangle solver', NULL, 2)
ON CONFLICT DO NOTHING;

-- 7. QUIZZES (Sample Data)
INSERT INTO quizzes (name, subject_id, class_id, chapter_id, total_marks, duration, passing_marks, created_by, academic_year) VALUES
('Linear Equations Quiz', 1, 1, 1, 30, 20, 15, 1, '2025-26'),
('Quadratic Equations Quiz', 1, 1, 1, 25, 20, 12, 1, '2025-26'),
('Motion Quiz', 2, 1, 3, 30, 25, 15, 2, '2025-26')
ON CONFLICT DO NOTHING;

-- 8. QUIZ QUESTIONS (Sample Data)
INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, marks, explanation) VALUES
(1, 'What is the solution to 2x + 5 = 13?', 'multiple_choice', 
 '[{"text": "x = 2", "index": 0}, {"text": "x = 4", "index": 1}, {"text": "x = 6", "index": 2}, {"text": "x = 8", "index": 3}]',
 '1', 5, 'Solving: 2x = 13 - 5 = 8, so x = 4'),
(1, 'Solve: 3x - 7 = 2', 'multiple_choice',
 '[{"text": "x = 1", "index": 0}, {"text": "x = 3", "index": 1}, {"text": "x = 5", "index": 2}, {"text": "x = 7", "index": 3}]',
 '1', 5, 'Solving: 3x = 2 + 7 = 9, so x = 3'),
(1, 'What is 4x + 2 = 18?', 'multiple_choice',
 '[{"text": "x = 2", "index": 0}, {"text": "x = 4", "index": 1}, {"text": "x = 6", "index": 2}, {"text": "x = 8", "index": 3}]',
 '1', 5, 'Solving: 4x = 18 - 2 = 16, so x = 4');

-- 9. BADGES (Sample Data)
INSERT INTO badges (badge_name, description, icon_url, category, criteria) VALUES
('Perfect Attendance', 'Earned for 100% attendance in a month', 'https://example.com/badges/attendance.png', 'attendance',
 '{"attendance_percentage": 100, "period": "monthly"}'),
('Quiz Master', 'Earned for scoring above 90% in all quizzes', 'https://example.com/badges/quiz_master.png', 'quiz',
 '{"average_score": 90, "quizzes_completed": 5}'),
('Math Champion', 'Earned for highest score in Mathematics', 'https://example.com/badges/math_champion.png', 'subject',
 '{"subject": "Mathematics", "rank": 1}'),
('Science Wizard', 'Earned for high performance in Science', 'https://example.com/badges/science_wizard.png', 'subject',
 '{"subject": "Science", "average_score": 85}'),
('Consistent Performer', 'Earned for consistent good performance', 'https://example.com/badges/consistent.png', 'achievement',
 '{"average_score": 75, "consecutive_months": 3}')
ON CONFLICT DO NOTHING;

-- 10. STUDENT PERFORMANCE (Sample Performance Data)
INSERT INTO student_performance (student_id, subject_id, total_quizzes_taken, average_score, rank_in_class, overall_percentage) VALUES
(1, 1, 5, 85.5, 2, 85.50),
(1, 2, 3, 78.0, 3, 78.00),
(2, 1, 4, 92.0, 1, 92.00),
(2, 2, 2, 88.5, 1, 88.50),
(3, 1, 6, 70.0, 5, 70.00),
(3, 2, 4, 75.5, 4, 75.50)
ON CONFLICT DO NOTHING;

-- 11. SESSIONS (Sample Live Sessions)
INSERT INTO sessions (teacher_id, class_id, subject_id, topic_id, session_date, session_time, duration, status, attendance_marked) VALUES
(1, 1, 1, 1, '2025-03-05', '10:00:00', 45, 'completed', true),
(1, 1, 1, 2, '2025-03-06', '10:00:00', 45, 'completed', true),
(2, 1, 2, 3, '2025-03-05', '11:00:00', 50, 'completed', true),
(1, 1, 1, 1, '2025-03-10', '10:00:00', 45, 'scheduled', false)
ON CONFLICT DO NOTHING;

-- 12. ACTIVITIES (Sample Activities/Competitions)
INSERT INTO activities (activity_name, school_id, category, event_date, event_time, location, address, description, max_participants, status, created_by) VALUES
('Mathematics Olympiad 2025', 1, 'academic', '2025-04-15', '10:00:00', 'School Auditorium', 'Oxford School, Hyderabad', 'Annual math competition for all classes', 100, 'upcoming', 1),
('Science Fair 2025', 1, 'academic', '2025-05-10', '09:00:00', 'School Ground', 'Oxford School, Hyderabad', 'Innovation and science exhibition', 150, 'upcoming', 1),
('Inter-School Sports Meet', 1, 'sports', '2025-03-20', '08:00:00', 'Sports Stadium', 'Gachibowli Stadium, Hyderabad', 'Annual sports competition', 200, 'upcoming', 2),
('Cultural Festival 2025', 1, 'cultural', '2025-03-25', '18:00:00', 'School Auditorium', 'Oxford School, Hyderabad', 'Dance, music, and cultural events', 80, 'upcoming', 1)
ON CONFLICT DO NOTHING;

-- 13. WEAK TOPICS (Sample - AI-detected weak areas)
INSERT INTO weak_topics (student_id, topic_id, weakness_score) VALUES
(1, 2, 45.0), -- Student 1 weak in Quadratic Equations
(3, 1, 35.0), -- Student 3 weak in Linear Equations
(3, 2, 40.0), -- Student 3 weak in Quadratic Equations
(2, 5, 50.0)  -- Student 2 weak in Velocity
ON CONFLICT DO NOTHING;

-- 14. TEACHER SUBJECT ASSIGNMENT (Teachers to Classes and Subjects)
INSERT INTO teacher_subject_assignment (teacher_id, class_id, subject_id, academic_year) VALUES
(1, 1, 1, '2025-26'), -- Teacher 1 teaches Math to Class 1
(1, 1, 3, '2025-26'), -- Teacher 1 teaches English to Class 1
(2, 1, 2, '2025-26'), -- Teacher 2 teaches Science to Class 1
(3, 2, 1, '2025-26'), -- Teacher 3 teaches Math to Class 2
(4, 2, 2, '2025-26')  -- Teacher 4 teaches Science to Class 2
ON CONFLICT DO NOTHING;

-- 15. CHAPTER PROGRESS (Syllabus Completion)
INSERT INTO chapter_progress (teacher_id, chapter_id, class_id, sessions_planned, sessions_completed, completion_percentage) VALUES
(1, 1, 1, 5, 4, 80.0),
(1, 2, 1, 4, 2, 50.0),
(2, 3, 1, 6, 5, 83.3),
(2, 4, 1, 5, 3, 60.0)
ON CONFLICT DO NOTHING;

-- 16. QUIZ SUBMISSIONS (Sample Quiz Results)
INSERT INTO quiz_submissions (quiz_id, student_id, total_marks, obtained_marks, percentage, status, attempt_number) VALUES
(1, 1, 30, 26, 86.67, 'graded', 1),
(1, 2, 30, 28, 93.33, 'graded', 1),
(1, 3, 30, 18, 60.00, 'graded', 1),
(2, 1, 25, 22, 88.00, 'graded', 1),
(2, 2, 25, 24, 96.00, 'graded', 1),
(3, 1, 30, 25, 83.33, 'graded', 1)
ON CONFLICT DO NOTHING;

-- 17. CLASS STATUS (Daily Class Tracking)
INSERT INTO class_status (class_id, status_date, status, reason, teacher_id) VALUES
(1, '2025-03-05', 'conducted', 'Regular class', 1),
(1, '2025-03-06', 'conducted', 'Regular class', 1),
(1, '2025-03-07', 'cancelled', 'Teacher on leave', 1),
(1, '2025-03-10', 'conducted', 'Regular class', 1),
(2, '2025-03-05', 'conducted', 'Regular class', 3),
(2, '2025-03-06', 'conducted', 'Regular class', 3)
ON CONFLICT DO NOTHING;

-- 18. STUDENT QR CARDS (Auto-generated QR codes)
-- These would be auto-generated when students are created
-- Assuming they exist for students 1, 2, 3, 4, 5
INSERT INTO student_qr_cards (student_id, qr_code_data, qr_code_image_url) VALUES
(1, 'STU000001', 'https://example.com/qr/student_1.png'),
(2, 'STU000002', 'https://example.com/qr/student_2.png'),
(3, 'STU000003', 'https://example.com/qr/student_3.png'),
(4, 'STU000004', 'https://example.com/qr/student_4.png'),
(5, 'STU000005', 'https://example.com/qr/student_5.png')
ON CONFLICT DO NOTHING;

-- 19. TEACHER QR CARDS
INSERT INTO teacher_qr_cards (teacher_id, qr_code_data, qr_code_image_url) VALUES
(1, 'TCH000001', 'https://example.com/qr/teacher_1.png'),
(2, 'TCH000002', 'https://example.com/qr/teacher_2.png'),
(3, 'TCH000003', 'https://example.com/qr/teacher_3.png'),
(4, 'TCH000004', 'https://example.com/qr/teacher_4.png')
ON CONFLICT DO NOTHING;
