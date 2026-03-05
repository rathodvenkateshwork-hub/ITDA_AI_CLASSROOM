/**
 * Admin Portal Routes
 * All endpoints for admin dashboard, schools, teachers, leave, logs
 */

import express from 'express';
import { makeLooseModel } from '../server/supabase-model.js';

const router = express.Router();

// Initialize models
const School = makeLooseModel('School', 'schools');
const Teacher = makeLooseModel('Teacher', 'teachers');
const Student = makeLooseModel('Student', 'students');
const Class = makeLooseModel('Class', 'classes');
const Subject = makeLooseModel('Subject', 'subjects');
const Quiz = makeLooseModel('Quiz', 'quizzes');
const Session = makeLooseModel('Session', 'sessions');
const StudentPerformance = makeLooseModel('StudentPerformance', 'student_performance');
const ActivityLog = makeLooseModel('ActivityLog', 'activity_logs');
const TeacherLeave = makeLooseModel('TeacherLeave', 'teacher_leaves');
const ChapterProgress = makeLooseModel('ChapterProgress', 'chapter_progress');
const WeakTopic = makeLooseModel('WeakTopic', 'weak_topics');
const SessionAttendance = makeLooseModel('SessionAttendance', 'session_attendance');
const Badge = makeLooseModel('Badge', 'badges');
const Chapter = makeLooseModel('Chapter', 'chapters');
const TopicModel = makeLooseModel('TopicModel', 'topics');

// ============================================
// ADMIN DASHBOARD - STATISTICS (12 endpoints)
// ============================================

/**
 * GET /api/admin/dashboard/stats
 * Overall system statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const schools = await School.find({}).lean();
    const teachers = await Teacher.find({}).lean();
    const students = await Student.find({}).lean();
    const quizzes = await Quiz.find({}).lean();
    const sessions = await Session.find({}).lean();

    // Query for weak chapters - join with weak_topics
    const weakTopics = await WeakTopic.find({}).lean();
    
    res.json({
      total_schools: schools?.length || 0,
      total_teachers: teachers?.length || 0,
      total_students: students?.length || 0,
      total_quizzes: quizzes?.length || 0,
      total_sessions: sessions?.length || 0,
      weak_areas_count: weakTopics?.length || 0,
      system_status: 'operational',
      last_updated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/admin/dashboard/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * GET /api/admin/dashboard/schools-summary
 * Summary of all schools with teacher and student counts
 */
router.get('/dashboard/schools-summary', async (req, res) => {
  try {
    const schools = await School.find({}).lean();
    
    const schoolSummary = await Promise.all(
      (schools || []).map(async (school) => {
        const schoolTeachers = await Teacher.find({ school_id: school.id }).lean();
        const schoolStudents = await Student.find({ school_id: school.id }).lean();
        const schoolClasses = await Class.find({ school_id: school.id }).lean();
        
        return {
          school_id: school.id,
          name: school.name,
          code: school.code,
          teacher_count: schoolTeachers?.length || 0,
          student_count: schoolStudents?.length || 0,
          class_count: schoolClasses?.length || 0,
          district: school.district,
          state: school.state,
        };
      })
    );

    res.json(schoolSummary);
  } catch (err) {
    console.error('GET /api/admin/dashboard/schools-summary error:', err);
    res.status(500).json({ error: 'Failed to fetch schools summary' });
  }
});

/**
 * GET /api/admin/dashboard/teachers-summary
 * Summary of all teachers with assignment details
 */
router.get('/dashboard/teachers-summary', async (req, res) => {
  try {
    const teachers = await Teacher.find({}).lean();
    
    const teacherSummary = await Promise.all(
      (teachers || []).map(async (teacher) => {
        const classes = await Class.find({ teacher_id: teacher.id }).lean();
        const sessions = await Session.find({ teacher_id: teacher.id }).lean();
        
        return {
          teacher_id: teacher.id,
          name: teacher.full_name,
          email: teacher.email,
          school_id: teacher.school_id,
          classes_assigned: classes?.length || 0,
          sessions_conducted: sessions?.length || 0,
          status: 'active',
        };
      })
    );

    res.json(teacherSummary);
  } catch (err) {
    console.error('GET /api/admin/dashboard/teachers-summary error:', err);
    res.status(500).json({ error: 'Failed to fetch teachers summary' });
  }
});

