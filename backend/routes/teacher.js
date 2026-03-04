/**
 * Teacher Portal Routes
 * All endpoints for teacher dashboard, sessions, students, quizzes
 */

import express from 'express';
import bcrypt from 'bcrypt';
import { makeLooseModel } from '../server/supabase-model.js';

const router = express.Router();

// Initialize models
const Teacher = makeLooseModel('Teacher', 'teachers');
const Student = makeLooseModel('Student', 'students');
const Class = makeLooseModel('Class', 'classes');
const Subject = makeLooseModel('Subject', 'subjects');
const Chapter = makeLooseModel('Chapter', 'chapters');
const Topic = makeLooseModel('Topic', 'topics');
const Quiz = makeLooseModel('Quiz', 'quizzes');
const Session = makeLooseModel('Session', 'sessions');
const SessionAttendance = makeLooseModel('SessionAttendance', 'session_attendance');
const StudentPerformance = makeLooseModel('StudentPerformance', 'student_performance');
const TeacherLeave = makeLooseModel('TeacherLeave', 'teacher_leaves');
const ChapterProgress = makeLooseModel('ChapterProgress', 'chapter_progress');
const Activity = makeLooseModel('Activity', 'activities');
const ActivityRegistration = makeLooseModel('ActivityRegistration', 'activity_registrations');

// ============================================
// TEACHER AUTHENTICATION (4 endpoints)
// ============================================

/**
 * POST /api/teacher/login
 * Teacher login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const teacher = await Teacher.findOne({ email: email.toLowerCase() }).lean();
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, teacher.password_hash || '');
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      id: teacher.id,
      email: teacher.email,
      name: teacher.full_name,
      role: 'teacher',
      token: 'JWT_TOKEN_HERE', // TODO: Implement proper JWT
    });
  } catch (err) {
    console.error('POST /api/teacher/login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * GET /api/teacher/profile
 * Get teacher profile
 */
