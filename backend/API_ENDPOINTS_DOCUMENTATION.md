# ITDA AI Classroom - 100+ API Endpoints Documentation

## Overview
Complete API specification for Admin, Teacher, and Student portals with all required features.

---

## 1. ADMIN PORTAL ENDPOINTS (40 endpoints)

### 1.1 Admin Authentication & Profile (4 endpoints)
```
POST /api/admin/login
  - Body: { email, password }
  - Response: { token, admin }

POST /api/admin/register
  - Body: { email, password, name, school_id }
  - Response: { admin }

GET /api/admin/profile
  - Headers: Authorization
  - Response: { admin details }

POST /api/admin/logout
  - Headers: Authorization
  - Response: { message: "Logged out" }
```

### 1.2 Dashboard & Analytics (12 endpoints)
```
GET /api/admin/dashboard/stats
  - Response: {
      total_schools, total_teachers, total_students,
      total_quizzes, quiz_completion_rate, live_sessions_count,
      daily_active_students, weak_chapters
    }

GET /api/admin/dashboard/schools-summary
  - Response: [ { school_id, name, teacher_count, student_count, class_count } ]

GET /api/admin/dashboard/teachers-summary
  - Response: [ { teacher_id, name, school, classes_assigned, sessions_conducted } ]

GET /api/admin/dashboard/quiz-completion
  - Query: ?school_id=, ?month=
  - Response: { completion_rate, submitted, pending, average_score }

GET /api/admin/dashboard/live-sessions
  - Response: [ { session_id, teacher, class, date, duration, attendance } ]

GET /api/admin/dashboard/daily-active-students
  - Query: ?date=, ?school_id=
  - Response: { active_count, inactive_count, total }

GET /api/admin/dashboard/weak-chapters
  - Response: [ { chapter_id, name, weak_student_count, average_score } ]

GET /api/admin/dashboard/attendance-summary
  - Query: ?school_id=, ?month=
  - Response: { average_attendance_rate, trends }

GET /api/admin/dashboard/subject-performance
  - Response: [ { subject_id, name, average_score, total_quizzes } ]

GET /api/admin/dashboard/top-students
  - Query: ?school_id=, ?limit=10
  - Response: [ { student, grade, avg_score } ]

GET /api/admin/dashboard/teacher-effectiveness
  - Query: ?school_id=, ?month=
  - Response: [ { teacher, effectiveness_score, performance_metrics } ]

GET /api/admin/dashboard/class-status-overview
  - Query: ?date=
  - Response: { conducted, cancelled, scheduled }
```

### 1.3 Schools Management (8 endpoints)
```
GET /api/admin/schools
  - Query: ?skip=0, ?limit=10, ?search=
  - Response: { total, schools: [ { id, name, code, district, state, classes, teachers, students } ] }

GET /api/admin/schools/:id
  - Response: { school details, classes breakdown, teacher breakdown, student breakdown }

POST /api/admin/schools
  - Body: { name, code, district, state, address, phone, email }
  - Response: { school }

PUT /api/admin/schools/:id
  - Body: { name, code, district, state, address, phone, email }
  - Response: { updated school }

DELETE /api/admin/schools/:id
  - Response: { message: "School deleted" }

GET /api/admin/schools/:id/classes
  - Response: [ { class_id, class_name, teacher, students_count } ]

GET /api/admin/schools/:id/performance-summary
  - Response: { average_score, attendance_rate, quiz_completion }

POST /api/admin/schools/:id/export-report
  - Body: { format: 'csv'|'pdf', report_type: 'comprehensive' }
  - Response: { file_url }
```

### 1.4 Teachers Management (6 endpoints)
```
GET /api/admin/teachers
  - Query: ?school_id=, ?class_id=, ?search=, ?status=active|inactive
  - Response: { total, teachers: [ { id, name, email, school, classes, subjects, performance } ] }

GET /api/admin/teachers/:id
  - Response: { teacher details, assignments, performance metrics, leaves, activity log }

POST /api/admin/teachers
  - Body: { name, email, school_id, phone, qualifications }
  - Response: { teacher, auto_generated_password }

PUT /api/admin/teachers/:id
  - Body: { name, email, phone, qualifications, status }
  - Response: { updated teacher }

POST /api/admin/teachers/:id/assign-class
  - Body: { class_id, subject_id, academic_year }
  - Response: { assignment }

POST /api/admin/teachers/bulk-export
  - Body: { filters: {...} }
  - Response: { csv_file_url }
```