/**
 * GET /api/admin/dashboard/attendance-summary
 * System-wide attendance statistics
 */
router.get('/dashboard/attendance-summary', async (req, res) => {
  try {
    const attendance = await SessionAttendance.find({}).lean();
    const totalAttendance = attendance?.length || 1;
    const presentCount = (attendance || []).filter(a => a.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(2) : 0;

    res.json({
      average_attendance_rate: parseFloat(attendanceRate),
      total_records: totalAttendance,
      present_count: presentCount,
      absent_count: totalAttendance - presentCount,
    });
  } catch (err) {
    console.error('GET /api/admin/dashboard/attendance-summary error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

/**
 * GET /api/admin/dashboard/quiz-completion
 * Quiz completion rate and performance
 */
router.get('/dashboard/quiz-completion', async (req, res) => {
  try {
    const quizzes = await Quiz.find({}).lean();
    const performances = await StudentPerformance.find({}).lean();

    const totalQuizzes = quizzes?.length || 1;
    const avgScore = performances?.length > 0 
      ? (performances.reduce((sum, p) => sum + (p.average_score || 0), 0) / performances.length).toFixed(2)
      : 0;

    res.json({
      completion_rate: ((quizzes?.length || 0) * 100 / (totalQuizzes)).toFixed(2),
      total_quizzes: totalQuizzes,
      average_score: parseFloat(avgScore),
      total_students_attempted: performances?.length || 0,
    });
  } catch (err) {
    console.error('GET /api/admin/dashboard/quiz-completion error:', err);
    res.status(500).json({ error: 'Failed to fetch quiz completion data' });
  }
});

/**
 * GET /api/admin/dashboard/live-sessions
 * Active and upcoming live sessions
 */
router.get('/dashboard/live-sessions', async (req, res) => {
  try {
    const sessions = await Session.find({}).lean();
    
    const sessionDetails = await Promise.all(
      (sessions || []).map(async (session) => {
        const teacher = await Teacher.findOne({ id: session.teacher_id }).lean();
        const cls = await Class.findOne({ id: session.class_id }).lean();
        const attendance = await SessionAttendance.find({ session_id: session.id }).lean();

        return {
          session_id: session.id,
          teacher: teacher?.full_name || 'Unknown',
          class: cls?.name || 'Unknown',
          date: session.session_date,
          time: session.session_time,
          duration: session.duration,
          attendance_marked: attendance?.length || 0,
          status: session.status || 'scheduled',
        };
      })
    );

    res.json(sessionDetails);
  } catch (err) {
    console.error('GET /api/admin/dashboard/live-sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch live sessions' });
  }
});

/**
 * GET /api/admin/dashboard/daily-active-students
 * Count of active students today
 */
router.get('/dashboard/daily-active-students', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await SessionAttendance.find({}).lean();
    
    const todayActive = (todayAttendance || []).filter(a => {
      const attendDate = a.marked_at ? a.marked_at.split('T')[0] : '';
      return attendDate === today;
    }).length;

    const students = await Student.find({}).lean();
    const totalStudents = students?.length || 1;

    res.json({
      active_today: todayActive,
      total_students: totalStudents,
      inactive_today: totalStudents - todayActive,
      percentage_active: ((todayActive / totalStudents) * 100).toFixed(2),
    });
  } catch (err) {
    console.error('GET /api/admin/dashboard/daily-active-students error:', err);
    res.status(500).json({ error: 'Failed to fetch daily active students' });
  }
});

/**
 * GET /api/admin/dashboard/weak-chapters
 * Chapters where students are performing weakly
 */
router.get('/dashboard/weak-chapters', async (req, res) => {
  try {
    const weakTopics = await WeakTopic.find({}).lean();
    
    // Group by topic to show weak areas
    const weakByTopic = (weakTopics || []).reduce((acc, wt) => {
      const key = wt.topic_id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(wt);
      return acc;
    }, {});

    const weakChapters = Object.entries(weakByTopic).map(([topicId, items]) => ({
      topic_id: topicId,
      weak_student_count: items.length,
      average_weakness_score: (items.reduce((sum, i) => sum + (i.weakness_score || 0), 0) / items.length).toFixed(2),
    }));

    res.json(weakChapters);
  } catch (err) {
    console.error('GET /api/admin/dashboard/weak-chapters error:', err);
    res.status(500).json({ error: 'Failed to fetch weak chapters data' });
  }
});

/**
 * GET /api/admin/dashboard/subject-performance
 * Performance metrics by subject
 */
router.get('/dashboard/subject-performance', async (req, res) => {
  try {
    const subjects = await Subject.find({}).lean();
    const performances = await StudentPerformance.find({}).lean();

    const subjectPerf = await Promise.all(
      (subjects || []).map(async (subject) => {
        const subjectPerformances = (performances || []).filter(p => p.subject_id === subject.id);
        const avgScore = subjectPerformances.length > 0
          ? (subjectPerformances.reduce((sum, p) => sum + (p.average_score || 0), 0) / subjectPerformances.length).toFixed(2)
          : 0;

        return {
          subject_id: subject.id,
          name: subject.name,
          average_score: parseFloat(avgScore),
          students_performing: subjectPerformances.length,
        };
      })
    );

    res.json(subjectPerf);
  } catch (err) {
    console.error('GET /api/admin/dashboard/subject-performance error:', err);
    res.status(500).json({ error: 'Failed to fetch subject performance' });
  }
});

/**
 * GET /api/admin/dashboard/top-students
 * Top performing students
 */
router.get('/dashboard/top-students', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const performances = await StudentPerformance.find({}).lean();
    
    const sorted = (performances || [])
      .sort((a, b) => (b.overall_percentage || 0) - (a.overall_percentage || 0))
      .slice(0, limit)
      .map(p => ({
        student_id: p.student_id,
        average_score: p.average_score,
        overall_percentage: p.overall_percentage,
        rank: p.rank_in_class,
      }));

    res.json(sorted);
  } catch (err) {
    console.error('GET /api/admin/dashboard/top-students error:', err);
    res.status(500).json({ error: 'Failed to fetch top students' });
  }
});

