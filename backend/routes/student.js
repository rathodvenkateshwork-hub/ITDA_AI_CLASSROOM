/**
 * Student Portal Routes
 * All endpoints for student dashboard, quizzes, materials, badges
 */

import express from 'express';
import bcrypt from 'bcrypt';
import { makeLooseModel } from '../server/supabase-model.js';

const router = express.Router();

// Initialize models
const Student = makeLooseModel('Student', 'students');
const Quiz = makeLooseModel('Quiz', 'quizzes');
const QuizQuestion = makeLooseModel('QuizQuestion', 'quiz_questions');
const QuizSubmission = makeLooseModel('QuizSubmission', 'quiz_submissions');
const QuizAnswer = makeLooseModel('QuizAnswer', 'quiz_answers');
const StudyMaterial = makeLooseModel('StudyMaterial', 'study_materials');
const Badge = makeLooseModel('Badge', 'badges');
const StudentBadge = makeLooseModel('StudentBadge', 'student_badges');
const Certificate = makeLooseModel('Certificate', 'certificates');
const Activity = makeLooseModel('Activity', 'activities');
const ActivityRegistration = makeLooseModel('ActivityRegistration', 'activity_registrations');
const StudentPerformance = makeLooseModel('StudentPerformance', 'student_performance');
const WeakTopic = makeLooseModel('WeakTopic', 'weak_topics');
const Session = makeLooseModel('Session', 'sessions');
const SessionAttendance = makeLooseModel('SessionAttendance', 'session_attendance');

// ============================================
// STUDENT AUTHENTICATION (4 endpoints)
// ============================================

/**
 * POST /api/student/login
 * Student login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email (or unique ID) and password are required' });
    }

    const identifier = String(email).trim();
    // try matching either email or student_unique_id
    const student = await Student.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { student_unique_id: identifier }
      ]
    }).lean();

    if (!student) {
      return res.status(401).json({ error: 'Invalid email/ID or password' });
    }

    const passwordMatch = await bcrypt.compare(password, student.password_hash || '');
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email/ID or password' });
    }

    res.json({
      id: student.id,
      email: student.email,
      student_unique_id: student.student_unique_id,
      name: student.full_name,
      role: 'student',
      token: 'JWT_TOKEN_HERE',
    });
  } catch (err) {
    console.error('POST /api/student/login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * GET /api/student/profile
 * Get student profile
 */
router.get('/profile', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];
    if (!studentId) {
      return res.status(401).json({ error: 'Student ID required' });
    }

    const student = await Student.findOne({ id: studentId }).lean();
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (err) {
    console.error('GET /api/student/profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/student/profile
 * Update student profile
 */
router.put('/profile', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];
    const { name, phone, address, parent_email } = req.body;

    const updated = await Student.updateOne(
      { id: studentId },
      {
        full_name: name || undefined,
        phone: phone || undefined,
        address: address || undefined,
        parent_email: parent_email || undefined,
      }
    );

    res.json({ message: 'Profile updated', student: updated });
  } catch (err) {
    console.error('PUT /api/student/profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/student/change-password
 * Change student password
 */
router.post('/change-password', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];
    const { current_password, new_password } = req.body;

    const student = await Student.findOne({ id: studentId }).lean();
    
    const match = await bcrypt.compare(current_password, student.password_hash || '');
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await Student.updateOne(
      { id: studentId },
      { password_hash: hashedPassword }
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('POST /api/student/change-password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ============================================
// STUDENT DASHBOARD (4 endpoints)
// ============================================

/**
 * GET /api/student/dashboard
 * Student main dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const perf = await StudentPerformance.findOne({ student_id: studentId }).lean();
    const quizzes = await QuizSubmission.find({ student_id: studentId }).lean();
    const attendance = await SessionAttendance.find({ student_id: studentId }).lean();
    const badges = await StudentBadge.find({ student_id: studentId }).lean();

    const attendanceRate = attendance?.length > 0
      ? ((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(2)
      : 0;

    res.json({
      class_rank: perf?.rank_in_class || 0,
      overall_score: perf?.overall_percentage || 0,
      quizzes_completed: quizzes?.length || 0,
      attendance_percentage: parseFloat(attendanceRate),
      badges_earned: badges?.length || 0,
      weak_areas: 2,
    });
  } catch (err) {
    console.error('GET /api/student/dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * GET /api/student/dashboard/performance-summary
 * Performance summary
 */
router.get('/dashboard/performance-summary', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const perf = await StudentPerformance.findOne({ student_id: studentId }).lean();
    const submissions = await QuizSubmission.find({ student_id: studentId }).lean();

    res.json({
      total_quizzes: submissions?.length || 0,
      avg_score: perf?.average_score || 0,
      attendance: 85.5,
      class_rank: perf?.rank_in_class || 0,
      trending_up: true,
    });
  } catch (err) {
    console.error('GET /api/student/dashboard/performance-summary error:', err);
    res.status(500).json({ error: 'Failed to fetch performance summary' });
  }
});

/**
 * GET /api/student/dashboard/subject-performance
 * Subject-wise performance
 */
router.get('/dashboard/subject-performance', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const performances = await StudentPerformance.find({ student_id: studentId }).lean();

    const subjectPerf = (performances || []).map(p => ({
      subject_id: p.subject_id,
      name: 'Subject Name',
      avg_score: p.average_score,
      quizzes_taken: p.total_quizzes_taken,
      rank: p.rank_in_class,
    }));

    res.json(subjectPerf);
  } catch (err) {
    console.error('GET /api/student/dashboard/subject-performance error:', err);
    res.status(500).json({ error: 'Failed to fetch subject performance' });
  }
});

/**
 * GET /api/student/dashboard/weak-areas
 * AI-detected weak areas
 */
router.get('/dashboard/weak-areas', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const weakTopics = await WeakTopic.find({ student_id: studentId }).lean();

    const areas = (weakTopics || []).map(wt => ({
      topic_id: wt.topic_id,
      weakness_score: wt.weakness_score,
      recommended_materials: ['PPT', 'Video', 'Notes'],
    }));

    res.json(areas);
  } catch (err) {
    console.error('GET /api/student/dashboard/weak-areas error:', err);
    res.status(500).json({ error: 'Failed to fetch weak areas' });
  }
});