### 1.5 Leave Management (4 endpoints)
```
GET /api/admin/leaves
  - Query: ?teacher_id=, ?status=pending|approved|rejected, ?from_date=, ?to_date=
  - Response: { total, leaves: [ { id, teacher, dates, reason, status, approved_by } ] }

GET /api/admin/leaves/:id
  - Response: { leave details, documents, history }

POST /api/admin/leaves/:id/approve
  - Body: { remarks }
  - Response: { updated leave, notification sent }

POST /api/admin/leaves/:id/reject
  - Body: { reason }
  - Response: { updated leave, notification sent }
```

### 1.6 Materials & Resources Management (4 endpoints)
```
POST /api/admin/materials
  - Body: { chapter_id, topic_id, title, type, content_url, description }
  - Response: { material }

GET /api/admin/materials
  - Query: ?chapter_id=, ?type=, ?created_by=
  - Response: [ { materials } ]

PUT /api/admin/materials/:id
  - Body: { title, description, content_url }
  - Response: { updated material }

DELETE /api/admin/materials/:id
  - Response: { message: "Material deleted" }
```

### 1.7 Admin Logs & Auditing (4 endpoints)
```
GET /api/admin/activity-logs
  - Query: ?user_id=, ?action=, ?module=, ?from_date=, ?to_date=, ?skip=0, ?limit=100
  - Response: { total, logs: [ { id, user, action, module, timestamp, details } ] }

GET /api/admin/activity-logs/:id
  - Response: { log details, affected_records }

POST /api/admin/activity-logs/export
  - Body: { filters, format: 'csv'|'pdf' }
  - Response: { file_url }

GET /api/admin/system-health
  - Response: { database_status, server_status, deployments, last_backup }
```

### 1.8 Registration & QR Management (4 endpoints)
```
GET /api/admin/students/qr-codes
  - Query: ?school_id=, ?class_id=
  - Response: [ { student, qr_code_image_url } ]

GET /api/admin/teachers/qr-codes
  - Query: ?school_id=
  - Response: [ { teacher, qr_code_image_url } ]

POST /api/admin/register/bulk-import
  - Body: { file_path, type: 'students'|'teachers' }
  - Response: { imported_count, errors }

POST /api/admin/qr-code/scan
  - Body: { qr_code_data }
  - Response: { user_info, user_type }
```

---

## 2. TEACHER PORTAL ENDPOINTS (38 endpoints)

### 2.1 Teacher Authentication & Profile (4 endpoints)
```
POST /api/teacher/login
  - Body: { email, password }
  - Response: { token, teacher }

GET /api/teacher/profile
  - Headers: Authorization
  - Response: { teacher details, assignments, schedule }

PUT /api/teacher/profile
  - Headers: Authorization
  - Body: { name, phone, qualifications, bio }
  - Response: { updated teacher }

POST /api/teacher/change-password
  - Headers: Authorization
  - Body: { current_password, new_password }
  - Response: { message: "Password changed" }
```

### 2.2 Dashboard & Progress (4 endpoints)
```
GET /api/teacher/dashboard
  - Response: {
      assigned_subjects, total_classes, total_students,
      chapters_progress, sessions_planned, quizzes_scheduled,
      attendance_rate, student_performance_summary
    }

GET /api/teacher/progress/chapters
  - Query: ?class_id=, ?subject_id=
  - Response: [ { chapter_id, name, total_sessions, completed_sessions, percentage } ]

GET /api/teacher/progress/syllabus
  - Response: [ { subject_id, academic_year, completion_percentage, remaining_topics } ]

GET /api/teacher/dashboard/quick-stats
  - Response: { today_sessions, pending_quizzes, students_improvement, weak_areas }
```