/**
 * GET /api/admin/dashboard/teacher-effectiveness
 * Teacher performance metrics
 */
router.get('/dashboard/teacher-effectiveness', async (req, res) => {
  try {
    const teachers = await Teacher.find({}).lean();
    
    const effectiveness = await Promise.all(
      (teachers || []).map(async (teacher) => {
        const sessions = await Session.find({ teacher_id: teacher.id }).lean();
        const students = await Student.find({}).lean();
        const performance = await StudentPerformance.find({}).lean();

        const avgStudentScore = performance.length > 0
          ? (performance.reduce((sum, p) => sum + (p.average_score || 0), 0) / performance.length).toFixed(2)
          : 0;

        return {
          teacher_id: teacher.id,
          name: teacher.full_name,
          sessions_conducted: sessions?.length || 0,
          students_taught: students?.length || 0,
          effectiveness_score: parseFloat(avgStudentScore),
        };
      })
    );

    res.json(effectiveness);
  } catch (err) {
    console.error('GET /api/admin/dashboard/teacher-effectiveness error:', err);
    res.status(500).json({ error: 'Failed to fetch teacher effectiveness' });
  }
});

/**
 * GET /api/admin/dashboard/class-status-overview
 * Class status summary (conducted, cancelled, scheduled)
 */
router.get('/dashboard/class-status-overview', async (req, res) => {
  try {
    const sessions = await Session.find({}).lean();
    
    const statusCounts = {
      conducted: (sessions || []).filter(s => s.status === 'completed').length,
      cancelled: (sessions || []).filter(s => s.status === 'cancelled').length,
      scheduled: (sessions || []).filter(s => s.status === 'scheduled').length,
    };

    res.json(statusCounts);
  } catch (err) {
    console.error('GET /api/admin/dashboard/class-status-overview error:', err);
    res.status(500).json({ error: 'Failed to fetch class status overview' });
  }
});

// ============================================
// ADMIN SCHOOLS MANAGEMENT (8 endpoints)
// ============================================

/**
 * GET /api/admin/schools
 * List all schools with pagination
 */