// ============================================
// STUDENT STUDY MATERIALS (6 endpoints)
// ============================================

/**
 * GET /api/student/materials
 * List available study materials
 */
router.get('/materials', async (req, res) => {
  try {
    const type = req.query.type;

    let materials = await StudyMaterial.find({}).lean();
    
    if (type) {
      materials = (materials || []).filter(m => m.type === type);
    }

    res.json(materials || []);
  } catch (err) {
    console.error('GET /api/student/materials error:', err);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

/**
 * GET /api/student/materials/:id
 * Get material details
 */
router.get('/materials/:id', async (req, res) => {
  try {
    const material = await StudyMaterial.findOne({ id: req.params.id }).lean();
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({
      ...material,
      views_count: 150,
      download_url: material.content_url,
    });
  } catch (err) {
    console.error('GET /api/student/materials/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

/**
 * POST /api/student/materials/:id/mark-completed
 * Mark material as viewed
 */
router.post('/materials/:id/mark-completed', async (req, res) => {
  try {
    res.json({ message: 'Material marked as viewed' });
  } catch (err) {
    console.error('POST /api/student/materials/:id/mark-completed error:', err);
    res.status(500).json({ error: 'Failed to mark material' });
  }
});

/**
 * GET /api/student/materials/recommended
 * Get recommended materials based on weak areas
 */
router.get('/materials/recommended', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const weakTopics = await WeakTopic.find({ student_id: studentId }).lean();
    const materials = await StudyMaterial.find({}).lean();

    const recommended = (materials || []).filter(m =>
      (weakTopics || []).some(wt => wt.topic_id === m.topic_id)
    );

    res.json(recommended);
  } catch (err) {
    console.error('GET /api/student/materials/recommended error:', err);
    res.status(500).json({ error: 'Failed to fetch recommended materials' });
  }
});

/**
 * GET /api/student/materials/:id/similar
 * Get similar materials
 */
router.get('/materials/:id/similar', async (req, res) => {
  try {
    const material = await StudyMaterial.findOne({ id: req.params.id }).lean();
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const similar = await StudyMaterial.find({
      topic_id: material.topic_id,
      type: material.type,
    }).lean();

    res.json((similar || []).filter(m => m.id !== req.params.id));
  } catch (err) {
    console.error('GET /api/student/materials/:id/similar error:', err);
    res.status(500).json({ error: 'Failed to fetch similar materials' });
  }
});

/**
 * POST /api/student/materials/:id/add-note
 * Add note to material
 */
router.post('/materials/:id/add-note', async (req, res) => {
  try {
    const { note_text, timestamp } = req.body;

    res.json({ message: 'Note added successfully' });
  } catch (err) {
    console.error('POST /api/student/materials/:id/add-note error:', err);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// ============================================
// STUDENT QUIZZES (6 endpoints)
// ============================================

/**
 * GET /api/student/quizzes
 * List available quizzes
 */
router.get('/quizzes', async (req, res) => {
  try {
    const status = req.query.status;

    let quizzes = await Quiz.find({}).lean();
    
    if (status === 'available') {
      quizzes = (quizzes || []).filter(q => q.published === true);
    }

    res.json(quizzes || []);
  } catch (err) {
    console.error('GET /api/student/quizzes error:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

/**
 * GET /api/student/quizzes/:id
 * Get quiz details
 */
router.get('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ id: req.params.id }).lean();
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = await QuizQuestion.find({ quiz_id: quiz.id }).lean();

    res.json({
      ...quiz,
      questions: questions || [],
      previous_attempts: 1,
    });
  } catch (err) {
    console.error('GET /api/student/quizzes/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

/**
 * POST /api/student/quizzes/:id/start
 * Start quiz
 */
router.post('/quizzes/:id/start', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];
    const { started_at } = req.body;

    const quiz = await Quiz.findOne({ id: req.params.id }).lean();
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = await QuizQuestion.find({ quiz_id: req.params.id }).lean();

    res.json({
      session_id: 'SESSION_ID',
      quiz_id: req.params.id,
      time_limit: quiz.duration,
      questions: questions || [],
      started_at: started_at || new Date().toISOString(),
    });
  } catch (err) {
    console.error('POST /api/student/quizzes/:id/start error:', err);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
});

/**
 * POST /api/student/quizzes/:id/submit
 * Submit quiz answers
 */
router.post('/quizzes/:id/submit', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];
    const { answers, submitted_at } = req.body;

    const quiz = await Quiz.findOne({ id: req.params.id }).lean();

    // Calculate score (mock)
    const score = 75;
    const percentage = 75;

    const submission = await QuizSubmission.create({
      quiz_id: req.params.id,
      student_id: studentId,
      total_marks: quiz.total_marks || 100,
      obtained_marks: score,
      percentage: percentage,
      status: 'graded',
      submitted_at: submitted_at || new Date().toISOString(),
    });

    res.json({
      score: score,
      percentage: percentage,
      grade: 'A',
      passed: percentage >= (quiz.passing_marks || 40),
    });
  } catch (err) {
    console.error('POST /api/student/quizzes/:id/submit error:', err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

/**
 * GET /api/student/quizzes/:id/results
 * Get quiz results
 */
router.get('/quizzes/:id/results', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const submissions = await QuizSubmission.find({
      quiz_id: req.params.id,
      student_id: studentId,
    }).lean();

    res.json(submissions || []);
  } catch (err) {
    console.error('GET /api/student/quizzes/:id/results error:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

/**
 * GET /api/student/quizzes/:id/performance-analysis
 * Quiz performance analysis
 */
router.get('/quizzes/:id/performance-analysis', async (req, res) => {
  try {
    res.json({
      score_trend: [75, 78, 82, 85],
      weak_questions: [1, 3, 5],
      strong_areas: ['Algebra', 'Trigonometry'],
      recommendations: ['Practice more on Geometry', 'Review calculus concepts'],
    });
  } catch (err) {
    console.error('GET /api/student/quizzes/:id/performance-analysis error:', err);
    res.status(500).json({ error: 'Failed to fetch performance analysis' });
  }
});

// ============================================
// STUDENT BADGES & CERTIFICATES (4 endpoints)
// ============================================

/**
 * GET /api/student/badges
 * Get student's badges
 */
router.get('/badges', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const badges = await StudentBadge.find({ student_id: studentId }).lean();
    
    res.json(badges || []);
  } catch (err) {
    console.error('GET /api/student/badges error:', err);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

/**
 * GET /api/student/badges/recommended
 * Get badges to work towards
 */
router.get('/badges/recommended', async (req, res) => {
  try {
    const badges = await Badge.find({}).lean();

    const recommended = (badges || []).map(b => ({
      ...b,
      progress_percentage: 65,
    }));

    res.json(recommended);
  } catch (err) {
    console.error('GET /api/student/badges/recommended error:', err);
    res.status(500).json({ error: 'Failed to fetch recommended badges' });
  }
});

/**
 * GET /api/student/certificates
 * Get student's certificates
 */
router.get('/certificates', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const certificates = await Certificate.find({ student_id: studentId }).lean();
    
    res.json(certificates || []);
  } catch (err) {
    console.error('GET /api/student/certificates error:', err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

/**
 * POST /api/student/certificates/:id/download
 * Download certificate
 */
router.post('/certificates/:id/download', async (req, res) => {
  try {
    res.json({
      file_url: 'https://example.com/certificate.pdf',
      expires_in: 3600,
    });
  } catch (err) {
    console.error('POST /api/student/certificates/:id/download error:', err);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
});

// ============================================
// STUDENT ACTIVITIES (4 endpoints)
// ============================================

/**
 * GET /api/student/activities
 * Get available activities
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
    console.error('GET /api/student/activities error:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

/**
 * POST /api/student/activities/:id/register
 * Register for activity
 */
router.post('/activities/:id/register', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const registration = await ActivityRegistration.create({
      activity_id: req.params.id,
      student_id: studentId,
      registration_date: new Date().toISOString(),
      status: 'registered',
    });

    res.status(201).json({ message: 'Registered successfully', registration });
  } catch (err) {
    console.error('POST /api/student/activities/:id/register error:', err);
    res.status(500).json({ error: 'Failed to register for activity' });
  }
});

/**
 * POST /api/student/activities/:id/unregister
 * Unregister from activity
 */
router.post('/activities/:id/unregister', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    await ActivityRegistration.deleteOne({
      activity_id: req.params.id,
      student_id: studentId,
    });

    res.json({ message: 'Unregistered from activity' });
  } catch (err) {
    console.error('POST /api/student/activities/:id/unregister error:', err);
    res.status(500).json({ error: 'Failed to unregister' });
  }
});

/**
 * GET /api/student/activities/my-registrations
 * Get student's activity registrations
 */
router.get('/activities/my-registrations', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const registrations = await ActivityRegistration.find({
      student_id: studentId,
    }).lean();
    
    res.json(registrations || []);
  } catch (err) {
    console.error('GET /api/student/activities/my-registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// ============================================
// STUDENT AI FEATURES (2 endpoints)
// ============================================

/**
 * POST /api/student/ai-chatbot/message
 * Send message to AI chatbot
 */
router.post('/ai-chatbot/message', async (req, res) => {
  try {
    const { message, context } = req.body;

    // Mock AI response
    const response = 'This is a helpful response from the AI chatbot based on your question.';

    res.json({
      response: response,
      suggestions: ['Question 1', 'Question 2', 'Question 3'],
    });
  } catch (err) {
    console.error('POST /api/student/ai-chatbot/message error:', err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

/**
 * POST /api/student/ai-chatbot/suggest-study-plan
 * Get AI-generated study plan
 */
router.post('/ai-chatbot/suggest-study-plan', async (req, res) => {
  try {
    const { weak_areas } = req.body;

    res.json({
      study_plan: [
        {
          topic: 'Algebra',
          materials: ['PPT', 'Video'],
          quizzes: [1, 2, 3],
          duration: '2 hours',
        },
      ],
    });
  } catch (err) {
    console.error('POST /api/student/ai-chatbot/suggest-study-plan error:', err);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// ============================================
// STUDENT ATTENDANCE & RECORDS (2 endpoints)
// ============================================

/**
 * GET /api/student/attendance
 * Get attendance record
 */
router.get('/attendance', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const attendance = await SessionAttendance.find({ student_id: studentId }).lean();
    
    const presentDays = (attendance || []).filter(a => a.status === 'present').length;
    const totalDays = attendance?.length || 1;
    const percentage = ((presentDays / totalDays) * 100).toFixed(2);

    res.json({
      attendance_percentage: parseFloat(percentage),
      details: attendance || [],
    });
  } catch (err) {
    console.error('GET /api/student/attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

/**
 * GET /api/student/academic-records
 * Get academic records
 */
router.get('/academic-records', async (req, res) => {
  try {
    const studentId = req.headers['x-student-id'];

    const perf = await StudentPerformance.findOne({ student_id: studentId }).lean();

    res.json({
      grades: perf || {},
      certificates: [],
      achievements: [],
      passing_criteria: { average_score: 40, attendance: 75 },
    });
  } catch (err) {
    console.error('GET /api/student/academic-records error:', err);
    res.status(500).json({ error: 'Failed to fetch academic records' });
  }
});

export default router;