### 2.3 Chapters & Topics Management (6 endpoints)
```
GET /api/teacher/chapters
  - Query: ?subject_id=, ?class_id=
  - Response: [ { chapter_id, name, topics_count, completed_sessions } ]

GET /api/teacher/chapters/:id
  - Response: { chapter details, topics, materials, quiz, sessions }

PUT /api/teacher/chapters/:id/progress
  - Body: { sessions_completed }
  - Response: { updated progress }

GET /api/teacher/topics
  - Query: ?chapter_id=
  - Response: [ { topic_id, name, materials, quiz, session_status } ]

PUT /api/teacher/topics/:id
  - Body: { name, description }
  - Response: { updated topic }

POST /api/teacher/chapters/:id/launch-session
  - Body: { topic_id, session_time, session_notes }
  - Response: { session_id, session_link }
```

### 2.4 Live Sessions Management (8 endpoints)
```
GET /api/teacher/sessions
  - Query: ?status=scheduled|ongoing|completed, ?class_id=
  - Response: [ { session_id, class, topic, date_time, duration, attendance_marked } ]

POST /api/teacher/sessions
  - Body: { class_id, subject_id, topic_id, session_date, session_time, duration }
  - Response: { session_id, session_link }

GET /api/teacher/sessions/:id
  - Response: { session details, materials, attendance, recording_link }

PUT /api/teacher/sessions/:id
  - Body: { session_date, session_time, duration, notes }
  - Response: { updated session }

DELETE /api/teacher/sessions/:id
  - Response: { message: "Session deleted" }

POST /api/teacher/sessions/:id/mark-attendance
  - Body: { student_ids: [], marked_at }
  - Response: { attendance marked }

POST /api/teacher/sessions/:id/ai-tools
  - Body: { tool: 'ppt_generator'|'chatbot'|'lesson_plan'|'youtube_recommendations'|'simulation'|'vr_viewer', params }
  - Response: { tool_result }

POST /api/teacher/sessions/:id/end-session
  - Body: { session_notes, recording_link }
  - Response: { session_closed }
```

### 2.5 Student Management (6 endpoints)
```
GET /api/teacher/students
  - Query: ?class_id=, ?subject_id=, ?search=
  - Response: [ { student_id, name, roll_no, classes, avg_score, attendance, performance_trend } ]

GET /api/teacher/students/:id
  - Response: { student details, quiz_history, attendance, grades, weak_areas, performance_graph }

POST /api/teacher/students/:id/pass-fail
  - Body: { status: 'pass'|'fail', marks, remarks, subject_id }
  - Response: { updated record }

POST /api/teacher/students/:id/promote
  - Body: { current_class_id, new_class_id, academic_year }
  - Response: { promotion_status }

GET /api/teacher/students/performance-analytics
  - Query: ?class_id=, ?subject_id=
  - Response: [ { student, avg_score, rank, weak_areas, trend } ]

POST /api/teacher/students/send-message
  - Body: { student_id, message, type: 'feedback'|'improvement'|'appreciation' }
  - Response: { message_sent }
```

### 2.6 Quizzes Management (6 endpoints)
```
GET /api/teacher/quizzes
  - Query: ?subject_id=, ?class_id=
  - Response: [ { quiz_id, name, chapter, total_marks, questions_count, students_attempted } ]

POST /api/teacher/quizzes
  - Body: { name, subject_id, class_id, chapter_id, total_marks, duration, passing_marks }
  - Response: { quiz_id }

GET /api/teacher/quizzes/:id
  - Response: { quiz details, questions, submissions, performance_stats }

PUT /api/teacher/quizzes/:id
  - Body: { name, total_marks, duration, passing_marks }
  - Response: { updated quiz }

POST /api/teacher/quizzes/:id/publish
  - Body: { class_id, available_from, available_till }
  - Response: { published_quiz }

POST /api/teacher/quizzes/:id/results
  - Response: { student_wise_results, analytics, grade_distribution }
```

### 2.7 Co-curricular Activities (6 endpoints)
```
GET /api/teacher/activities
  - Query: ?category=academic|sports|cultural
  - Response: [ { activity_id, name, category, date, students_registered, status } ]

POST /api/teacher/activities
  - Body: { activity_name, school_id, category, event_date, event_time, location, max_participants, description }
  - Response: { activity_id }

PUT /api/teacher/activities/:id
  - Body: { activity_name, event_date, event_time, location, description }
  - Response: { updated activity }

DELETE /api/teacher/activities/:id
  - Response: { message: "Activity deleted" }

GET /api/teacher/activities/:id/registrations
  - Response: [ { student_id, name, registration_date, status } ]

POST /api/teacher/activities/:id/update-status
  - Body: { status: 'ongoing'|'completed'|'cancelled', remarks }
  - Response: { updated activity }
```