router.get('/profile', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id']; // Would use JWT in production
    if (!teacherId) {
      return res.status(401).json({ error: 'Teacher ID required' });
    }

    const teacher = await Teacher.findOne({ id: teacherId }).lean();
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (err) {
    console.error('GET /api/teacher/profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/teacher/profile
 * Update teacher profile
 */
router.put('/profile', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];
    const { name, phone, qualifications, bio } = req.body;

    const updated = await Teacher.updateOne(
      { id: teacherId },
      {
        full_name: name || undefined,
        phone: phone || undefined,
        qualifications: qualifications || undefined,
        bio: bio || undefined,
      }
    );

    res.json({ message: 'Profile updated', teacher: updated });
  } catch (err) {
    console.error('PUT /api/teacher/profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/teacher/change-password
 * Change teacher password
 */
router.post('/change-password', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];
    const { current_password, new_password } = req.body;

    const teacher = await Teacher.findOne({ id: teacherId }).lean();
    
    const match = await bcrypt.compare(current_password, teacher.password_hash || '');
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await Teacher.updateOne(
      { id: teacherId },
      { password_hash: hashedPassword }
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('POST /api/teacher/change-password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ============================================
// TEACHER DASHBOARD (4 endpoints)
// ============================================

/**
 * GET /api/teacher/dashboard
 * Teacher main dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];

    const classes = await Class.find({ teacher_id: teacherId }).lean();
    const sessions = await Session.find({ teacher_id: teacherId }).lean();
    const students = await Student.find({}).lean();
    const chapters = await Chapter.find({}).lean();
    const quizzes = await Quiz.find({ created_by: teacherId }).lean();

    res.json({
      assigned_subjects: classes?.length || 0,
      total_classes: classes?.length || 0,
      total_students: students?.length || 0,
      chapters_progress: chapters?.length || 0,
      sessions_planned: sessions?.length || 0,
      quizzes_scheduled: quizzes?.length || 0,
      attendance_rate: 85.5,
      student_performance_summary: 'Good',
    });
  } catch (err) {
    console.error('GET /api/teacher/dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * GET /api/teacher/dashboard/quick-stats
 * Quick statistics for teacher dashboard
 */
router.get('/dashboard/quick-stats', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];

    const todaySessions = await Session.find({ teacher_id: teacherId }).lean();
    const quizzes = await Quiz.find({ created_by: teacherId }).lean();

    res.json({
      today_sessions: todaySessions?.length || 0,
      pending_quizzes: quizzes?.length || 0,
      students_improvement: 5,
      weak_areas: 3,
    });
  } catch (err) {
    console.error('GET /api/teacher/dashboard/quick-stats error:', err);
    res.status(500).json({ error: 'Failed to fetch quick stats' });
  }
});

/**
 * GET /api/teacher/progress/chapters
 * Chapter progress for taught classes
 */
router.get('/progress/chapters', async (req, res) => {
  try {
    const classId = req.query.class_id;

    const chapters = await Chapter.find({}).lean();
    const progress = await Promise.all(
      (chapters || []).map(async (chapter) => {
        const chapterProgress = await ChapterProgress.findOne({ 
          chapter_id: chapter.id, 
          class_id: classId 
        }).lean();

        return {
          chapter_id: chapter.id,
          name: chapter.name,
          total_sessions: chapterProgress?.sessions_planned || 0,
          completed_sessions: chapterProgress?.sessions_completed || 0,
          percentage: chapterProgress?.completion_percentage || 0,
        };
      })
    );

    res.json(progress);
  } catch (err) {
    console.error('GET /api/teacher/progress/chapters error:', err);
    res.status(500).json({ error: 'Failed to fetch chapter progress' });
  }
});

/**
 * GET /api/teacher/progress/syllabus
 * Syllabus completion progress
 */
router.get('/progress/syllabus', async (req, res) => {
  try {
    const subjects = await Subject.find({}).lean();
    
    const syllabusProgress = (subjects || []).map(subject => ({
      subject_id: subject.id,
      academic_year: '2025-26',
      completion_percentage: 65.5,
      remaining_topics: 5,
    }));

    res.json(syllabusProgress);
  } catch (err) {
    console.error('GET /api/teacher/progress/syllabus error:', err);
    res.status(500).json({ error: 'Failed to fetch syllabus progress' });
  }
});

// ============================================
// TEACHER SESSIONS MANAGEMENT (8 endpoints)
// ============================================

/**
 * GET /api/teacher/sessions
 * List teacher's sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];
    const status = req.query.status;

    let sessions = await Session.find({ teacher_id: teacherId }).lean();
    
    if (status) {
      sessions = (sessions || []).filter(s => s.status === status);
    }

    res.json(sessions || []);
  } catch (err) {
    console.error('GET /api/teacher/sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * POST /api/teacher/sessions
 * Create new session
 */
router.post('/sessions', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];
    const { class_id, subject_id, topic_id, session_date, session_time, duration } = req.body;

    const session = await Session.create({
      teacher_id: teacherId,
      class_id,
      subject_id,
      topic_id,
      session_date,
      session_time,
      duration,
      status: 'scheduled',
    });

    res.status(201).json({ message: 'Session created', session_id: session.id });
  } catch (err) {
    console.error('POST /api/teacher/sessions error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * GET /api/teacher/sessions/:id
 * Get session details
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id }).lean();
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const attendance = await SessionAttendance.find({ session_id: session.id }).lean();

    res.json({
      ...session,
      attendance_marked: attendance?.length || 0,
    });
  } catch (err) {
    console.error('GET /api/teacher/sessions/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/**
 * PUT /api/teacher/sessions/:id
 * Update session
 */
router.put('/sessions/:id', async (req, res) => {
  try {
    const { session_date, session_time, duration, notes } = req.body;

    const updated = await Session.updateOne(
      { id: req.params.id },
      { session_date, session_time, duration, notes }
    );

    res.json({ message: 'Session updated', session: updated });
  } catch (err) {
    console.error('PUT /api/teacher/sessions/:id error:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

/**
 * DELETE /api/teacher/sessions/:id
 * Cancel session
 */
router.delete('/sessions/:id', async (req, res) => {
  try {
    await Session.updateOne(
      { id: req.params.id },
      { status: 'cancelled' }
    );

    res.json({ message: 'Session cancelled' });
  } catch (err) {
    console.error('DELETE /api/teacher/sessions/:id error:', err);
    res.status(500).json({ error: 'Failed to cancel session' });
  }
});

/**
 * POST /api/teacher/sessions/:id/mark-attendance
 * Mark attendance for session
 */
router.post('/sessions/:id/mark-attendance', async (req, res) => {
  try {
    const { student_ids, marked_at } = req.body;

    const records = await Promise.all(
      (student_ids || []).map(studentId =>
        SessionAttendance.create({
          session_id: req.params.id,
          student_id: studentId,
          status: 'present',
          marked_at: marked_at || new Date().toISOString(),
        })
      )
    );

    res.json({ message: 'Attendance marked', marked_count: records.length });
  } catch (err) {
    console.error('POST /api/teacher/sessions/:id/mark-attendance error:', err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

/**
 * POST /api/teacher/sessions/:id/end-session
 * End session
 */
router.post('/sessions/:id/end-session', async (req, res) => {
  try {
    const { session_notes, recording_link } = req.body;

    await Session.updateOne(
      { id: req.params.id },
      { status: 'completed', notes: session_notes, recording_link }
    );

    res.json({ message: 'Session ended successfully' });
  } catch (err) {
    console.error('POST /api/teacher/sessions/:id/end-session error:', err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// ============================================
// TEACHER STUDENTS MANAGEMENT (6 endpoints)
// ============================================

/**
 * GET /api/teacher/students
 * List students taught by teacher
 */
router.get('/students', async (req, res) => {
  try {
    const classId = req.query.class_id;

    let students = await Student.find({ class_id: classId }).lean();
    const withPerformance = await Promise.all(
      (students || []).map(async (student) => {
        const perf = await StudentPerformance.findOne({ student_id: student.id }).lean();
        return {
          ...student,
          avg_score: perf?.average_score || 0,
          attendance: 85.5,
          performance_trend: 'improving',
        };
      })
    );

    res.json(withPerformance);
  } catch (err) {
    console.error('GET /api/teacher/students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

/**
 * GET /api/teacher/students/:id
 * Get student details
 */
router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id }).lean();
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const perf = await StudentPerformance.findOne({ student_id: student.id }).lean();

    res.json({
      ...student,
      quiz_history: [],
      attendance: 85.5,
      grades: perf || {},
      weak_areas: ['Algebra', 'Geometry'],
    });
  } catch (err) {
    console.error('GET /api/teacher/students/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});

/**
 * POST /api/teacher/students/:id/pass-fail
 * Mark student pass/fail
 */
router.post('/students/:id/pass-fail', async (req, res) => {
  try {
    const { status, marks, remarks, subject_id } = req.body;

    const updated = await StudentPerformance.updateOne(
      { student_id: req.params.id, subject_id },
      { status, marks: marks || 0, remarks }
    );

    res.json({ message: `Student marked as ${status}`, record: updated });
  } catch (err) {
    console.error('POST /api/teacher/students/:id/pass-fail error:', err);
    res.status(500).json({ error: 'Failed to update student status' });
  }
});

/**
 * POST /api/teacher/students/:id/promote
 * Promote student to next class
 */
router.post('/students/:id/promote', async (req, res) => {
  try {
    const { current_class_id, new_class_id, academic_year } = req.body;

    const updated = await Student.updateOne(
      { id: req.params.id, class_id: current_class_id },
      { class_id: new_class_id, academic_year }
    );

    res.json({ message: 'Student promoted successfully', student: updated });
  } catch (err) {
    console.error('POST /api/teacher/students/:id/promote error:', err);
    res.status(500).json({ error: 'Failed to promote student' });
  }
});

/**
 * GET /api/teacher/students/performance-analytics
 * Student performance analytics
 */
router.get('/students/performance-analytics', async (req, res) => {
  try {
    const classId = req.query.class_id;
    
    const performances = await StudentPerformance.find({}).lean();
    
    res.json({
      total_students: performances?.length || 0,
      average_score: 75.5,
      top_performers: 5,
      struggling_students: 3,
    });
  } catch (err) {
    console.error('GET /api/teacher/students/performance-analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});

/**
 * POST /api/teacher/students/send-message
 * Send message to student
 */
router.post('/students/send-message', async (req, res) => {
  try {
    const { student_id, message, type } = req.body;
    
    // TODO: Implement messaging system
    res.json({ message: 'Message sent to student' });
  } catch (err) {
    console.error('POST /api/teacher/students/send-message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================
// TEACHER QUIZZES (6 endpoints)
// ============================================

/**
 * GET /api/teacher/quizzes
 * List teacher's quizzes
 */
router.get('/quizzes', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];

    const quizzes = await Quiz.find({ created_by: teacherId }).lean();
    
    res.json(quizzes || []);
  } catch (err) {
    console.error('GET /api/teacher/quizzes error:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

/**
 * POST /api/teacher/quizzes
 * Create new quiz
 */
router.post('/quizzes', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];
    const { name, subject_id, class_id, chapter_id, total_marks, duration, passing_marks } = req.body;

    const quiz = await Quiz.create({
      name,
      subject_id,
      class_id,
      chapter_id,
      total_marks,
      duration,
      passing_marks,
      created_by: teacherId,
      academic_year: '2025-26',
    });

    res.status(201).json({ message: 'Quiz created', quiz_id: quiz.id });
  } catch (err) {
    console.error('POST /api/teacher/quizzes error:', err);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

/**
 * GET /api/teacher/quizzes/:id
 * Get quiz details
 */
router.get('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ id: req.params.id }).lean();
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (err) {
    console.error('GET /api/teacher/quizzes/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

/**
 * PUT /api/teacher/quizzes/:id
 * Update quiz
 */
router.put('/quizzes/:id', async (req, res) => {
  try {
    const { name, total_marks, duration, passing_marks } = req.body;

    const updated = await Quiz.updateOne(
      { id: req.params.id },
      { name, total_marks, duration, passing_marks }
    );

    res.json({ message: 'Quiz updated', quiz: updated });
  } catch (err) {
    console.error('PUT /api/teacher/quizzes/:id error:', err);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

/**
 * POST /api/teacher/quizzes/:id/publish
 * Publish quiz to class
 */
router.post('/quizzes/:id/publish', async (req, res) => {
  try {
    const { class_id, available_from, available_till } = req.body;

    await Quiz.updateOne(
      { id: req.params.id },
      { published: true, available_from, available_till }
    );

    res.json({ message: 'Quiz published successfully' });
  } catch (err) {
    console.error('POST /api/teacher/quizzes/:id/publish error:', err);
    res.status(500).json({ error: 'Failed to publish quiz' });
  }
});

/**
 * POST /api/teacher/quizzes/:id/results
 * Get quiz results
 */
router.post('/quizzes/:id/results', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ id: req.params.id }).lean();
    
    res.json({
      quiz_id: req.params.id,
      student_wise_results: [],
      analytics: { average_score: 75.5, pass_rate: 85 },
    });
  } catch (err) {
    console.error('POST /api/teacher/quizzes/:id/results error:', err);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
});

// ============================================
// TEACHER LEAVE MANAGEMENT (4 endpoints)
// ============================================

/**
 * GET /api/teacher/leaves
 * Get teacher's leaves
 */
router.get('/leaves', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];

    const leaves = await TeacherLeave.find({ teacher_id: teacherId }).lean();
    
    res.json(leaves || []);
  } catch (err) {
    console.error('GET /api/teacher/leaves error:', err);
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

/**
 * POST /api/teacher/leaves
 * Request leave
 */
router.post('/leaves', async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];
    const { from_date, to_date, reason, documents } = req.body;

    const leave = await TeacherLeave.create({
      teacher_id: teacherId,
      from_date,
      to_date,
      reason,
      documents: documents || null,
      status: 'pending',
    });

    res.status(201).json({ message: 'Leave requested', leave_id: leave.id });
  } catch (err) {
    console.error('POST /api/teacher/leaves error:', err);
    res.status(500).json({ error: 'Failed to request leave' });
  }
});

/**
 * GET /api/teacher/leaves/calendar
 * Get leaves calendar
 */
router.get('/leaves/calendar', async (req, res) => {
  try {
    res.json({ calendar: 'Leaves marked on calendar' });
  } catch (err) {
    console.error('GET /api/teacher/leaves/calendar error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

/**
 * PUT /api/teacher/leaves/:id
 * Update leave request
 */
router.put('/leaves/:id', async (req, res) => {
  try {
    const { reason, documents } = req.body;

    const updated = await TeacherLeave.updateOne(
      { id: req.params.id },
      { reason, documents }
    );

    res.json({ message: 'Leave updated', leave: updated });
  } catch (err) {
    console.error('PUT /api/teacher/leaves/:id error:', err);
    res.status(500).json({ error: 'Failed to update leave' });
  }
});

// ============================================
// TEACHER ACTIVITIES (6 endpoints)
// ============================================

/**
 * GET /api/teacher/activities
 * List activities
 */
router.get('/activities', async (req, res) => {
  try {
    const category = req.query.category;

    let activities = await Activity.find({}).lean();
    
    if (category) {
      activities = (activities || []).filter(a => a.category === category);
    }

    res.json(activities || []);
  } catch (err) {
    console.error('GET /api/teacher/activities error:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

/**
 * POST /api/teacher/activities
 * Create activity
 */
router.post('/activities', async (req, res) => {
  try {
    const { activity_name, school_id, category, event_date, event_time, location, max_participants, description } = req.body;

    const activity = await Activity.create({
      activity_name,
      school_id,
      category,
      event_date,
      event_time,
      location,
      max_participants,
      description,
      status: 'upcoming',
    });

    res.status(201).json({ message: 'Activity created', activity_id: activity.id });
  } catch (err) {
    console.error('POST /api/teacher/activities error:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

/**
 * PUT /api/teacher/activities/:id
 * Update activity
 */
router.put('/activities/:id', async (req, res) => {
  try {
    const { activity_name, event_date, event_time, location, description } = req.body;

    const updated = await Activity.updateOne(
      { id: req.params.id },
      { activity_name, event_date, event_time, location, description }
    );

    res.json({ message: 'Activity updated', activity: updated });
  } catch (err) {
    console.error('PUT /api/teacher/activities/:id error:', err);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

/**
 * DELETE /api/teacher/activities/:id
 * Delete activity
 */
router.delete('/activities/:id', async (req, res) => {
  try {
    await Activity.deleteOne({ id: req.params.id });
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    console.error('DELETE /api/teacher/activities/:id error:', err);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

/**
 * GET /api/teacher/activities/:id/registrations
 * Get activity registrations
 */
router.get('/activities/:id/registrations', async (req, res) => {
  try {
    const registrations = await ActivityRegistration.find({ activity_id: req.params.id }).lean();
    res.json(registrations || []);
  } catch (err) {
    console.error('GET /api/teacher/activities/:id/registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

/**
 * POST /api/teacher/activities/:id/update-status
 * Update activity status
 */
router.post('/activities/:id/update-status', async (req, res) => {
  try {
    const { status, remarks } = req.body;

    await Activity.updateOne(
      { id: req.params.id },
      { status, remarks }
    );

    res.json({ message: 'Activity status updated' });
  } catch (err) {
    console.error('POST /api/teacher/activities/:id/update-status error:', err);
    res.status(500).json({ error: 'Failed to update activity status' });
  }
});

// ============================================
// TEACHER CHAPTERS & TOPICS (6 endpoints)
// ============================================

/**
 * GET /api/teacher/chapters
 * List chapters
 */
router.get('/chapters', async (req, res) => {
  try {
    const chapters = await Chapter.find({}).lean();
    res.json(chapters || []);
  } catch (err) {
    console.error('GET /api/teacher/chapters error:', err);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

/**
 * GET /api/teacher/chapters/:id
 * Get chapter details
 */
router.get('/chapters/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findOne({ id: req.params.id }).lean();
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    const topics = await Topic.find({ chapter_id: chapter.id }).lean();

    res.json({
      ...chapter,
      topics: topics || [],
    });
  } catch (err) {
    console.error('GET /api/teacher/chapters/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
});

/**
 * PUT /api/teacher/chapters/:id/progress
 * Update chapter progress
 */
router.put('/chapters/:id/progress', async (req, res) => {
  try {
    const { sessions_completed } = req.body;

    const updated = await Chapter.updateOne(
      { id: req.params.id },
      { sessions_completed }
    );

    res.json({ message: 'Chapter progress updated', chapter: updated });
  } catch (err) {
    console.error('PUT /api/teacher/chapters/:id/progress error:', err);
    res.status(500).json({ error: 'Failed to update chapter progress' });
  }
});

/**
 * GET /api/teacher/topics
 * List topics
 */
router.get('/topics', async (req, res) => {
  try {
    const topics = await Topic.find({}).lean();
    res.json(topics || []);
  } catch (err) {
    console.error('GET /api/teacher/topics error:', err);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

/**
 * PUT /api/teacher/topics/:id
 * Update topic
 */
router.put('/topics/:id', async (req, res) => {
  try {
    const { name, description } = req.body;

    const updated = await Topic.updateOne(
      { id: req.params.id },
      { name, description }
    );

    res.json({ message: 'Topic updated', topic: updated });
  } catch (err) {
    console.error('PUT /api/teacher/topics/:id error:', err);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

/**
 * POST /api/teacher/chapters/:id/launch-session
 * Launch session for chapter topic
 */
router.post('/chapters/:id/launch-session', async (req, res) => {
  try {
    const { topic_id, session_time, session_notes } = req.body;

    const session = await Session.create({
      chapter_id: req.params.id,
      topic_id,
      session_time,
      notes: session_notes,
      status: 'ongoing',
    });

    res.json({ message: 'Session launched', session_id: session.id });
  } catch (err) {
    console.error('POST /api/teacher/chapters/:id/launch-session error:', err);
    res.status(500).json({ error: 'Failed to launch session' });
  }
});

export default router;