router.get('/schools', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    let schools = await School.find({}).lean();
    
    if (search) {
      schools = (schools || []).filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.code?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const paginated = (schools || []).slice(skip, skip + limit);

    res.json({
      total: schools?.length || 0,
      skip,
      limit,
      schools: paginated,
    });
  } catch (err) {
    console.error('GET /api/admin/schools error:', err);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

/**
 * GET /api/admin/schools/:id
 * Get specific school details
 */
router.get('/schools/:id', async (req, res) => {
  try {
    const school = await School.findOne({ id: req.params.id }).lean();
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const teachers = await Teacher.find({ school_id: school.id }).lean();
    const students = await Student.find({ school_id: school.id }).lean();
    const classes = await Class.find({ school_id: school.id }).lean();

    res.json({
      ...school,
      teachers_count: teachers?.length || 0,
      students_count: students?.length || 0,
      classes_count: classes?.length || 0,
    });
  } catch (err) {
    console.error('GET /api/admin/schools/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch school details' });
  }
});

/**
 * POST /api/admin/schools
 * Create new school
 */
router.post('/schools', async (req, res) => {
  try {
    const { name, code, district, state, address, phone, email } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }

    const school = await School.create({
      name,
      code,
      district: district || null,
      state: state || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
    });

    res.status(201).json({ message: 'School created successfully', school });
  } catch (err) {
    console.error('POST /api/admin/schools error:', err);
    res.status(500).json({ error: 'Failed to create school' });
  }
});

/**
 * PUT /api/admin/schools/:id
 * Update school
 */
router.put('/schools/:id', async (req, res) => {
  try {
    const { name, code, district, state, address, phone, email } = req.body;

    const school = await School.updateOne(
      { id: req.params.id },
      {
        name: name || undefined,
        code: code || undefined,
        district: district || undefined,
        state: state || undefined,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
      }
    );

    res.json({ message: 'School updated successfully', school });
  } catch (err) {
    console.error('PUT /api/admin/schools/:id error:', err);
    res.status(500).json({ error: 'Failed to update school' });
  }
});

/**
 * DELETE /api/admin/schools/:id
 * Delete school
 */
router.delete('/schools/:id', async (req, res) => {
  try {
    await School.deleteOne({ id: req.params.id });
    res.json({ message: 'School deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/admin/schools/:id error:', err);
    res.status(500).json({ error: 'Failed to delete school' });
  }
});

/**
 * GET /api/admin/schools/:id/classes
 * Get classes in a school
 */
router.get('/schools/:id/classes', async (req, res) => {
  try {
    const classes = await Class.find({ school_id: req.params.id }).lean();
    res.json(classes || []);
  } catch (err) {
    console.error('GET /api/admin/schools/:id/classes error:', err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

/**
 * GET /api/admin/schools/:id/performance-summary
 * School performance summary
 */
router.get('/schools/:id/performance-summary', async (req, res) => {
  try {
    const performances = await StudentPerformance.find({}).lean();
    
    const avgScore = performances.length > 0
      ? (performances.reduce((sum, p) => sum + (p.average_score || 0), 0) / performances.length).toFixed(2)
      : 0;

    res.json({
      average_score: parseFloat(avgScore),
      total_students: performances?.length || 0,
      attendance_rate: 85.5, // Mock data
    });
  } catch (err) {
    console.error('GET /api/admin/schools/:id/performance-summary error:', err);
    res.status(500).json({ error: 'Failed to fetch performance summary' });
  }
});

// ── Subjects / Chapters / Topics listing ─────────────────────
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({}).lean();
    res.json(subjects || []);
  } catch (err) {
    console.error('GET /api/admin/subjects error:', err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.get('/chapters', async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject_id) filter.subject_id = Number(req.query.subject_id);
    const chaptersAll = await Chapter.find(filter).lean();
    res.json(chaptersAll || []);
  } catch (err) {
    console.error('GET /api/admin/chapters error:', err);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

router.get('/topics', async (req, res) => {
  try {
    const filter = {};
    if (req.query.chapter_id) filter.chapter_id = Number(req.query.chapter_id);
    const topicsAll = await TopicModel.find(filter).lean();
    res.json(topicsAll || []);
  } catch (err) {
    console.error('GET /api/admin/topics error:', err);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

export default router;