### 2.8 Leave Management (4 endpoints)
```
GET /api/teacher/leaves
  - Response: [ { leave_id, from_date, to_date, reason, status, approval_date } ]

POST /api/teacher/leaves
  - Body: { from_date, to_date, reason, documents }
  - Response: { leave_id, status: "pending" }

GET /api/teacher/leaves/calendar
  - Response: { calendar with leave dates marked }

PUT /api/teacher/leaves/:id
  - Body: { reason, documents }
  - Response: { updated leave }
```

---

## 3. STUDENT PORTAL ENDPOINTS (32 endpoints)

### 3.1 Student Authentication & Profile (4 endpoints)
```
POST /api/student/login
  - Body: { email, password }
  - Response: { token, student }

GET /api/student/profile
  - Headers: Authorization
  - Response: { student details, class, school, academic_year }

PUT /api/student/profile
  - Headers: Authorization
  - Body: { name, phone, address, parent_email }
  - Response: { updated student }

POST /api/student/change-password
  - Headers: Authorization
  - Body: { current_password, new_password }
  - Response: { message: "Password changed" }
```

### 3.2 Dashboard & Performance (4 endpoints)
```
GET /api/student/dashboard
  - Response: {
      class_rank, overall_score, quizzes_completed, attendance_percentage,
      subjects_performance, weak_areas, recent_quizzes, badges_earned
    }

GET /api/student/dashboard/performance-summary
  - Response: {
      total_quizzes, avg_score, attendance, class_rank, subject_wise_performance,
      trending_topics, weak_areas
    }

GET /api/student/dashboard/subject-performance
  - Response: [ { subject_id, name, avg_score, quizzes_taken, rank } ]

GET /api/student/dashboard/weak-areas
  - Response: [ { topic_id, topic_name, weak_score, recommended_materials } ]
```

### 3.3 Study Materials (6 endpoints)
```
GET /api/student/materials
  - Query: ?subject_id=, ?chapter_id=, ?type=ppt|notes|video|simulation
  - Response: [ { material_id, title, type, content_url, description } ]

GET /api/student/materials/:id
  - Response: { material details, download_url, views_count }

POST /api/student/materials/:id/mark-completed
  - Response: { message: "Material marked as viewed" }

GET /api/student/materials/recommended
  - Response: [ { material_id, title, reason: "based_on_weak_areas" } ]

GET /api/student/materials/:id/similar
  - Response: [ { similar materials } ]

POST /api/student/materials/:id/add-note
  - Body: { note_text, timestamp }
  - Response: { note created }
```

### 3.4 Quizzes (6 endpoints)
```
GET /api/student/quizzes
  - Query: ?subject_id=, ?status=available|completed
  - Response: [ { quiz_id, name, chapter, total_marks, duration, previous_score, attempts } ]

GET /api/student/quizzes/:id
  - Response: { quiz details, questions, time_limit, previous_attempts_count }

POST /api/student/quizzes/:id/start
  - Body: { started_at }
  - Response: { session_id, questions }

POST /api/student/quizzes/:id/submit
  - Body: { answers: [ { question_id, answer } ], submitted_at }
  - Response: { score, percentage, grade, result_details }

GET /api/student/quizzes/:id/results
  - Response: [ { attempt_no, score, percentage, date, answers_review } ]

GET /api/student/quizzes/:id/performance-analysis
  - Response: { score_trend, weak_questions, strong_areas, recommendations }
```

### 3.5 Badges & Certificates (4 endpoints)
```
GET /api/student/badges
  - Response: [ { badge_id, badge_name, icon_url, earned_date, category } ]

GET /api/student/badges/recommended
  - Response: [ { badge_id, name, criteria, progress_percentage } ]

GET /api/student/certificates
  - Response: [ { certificate_id, title, earned_date, subject, score, download_url } ]

POST /api/student/certificates/:id/download
  - Response: { file_url, expires_in }
```

### 3.6 Activities & Competitions (4 endpoints)
```
GET /api/student/activities
  - Query: ?category=academic|sports|cultural, ?status=open|registered|completed
  - Response: [ { activity_id, name, category, event_date, registration_status } ]

POST /api/student/activities/:id/register
  - Body: { registered_at }
  - Response: { registration_confirmed }

POST /api/student/activities/:id/unregister
  - Response: { message: "Unregistered from activity" }

GET /api/student/activities/my-registrations
  - Response: [ { activity, registration_date, status, result } ]
```

### 3.7 AI Features (2 endpoints)
```
POST /api/student/ai-chatbot/message
  - Body: { message, context: 'subject_id|topic_id' }
  - Response: { response, suggestions }

POST /api/student/ai-chatbot/suggest-study-plan
  - Body: { weak_areas }
  - Response: { study_plan: [ { topic, materials, quizzes, duration } ] }
```

### 3.8 Attendance & Records (2 endpoints)
```
GET /api/student/attendance
  - Response: { attendance_percentage, details: [ { date, subject, status } ] }

GET /api/student/academic-records
  - Response: { grades, certificates, achievements, passing_criteria }
```

---

## 4. COMMON ENDPOINTS (12 endpoints)

### 4.1 Authentication & Authorization (4 endpoints)
```
POST /api/auth/verify-token
  - Headers: Authorization
  - Response: { valid: true, user }

POST /api/auth/refresh-token
  - Body: { refresh_token }
  - Response: { token }

POST /api/auth/forgot-password
  - Body: { email }
  - Response: { message: "Reset link sent" }

POST /api/auth/reset-password
  - Body: { token, new_password }
  - Response: { message: "Password reset successful" }
```

### 4.2 Data Export & Reporting (4 endpoints)
```
POST /api/reports/generate
  - Body: { report_type, filters, format: 'pdf'|'csv' }
  - Response: { report_url }

GET /api/reports/:id
  - Response: { report details, download_url }

POST /api/data/export
  - Body: { data_type, format: 'csv'|'json', filters }
  - Response: { file_url }

GET /api/data/import/status
  - Response: { import_status, records_processed, errors }
```

### 4.3 File & Media Management (4 endpoints)
```
POST /api/upload/image
  - Body: FormData { image_file }
  - Response: { image_url }

POST /api/upload/document
  - Body: FormData { document_file }
  - Response: { document_url }

POST /api/upload/video
  - Body: FormData { video_file }
  - Response: { video_url, upload_status }

DELETE /api/files/:id
  - Response: { message: "File deleted" }
```

---

## 5. BATCH OPERATIONS (10 endpoints)

### 5.1 Bulk Operations
```
POST /api/bulk/students/import
  - Body: { csv_content or file }
  - Response: { imported_count, failed_count, errors }

POST /api/bulk/students/update-status
  - Body: { student_ids, new_status }
  - Response: { updated_count }

POST /api/bulk/students/send-message
  - Body: { student_ids, message, message_type }
  - Response: { sent_count }

POST /api/bulk/teachers/assign-classes
  - Body: { assignments: [ { teacher_id, class_id, subject_id } ] }
  - Response: { assigned_count }

POST /api/bulk/grades/upload
  - Body: { grades: [ { student_id, subject_id, grade } ] }
  - Response: { uploaded_count, errors }

POST /api/bulk/attendance/mark
  - Body: { session_id, attendances: [ { student_id, status } ] }
  - Response: { marked_count }

POST /api/bulk/activities/create
  - Body: { activities: [ { ... } ] }
  - Response: { created_count }

POST /api/bulk/materials/import
  - Body: { materials: [ { ... } ] }
  - Response: { imported_count }

POST /api/bulk/users/export
  - Body: { user_type: 'students'|'teachers'|'admins', format }
  - Response: { file_url }

POST /api/bulk/notifications/send
  - Body: { user_ids, message, notification_type }
  - Response: { sent_count, failed_count }
```

---

## SUMMARY
- **Total Endpoints**: 134+
- **Admin Portal**: 40 endpoints
- **Teacher Portal**: 38 endpoints
- **Student Portal**: 32 endpoints
- **Common/Shared**: 12 endpoints
- **Batch Operations**: 10+ endpoints

## Authentication
All endpoints (except login) require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Success Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```
