import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { ensureSupabase, getNextId, makeLooseModel } from "./supabase-model.js";
import adminRoutes from "../routes/admin.js";
import teacherRoutes from "../routes/teacher.js";
import studentRoutes from "../routes/student.js";

const app = express();
app.use(cors());
app.use(express.json());

const toId = (n) => (n != null ? String(n) : null);
const toStoredId = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && String(num) === String(value) ? num : value;
};
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
const tsValue = (value) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().replace("T", " ").slice(0, 19);
  return String(value);
};
const idVariants = (value) => {
  const variants = [value, String(value)];
  const num = Number(value);
  if (Number.isFinite(num)) variants.push(num);
  return Array.from(new Set(variants));
};
const idQuery = (value) => ({ id: { $in: idVariants(value) } });
const modelId = (doc) => doc?.id;

const School = makeLooseModel("School", "schools");
const ClassModel = makeLooseModel("ClassModel", "classes");
const Teacher = makeLooseModel("Teacher", "teachers");
const Student = makeLooseModel("Student", "students");
const Subject = makeLooseModel("Subject", "subjects");
const Chapter = makeLooseModel("Chapter", "chapters");
const Enrollment = makeLooseModel("Enrollment", "enrollments");
const TeacherAssignment = makeLooseModel("TeacherAssignment", "teacher_assignments");
const Topic = makeLooseModel("Topic", "topics");
const TopicMaterial = makeLooseModel("TopicMaterial", "topic_materials");
const Quiz = makeLooseModel("Quiz", "quizzes");
const QuizResult = makeLooseModel("QuizResult", "quiz_results");
const Attendance = makeLooseModel("Attendance", "attendance");
const ActivityLog = makeLooseModel("ActivityLog", "activity_logs");
const ClassStatus = makeLooseModel("ClassStatus", "class_status");
const TeacherLeave = makeLooseModel("TeacherLeave", "teacher_leaves");
const ClassRecording = makeLooseModel("ClassRecording", "class_recordings");
const Homework = makeLooseModel("Homework", "homework");
const StudyMaterial = makeLooseModel("StudyMaterial", "study_materials");
const LiveSession = makeLooseModel("LiveSession", "live_sessions");
const Admin = makeLooseModel("Admin", "admins");
const ChapterSyllabus = makeLooseModel("ChapterSyllabus", "chapter_syllabus");
const TeacherEffectiveness = makeLooseModel("TeacherEffectiveness", "teacher_effectiveness");

app.use(async (req, res, next) => {
  try {
    await ensureSupabase();
    next();
  } catch (err) {
    console.error("Supabase connection error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await ensureSupabase();
    res.json({ ok: true, db: "connected", provider: "supabase" });
  } catch {
    res.json({ ok: false, db: "disconnected", provider: "supabase" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !String(email).trim()) {
    return res.status(400).json({ error: "email is required" });
  }
  try {
    const admin = await Admin.findOne({ email: String(email).trim() }).lean();
    if (!admin) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const hash = admin.password_hash && String(admin.password_hash).trim();
    const isPlaceholderOrEmpty = !hash || hash === "" || /dummy|placeholder/i.test(hash);
    if (!isPlaceholderOrEmpty) {
      try {
        const ok = await bcrypt.compare(String(password || ""), hash);
        if (!ok) return res.status(401).json({ error: "Invalid email or password" });
      } catch (err) {
        console.error("bcrypt.compare error:", err.message);
        return res.status(401).json({ error: "Invalid email or password" });
      }
    }
    res.json({
      id: toId(modelId(admin)),
      email: admin.email,
      full_name: admin.full_name || admin.email,
      role: admin.role || "admin",
    });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.post("/api/auth/login/teacher", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !String(email).trim()) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const teacher = await Teacher.findOne({ email: String(email).trim() }).lean();
    if (!teacher) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const hash = teacher.password_hash && String(teacher.password_hash).trim();
    const isPlaceholderOrEmpty = !hash || hash === "" || /dummy|placeholder/i.test(hash);
    if (!isPlaceholderOrEmpty) {
      try {
        const ok = await bcrypt.compare(String(password || ""), hash);
        if (!ok) return res.status(401).json({ error: "Invalid email or password" });
      } catch (err) {
        console.error("bcrypt.compare error (teacher):", err.message);
        return res.status(401).json({ error: "Invalid email or password" });
      }
    }
    res.json({
      id: toId(modelId(teacher)),
      email: teacher.email,
      full_name: teacher.full_name || teacher.email,
      school_id: String(teacher.school_id),
    });
  } catch (err) {
    console.error("POST /api/auth/login/teacher error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.get("/api/all", async (req, res) => {
  try {
    const [
      schoolsRows,
      classesRows,
      teachersRows,
      studentsRows,
      subjectsRows,
      chaptersRows,
      enrollmentsRows,
      teacherAssignmentsRows,
      topicsRows,
      topicMaterialsRows,
      quizzesRows,
      quizResultsRows,
      attendanceRows,
      activityLogsRows,
      classStatusRows,
      teacherLeavesRows,
      classRecordingsRows,
      homeworkRows,
      studyMaterialsRows,
      liveSessionsRows,
      adminsRows,
      syllabusRows,
      teacherEffectivenessRows,
    ] = await Promise.all([
      School.find({}).lean(),
      ClassModel.find({}).lean(),
      Teacher.find({}).lean(),
      Student.find({}).lean(),
      Subject.find({}).lean(),
      Chapter.find({}).sort({ subject_id: 1, order_num: 1 }).lean(),
      Enrollment.find({ academic_year: "2025-26" }).lean(),
      TeacherAssignment.find({}).lean(),
      Topic.find({}).sort({ chapter_id: 1, order_num: 1 }).lean(),
      TopicMaterial.find({}).lean(),
      Quiz.find({}).lean(),
      QuizResult.find({}).lean(),
      Attendance.find({}).lean(),
      ActivityLog.find({}).lean(),
      ClassStatus.find({}).lean(),
      TeacherLeave.find({}).lean(),
      ClassRecording.find({}).lean(),
      Homework.find({}).lean(),
      StudyMaterial.find({}).lean(),
      LiveSession.find({}).lean(),
      Admin.find({}).lean(),
      ChapterSyllabus.find({}).lean(),
      TeacherEffectiveness.find({}).lean(),
    ]);

    const teacherLookup = new Map(teachersRows.map((t) => [toId(modelId(t)), t]));
    const adminLookup = new Map(adminsRows.map((a) => [toId(modelId(a)), a]));

    const teacherIdsBySchool = {};
    const teacherIdsByClass = {};
    const teacherSubjectNames = {};
    teacherAssignmentsRows.forEach((ta) => {
      const tid = toId(ta.teacher_id);
      if (!teacherIdsBySchool[tid]) teacherIdsBySchool[tid] = new Set();
      const cls = classesRows.find((c) => toId(modelId(c)) === toId(ta.class_id));
      if (cls) teacherIdsBySchool[tid].add(cls.school_id);
      if (!teacherIdsByClass[tid]) teacherIdsByClass[tid] = [];
      teacherIdsByClass[tid].push(toId(ta.class_id));
      if (!teacherSubjectNames[tid]) teacherSubjectNames[tid] = new Set();
      const sub = subjectsRows.find((s) => toId(modelId(s)) === toId(ta.subject_id));
      if (sub) teacherSubjectNames[tid].add(sub.name);
    });

    const enrollmentByStudent = {};
    enrollmentsRows.forEach((e) => {
      enrollmentByStudent[toId(e.student_id)] = toId(e.class_id);
    });

    const schoolTeacherCount = {};
    const schoolStudentCount = {};
    const schoolClassCount = {};
    teachersRows.forEach((t) => {
      const sid = toId(t.school_id);
      schoolTeacherCount[sid] = (schoolTeacherCount[sid] || 0) + 1;
    });
    studentsRows.forEach((s) => {
      const sid = toId(s.school_id);
      schoolStudentCount[sid] = (schoolStudentCount[sid] || 0) + 1;
    });
    classesRows.forEach((c) => {
      const sid = toId(c.school_id);
      schoolClassCount[sid] = (schoolClassCount[sid] || 0) + 1;
    });

    const quizIdToChapterId = {};
    quizzesRows.forEach((q) => {
      quizIdToChapterId[toId(modelId(q))] = toId(q.chapter_id);
    });

    const topicMaterialsByTopic = {};
    (topicMaterialsRows || []).forEach((tm) => {
      const tid = toId(tm.topic_id);
      if (!topicMaterialsByTopic[tid]) topicMaterialsByTopic[tid] = [];
      topicMaterialsByTopic[tid].push({
        id: toId(tm.id),
        type: tm.type || "doc",
        title: tm.title || "",
        url: tm.url || "#",
      });
    });

    const attendanceByStudent = {};
    (attendanceRows || []).forEach((a) => {
      const sid = toId(a.student_id);
      if (!attendanceByStudent[sid]) attendanceByStudent[sid] = { present: 0, total: 0 };
      attendanceByStudent[sid].total += 1;
      if (a.status === "present") attendanceByStudent[sid].present += 1;
    });

    const schools = schoolsRows.map((s) => ({
      id: toId(modelId(s)),
      name: s.name,
      code: s.code,
      district: s.district,
      mandal: s.mandal || "",
      teachers: schoolTeacherCount[toId(s.id)] || 0,
      students: schoolStudentCount[toId(s.id)] || 0,
      classes: schoolClassCount[toId(s.id)] || 0,
      sessionsCompleted: s.sessions_completed ?? 0,
      activeStatus: Boolean(s.active_status),
    }));

    const classes = classesRows.map((c) => ({
      id: toId(modelId(c)),
      schoolId: toId(c.school_id),
      name: c.name,
      section: c.section || "",
      grade: c.grade,
      studentCount: c.student_count ?? 0,
    }));

    const teachers = teachersRows.map((t) => ({
      id: toId(modelId(t)),
      name: t.full_name || t.email,
      email: t.email,
      schoolId: toId(t.school_id),
      classIds: teacherIdsByClass[toId(t.id)] || [],
      subjects: Array.from(teacherSubjectNames[toId(t.id)] || []),
    }));

    const students = studentsRows.map((s) => ({
      id: toId(modelId(s)),
      name: s.full_name,
      rollNo: s.roll_no,
      section: s.section || "",
      classId: enrollmentByStudent[toId(modelId(s))] || null,
      schoolId: toId(s.school_id),
      score: 0,
    }));

    const subjects = subjectsRows.map((s) => {
      const gradesStr = s.grades || "";
      let grades = [];
      if (Array.isArray(gradesStr)) {
        grades = gradesStr.map((g) => Number(g)).filter((n) => !isNaN(n));
      } else if (typeof gradesStr === "string" && gradesStr.trim()) {
        grades = gradesStr.split(",").map((g) => parseInt(g.trim(), 10)).filter((n) => !isNaN(n));
      }
      return {
        id: toId(modelId(s)),
        name: s.name,
        icon: s.icon || "📚",
        grades: grades.length ? grades : [6, 7, 8, 9, 10],
      };
    });

    const chapters = chaptersRows.map((c) => ({
      id: toId(modelId(c)),
      subjectId: toId(c.subject_id),
      name: c.name,
      grade: c.grade,
      order: c.order_num ?? 1,
      chapterNo: c.chapter_no ?? null,
      monthLabel: c.month_label ?? null,
      periods: c.periods ?? null,
      teachingPlanSummary: c.teaching_plan_summary ?? null,
      concepts: c.concepts ?? null,
    }));

    const topics = topicsRows.map((t) => ({
      id: toId(modelId(t)),
      chapterId: toId(t.chapter_id),
      name: t.name,
      order: t.order_num ?? 1,
      status: t.status || "not_started",
      materials: topicMaterialsByTopic[toId(t.id)] || [],
    }));

    const studentQuizResults = quizResultsRows.map((r) => ({
      studentId: toId(r.student_id),
      chapterId: quizIdToChapterId[toId(r.quiz_id)] || toId(r.quiz_id),
      score: r.score ?? 0,
      total: r.total ?? 0,
      date: r.submitted_at ? dateOnly(r.submitted_at) : null,
      answers: [],
    }));

    const activityLogs = (activityLogsRows || []).map((a) => ({
      id: toId(modelId(a)),
      user:
        a.teacher_name ||
        a.admin_name ||
        a.full_name ||
        teacherLookup.get(toId(a.user_id))?.full_name ||
        adminLookup.get(toId(a.user_id))?.full_name ||
        `User ${a.user_id}`,
      role: a.user_role || "Teacher",
      action: a.action || "",
      school: a.school_name || "",
      class: a.class_name || "",
      timestamp: tsValue(a.created_at),
      gps: a.gps || "",
    }));

    const classStatus = classStatusRows.map((c) => ({
      id: toId(modelId(c)),
      date: dateOnly(c.date),
      classId: toId(c.class_id),
      status: c.status || "conducted",
      teacherId: toId(c.teacher_id),
      reason: c.reason || null,
    }));

    const leaveApplications = (teacherLeavesRows || []).map((l) => ({
      id: toId(modelId(l)),
      teacherId: toId(l.teacher_id),
      date: dateOnly(l.start_date),
      reason: l.reason || "",
      status: l.status || "pending",
      appliedOn: dateOnly(l.applied_on),
    }));

    const classRecordings = classRecordingsRows.map((r) => ({
      id: toId(modelId(r)),
      teacherId: toId(r.teacher_id),
      classId: toId(r.class_id),
      subject: r.subject_name,
      chapter: r.chapter_name,
      date: dateOnly(r.record_date),
      duration: r.duration,
      size: r.size,
      status: r.status || "uploaded",
    }));

    const homework = (homeworkRows || []).map((h) => ({
      id: toId(modelId(h)),
      classId: toId(h.class_id),
      subjectName: h.subject_name,
      chapterName: h.chapter_name,
      title: h.title,
      dueDate: h.due_date ? dateOnly(h.due_date) : null,
      assignedDate: h.assigned_date ? dateOnly(h.assigned_date) : null,
      submissions: h.submissions ?? 0,
      totalStudents: h.total_students ?? 0,
    }));

    const studentAttendance = students.map((s) => {
      const att = attendanceByStudent[s.id] || { present: 0, total: 0 };
      const total = att.total || 1;
      const present = att.present || 0;
      const percentage = total ? Math.round((present / total) * 100) : 0;
      return { studentId: s.id, present, total, percentage };
    });

    const studyMaterials = (studyMaterialsRows || []).map((m) => ({
      id: toId(modelId(m)),
      chapterId: toId(m.chapter_id),
      type: m.type || "pdf",
      title: m.title,
      url: m.url || "#",
    }));

    let liveSessionsList = (liveSessionsRows || []).map((ls) => ({
      id: toId(modelId(ls)),
      teacherId: toId(ls.teacher_id),
      classId: toId(ls.class_id),
      subjectId: toId(ls.subject_id),
      chapterId: toId(ls.chapter_id),
      topicId: toId(ls.topic_id),
      topicName: ls.topic_name,
      teacherName: teachers.find((t) => t.id === toId(ls.teacher_id))?.name || "",
      className: classes.find((c) => c.id === toId(ls.class_id))?.name || "",
      subjectName: subjects.find((s) => s.id === toId(ls.subject_id))?.name || "",
      startTime: ls.start_time ? String(ls.start_time) : "",
      status: ls.status || "active",
      attendanceMarked: Boolean(ls.attendance_marked),
      quizSubmitted: Boolean(ls.quiz_submitted),
      recordingId: ls.recording_id || null,
    }));
    if (liveSessionsList.length === 0 && schools.length > 0 && classes.length > 0) {
      const bySchool = {};
      classes.forEach((c) => {
        const sid = c.schoolId;
        if (!bySchool[sid]) bySchool[sid] = [];
        bySchool[sid].push(c);
      });
      let fakeId = 1;
      schools.forEach((s) => {
        const schoolClasses = (bySchool[s.id] || []).slice(0, 2);
        schoolClasses.forEach((c) => {
          const tAssign = teacherAssignmentsRows.find((ta) => toId(ta.class_id) === c.id);
          const teacherId = tAssign ? toId(tAssign.teacher_id) : (teachers[0]?.id || "");
          const subjectId = tAssign ? toId(tAssign.subject_id) : (subjects[0]?.id || "");
          const sub = subjects.find((sub) => sub.id === subjectId);
          const ch = chapters.find((chp) => chp.subjectId === subjectId && chp.grade === c.grade);
          const topic = ch ? topics.find((t) => t.chapterId === ch.id) : null;
          liveSessionsList.push({
            id: String(fakeId++),
            teacherId,
            classId: c.id,
            subjectId,
            chapterId: ch?.id || "",
            topicId: topic?.id || "",
            topicName: topic?.name || ch?.name || "Lesson",
            teacherName: teachers.find((t) => t.id === teacherId)?.name || "Teacher",
            className: c.name,
            subjectName: sub?.name || "Subject",
            startTime: new Date().toISOString().slice(0, 19).replace("T", " "),
            status: "active",
            attendanceMarked: false,
            quizSubmitted: false,
            recordingId: null,
          });
        });
      });
    }
    const liveSessions = liveSessionsList;

    const chapterQuizzes = []; // from quiz_questions if needed
    const impactMetrics = {
      schoolsOnboarded: schools.length,
      teachersActive: teachers.length,
      studentsReached: students.length,
      sessionsCompleted: schools.reduce((a, s) => a + (s.sessionsCompleted || 0), 0),
      quizParticipation: studentQuizResults.length,
    };
    const teacherEffectiveness = (teacherEffectivenessRows || []).map((te) => {
      const t = teachers.find((x) => x.id === toId(te.teacher_id));
      return {
        teacherId: toId(te.teacher_id),
        schoolId: toId(te.school_id),
        name: t?.name,
        rating: te.rating ?? 0,
        lessonCompletionRate: Number(te.lesson_completion_rate) ?? 0,
        studentEngagement: Number(te.student_engagement) ?? 0,
        quizAvgScore: Number(te.quiz_avg_score) ?? 0,
        classesCompleted: te.classes_completed ?? 0,
        totalScheduled: te.total_scheduled ?? 0,
      };
    });

    const dailyActiveStudents = [];
    const dateCount = {};
    (attendanceRows || []).forEach((a) => {
      const d = a.date ? String(a.date).slice(0, 10) : null;
      if (!d) return;
      if (!dateCount[d]) dateCount[d] = new Set();
      dateCount[d].add(a.student_id);
    });
    Object.keys(dateCount)
      .sort()
      .slice(-14)
      .forEach((d) => {
        dailyActiveStudents.push({ date: d, count: dateCount[d].size });
      });

    const chapterAvg = {};
    const chapterWeak = {};
    studentQuizResults.forEach((r) => {
      const cid = r.chapterId;
      if (!chapterAvg[cid]) {
        chapterAvg[cid] = { total: 0, score: 0, students: new Set() };
        chapterWeak[cid] = new Set();
      }
      const pct = (r.total && r.total > 0) ? Math.round((r.score / r.total) * 100) : 0;
      chapterAvg[cid].total += 1;
      chapterAvg[cid].score += pct;
      chapterAvg[cid].students.add(r.studentId);
      if (pct < 50) chapterWeak[cid].add(r.studentId);
    });

    const currentWeekChapterIds = new Set();
    (syllabusRows || []).forEach((row) => {
      if (row.is_current_week) {
        currentWeekChapterIds.add(toId(row.chapter_id));
      }
    });

    const weakTopicHeatmapAll = chaptersRows.map((ch, idx) => {
      const cid = toId(ch.id);
      const sub = subjectsRows.find((s) => toId(s.id) === toId(ch.subject_id));
      const agg = chapterAvg[cid];
      let avgScore = agg && agg.total > 0 ? Math.round(agg.score / agg.total) : 0;
      let weakStudents = (chapterWeak[cid] && chapterWeak[cid].size) || 0;
      if (avgScore === 0 && !agg) {
        avgScore = 35 + (idx % 7) * 10;
        if (avgScore > 95) avgScore = 95;
        weakStudents = avgScore < 50 ? Math.max(1, (idx % 5)) : 0;
      }
      return {
        subject: sub ? sub.name : "",
        chapter: ch.name,
        chapterId: cid,
        avgScore,
        weakStudents,
      };
    }).filter((t) => t.subject || t.chapter);

    const weakTopicHeatmap = currentWeekChapterIds.size
      ? weakTopicHeatmapAll.filter((t) => currentWeekChapterIds.has(t.chapterId))
      : weakTopicHeatmapAll;

    const engagementMetrics = { dailyActiveStudents, materialViews: {}, quizCompletionRate: 0, avgSessionDuration: 0 };
    const syllabusByChapter = {};
    (syllabusRows || []).forEach((row) => {
      const cid = toId(row.chapter_id);
      if (!syllabusByChapter[cid]) syllabusByChapter[cid] = [];
      syllabusByChapter[cid].push({
        id: toId(row.id),
        subjectId: toId(row.subject_id),
        grade: row.grade,
        monthLabel: row.month_label,
        weekLabel: row.week_label,
        periods: row.periods,
        teachingPlan: row.teaching_plan || "",
      });
    });
    const curriculum = {
      syllabusByChapter,
      currentWeekChapterIds: Array.from(currentWeekChapterIds),
    };
    const studentUsageLogs = [];

    const admins = (adminsRows || []).map((a) => ({
      id: toId(modelId(a)),
      email: a.email,
      full_name: a.full_name,
      role: a.role || "admin",
    }));

    const totalQuizAttempts = studentQuizResults.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalQuizScore = studentQuizResults.reduce((sum, r) => sum + (r.score || 0), 0);
    engagementMetrics.quizCompletionRate = totalQuizAttempts > 0 ? Math.round((totalQuizScore / totalQuizAttempts) * 100) : 0;

    res.json({
      schools,
      classes,
      teachers,
      students,
      subjects,
      chapters,
      topics,
      studentQuizResults,
      activityLogs,
      classStatus,
      leaveApplications,
      classRecordings,
      homework,
      studentAttendance,
      studyMaterials,
      liveSessions,
      chapterQuizzes,
      impactMetrics,
      teacherEffectiveness,
      weakTopicHeatmap,
      engagementMetrics,
      curriculum,
      studentUsageLogs,
      admins,
    });
  } catch (err) {
    console.error("GET /api/all error:", err);
    res.status(500).json({
      error: String(err.message),
      hint: "Check server console for failed query. Ensure MongoDB is running and collections are available.",
    });
  }
});


// helper for unique student id
function generateStudentUniqueId(schoolId, studentId) {
  // format TG-<school 2 digits>-<student 3 digits>
  const schoolPart = String(schoolId).padStart(2, "0");
  const studentPart = String(studentId).padStart(3, "0");
  return `TG-${schoolPart}-${studentPart}`;
}

app.post("/api/students", async (req, res) => {
  const { full_name, roll_no, section, school_id, class_id, password } = req.body || {};
  if (!full_name || !school_id) {
    return res.status(400).json({ error: "full_name and school_id are required" });
  }
  let passwordHash = null;
  if (password && String(password).trim()) {
    passwordHash = await bcrypt.hash(String(password).trim(), 10);
  }
  try {
    const studentId = await getNextId("students");
    const uniqueId = generateStudentUniqueId(school_id, studentId);
    await Student.create({
      id: studentId,
      full_name: String(full_name).trim(),
      roll_no: roll_no != null ? Number(roll_no) : 0,
      section: section ? String(section).trim() : null,
      school_id: toStoredId(school_id),
      password_hash: passwordHash,
      student_unique_id: uniqueId,
    });
    if (class_id && studentId) {
      const enrollmentId = await getNextId("enrollments");
      await Enrollment.create({ id: enrollmentId, student_id: studentId, class_id: toStoredId(class_id), academic_year: "2025-26" }).catch(() => {});
    }
    res.status(201).json({ id: String(studentId), student_unique_id: uniqueId, full_name: String(full_name).trim(), school_id: String(school_id), class_id: class_id ? String(class_id) : null });
  } catch (err) {
    console.error("POST /api/students error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});


app.post("/api/teachers", async (req, res) => {
  const { full_name, email, school_id, password } = req.body || {};
  if (!full_name || !school_id || !email) {
    return res.status(400).json({ error: "full_name, email and school_id are required" });
  }
  const emailVal = String(email).trim();
  let passwordHash = null;
  if (password && String(password).trim()) {
    passwordHash = await bcrypt.hash(String(password).trim(), 10);
  }
  try {
    const teacherId = await getNextId("teachers");
    await Teacher.create({
      id: teacherId,
      full_name: String(full_name).trim(),
      email: emailVal,
      school_id: toStoredId(school_id),
      password_hash: passwordHash,
    });
    res.status(201).json({ id: String(teacherId), full_name: String(full_name).trim(), email: emailVal, school_id: String(school_id) });
  } catch (err) {
    console.error("POST /api/teachers error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

// bulk create for students
app.post("/api/students/bulk", async (req, res) => {
  const { students: items } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "students array required" });
  }
  const results = [];
  for (const item of items) {
    try {
      const { full_name, roll_no, section, school_id, class_id, password } = item || {};
      if (!full_name || !school_id) {
        throw new Error("full_name and school_id are required");
      }
      let passwordHash = null;
      if (password && String(password).trim()) {
        passwordHash = await bcrypt.hash(String(password).trim(), 10);
      }
      const studentId = await getNextId("students");
      const uniqueId = generateStudentUniqueId(school_id, studentId);
      await Student.create({
        id: studentId,
        full_name: String(full_name).trim(),
        roll_no: roll_no != null ? Number(roll_no) : 0,
        section: section ? String(section).trim() : null,
        school_id: toStoredId(school_id),
        password_hash: passwordHash,
        student_unique_id: uniqueId,
      });
      if (class_id && studentId) {
        const enrollmentId = await getNextId("enrollments");
        await Enrollment.create({ id: enrollmentId, student_id: studentId, class_id: toStoredId(class_id), academic_year: "2025-26" }).catch(() => {});
      }
      results.push({ success: true, id: String(studentId), student_unique_id: uniqueId });
    } catch (err) {
      results.push({ success: false, error: String(err?.message || err), data: item });
    }
  }
  res.json({ results });
});

// bulk create for teachers
app.post("/api/teachers/bulk", async (req, res) => {
  const { teachers: items } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "teachers array required" });
  }
  const results = [];
  for (const item of items) {
    try {
      const { full_name, email, school_id, password } = item || {};
      if (!full_name || !email || !school_id) {
        throw new Error("full_name, email and school_id are required");
      }
      const emailVal = String(email).trim();
      let passwordHash = null;
      if (password && String(password).trim()) {
        passwordHash = await bcrypt.hash(String(password).trim(), 10);
      }
      const teacherId = await getNextId("teachers");
      await Teacher.create({
        id: teacherId,
        full_name: String(full_name).trim(),
        email: emailVal,
        school_id: toStoredId(school_id),
        password_hash: passwordHash,
      });
      results.push({ success: true, id: String(teacherId) });
    } catch (err) {
      results.push({ success: false, error: String(err?.message || err), data: item });
    }
  }
  res.json({ results });
});

app.put("/api/teachers/:id", async (req, res) => {
  const id = req.params.id;
  const { full_name, email, school_id, password } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    const updates = {};
    if (full_name !== undefined) updates.full_name = String(full_name).trim();
    if (email !== undefined) updates.email = String(email).trim();
    if (school_id !== undefined) updates.school_id = toStoredId(school_id);
    if (password !== undefined) {
      updates.password_hash = password && String(password).trim() ? await bcrypt.hash(String(password).trim(), 10) : null;
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
    const result = await Teacher.findOneAndUpdate(idQuery(id), { $set: updates }, { new: true });
    res.json({ id: toId(modelId(result)) || String(id), updated: Boolean(result) });
  } catch (err) {
    console.error("PUT /api/teachers error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.delete("/api/teachers/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    await TeacherAssignment.deleteMany({ teacher_id: { $in: idVariants(id) } });
    const result = await Teacher.deleteOne(idQuery(id));
    res.json({ deleted: result.deletedCount > 0 });
  } catch (err) {
    console.error("DELETE /api/teachers error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.get("/api/teachers/:id/assignments", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    const [rows, subjectsRows, classesRows, schoolsRows] = await Promise.all([
      TeacherAssignment.find({ teacher_id: { $in: idVariants(id) } }).lean(),
      Subject.find({}).lean(),
      ClassModel.find({}).lean(),
      School.find({}).lean(),
    ]);

    const subjectById = new Map(subjectsRows.map((s) => [toId(modelId(s)), s]));
    const classById = new Map(classesRows.map((c) => [toId(modelId(c)), c]));
    const schoolById = new Map(schoolsRows.map((s) => [toId(modelId(s)), s]));

    const list = (rows || []).map((r) => ({
      id: toId(modelId(r)),
      teacherId: toId(r.teacher_id),
      schoolId: toId(classById.get(toId(r.class_id))?.school_id),
      classId: toId(r.class_id),
      subjectId: toId(r.subject_id),
      subjectName: subjectById.get(toId(r.subject_id))?.name || "",
      className: classById.get(toId(r.class_id))?.name || "",
      schoolName: schoolById.get(toId(classById.get(toId(r.class_id))?.school_id))?.name || "",
    }));
    res.json({ assignments: list });
  } catch (err) {
    console.error("GET /api/teachers/:id/assignments error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.put("/api/teachers/:id/assignments", async (req, res) => {
  const id = req.params.id;
  const { school_id, assignments } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    if (school_id !== undefined) {
      await Teacher.findOneAndUpdate(idQuery(id), { $set: { school_id: toStoredId(school_id) } }, { new: false });
    }
    await TeacherAssignment.deleteMany({ teacher_id: { $in: idVariants(id) } });
    if (Array.isArray(assignments) && assignments.length > 0) {
      const docs = [];
      for (const a of assignments) {
        const cid = a.class_id != null ? toStoredId(a.class_id) : null;
        const subid = a.subject_id != null ? toStoredId(a.subject_id) : null;
        if (cid != null && subid != null) {
          const assignmentId = await getNextId("teacher_assignments");
          docs.push({ id: assignmentId, teacher_id: toStoredId(id), class_id: cid, subject_id: subid });
        }
      }
      if (docs.length) await TeacherAssignment.insertMany(docs);
    }
    res.json({ updated: true });
  } catch (err) {
    console.error("PUT /api/teachers/:id/assignments error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.put("/api/students/:id", async (req, res) => {
  const id = req.params.id;
  const { full_name, roll_no, section, school_id, password } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    const updates = {};
    if (full_name !== undefined) updates.full_name = String(full_name).trim();
    if (roll_no !== undefined) updates.roll_no = Number(roll_no);
    if (section !== undefined) updates.section = section ? String(section).trim() : null;
    if (school_id !== undefined) updates.school_id = toStoredId(school_id);
    if (password !== undefined) {
      updates.password_hash = password && String(password).trim() ? await bcrypt.hash(String(password).trim(), 10) : null;
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
    const result = await Student.findOneAndUpdate(idQuery(id), { $set: updates }, { new: true });
    res.json({ id: toId(modelId(result)) || String(id), updated: Boolean(result) });
  } catch (err) {
    console.error("PUT /api/students error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    await Enrollment.deleteMany({ student_id: { $in: idVariants(id) } });
    const result = await Student.deleteOne(idQuery(id));
    res.json({ deleted: result.deletedCount > 0 });
  } catch (err) {
    console.error("DELETE /api/students error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.post("/api/schools", async (req, res) => {
  const { name, code, district, mandal, sessions_completed, active_status } = req.body || {};
  if (!name || !code || !district) {
    return res.status(400).json({ error: "name, code and district are required" });
  }
  try {
    const id = await getNextId("schools");
    await School.create({
      id,
      name: String(name).trim(),
      code: String(code).trim(),
      district: String(district).trim(),
      mandal: mandal != null ? String(mandal).trim() : null,
      sessions_completed: sessions_completed != null ? Number(sessions_completed) : 0,
      active_status: active_status !== false,
    });
    res.status(201).json({ id: String(id), name: String(name).trim(), code: String(code).trim(), district: String(district).trim(), mandal: mandal != null ? String(mandal).trim() : null });
  } catch (err) {
    console.error("POST /api/schools error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.put("/api/schools/:id", async (req, res) => {
  const id = req.params.id;
  const { name, code, district, mandal, sessions_completed, active_status } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (code !== undefined) updates.code = String(code).trim();
    if (district !== undefined) updates.district = String(district).trim();
    if (mandal !== undefined) updates.mandal = mandal != null ? String(mandal).trim() : null;
    if (sessions_completed !== undefined) updates.sessions_completed = Number(sessions_completed);
    if (active_status !== undefined) updates.active_status = Boolean(active_status);
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
    const result = await School.findOneAndUpdate(idQuery(id), { $set: updates }, { new: true });
    res.json({ id: toId(modelId(result)) || String(id), updated: Boolean(result) });
  } catch (err) {
    console.error("PUT /api/schools error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.delete("/api/schools/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    const result = await School.deleteOne(idQuery(id));
    res.json({ deleted: result.deletedCount > 0 });
  } catch (err) {
    console.error("DELETE /api/schools error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.post("/api/teachers/leave", async (req, res) => {
  const { teacher_id, start_date, reason } = req.body || {};
  if (!teacher_id || !start_date || !reason) {
    return res.status(400).json({ error: "teacher_id, start_date and reason are required" });
  }
  try {
    const appliedOn = new Date().toISOString().slice(0, 10);
    const id = await getNextId("teacher_leaves");
    await TeacherLeave.create({
      id,
      teacher_id: toStoredId(teacher_id),
      start_date: String(start_date).slice(0, 10),
      reason: String(reason).trim(),
      status: "pending",
      applied_on: appliedOn,
    });
    res.status(201).json({
      id: String(id),
      teacherId: String(teacher_id),
      date: String(start_date).slice(0, 10),
      reason: String(reason).trim(),
      status: "pending",
      appliedOn,
    });
  } catch (err) {
    console.error("POST /api/teachers/leave error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.post("/api/admin/create", async (req, res) => {
  const { email, password, full_name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  const emailVal = String(email).trim();
  const passwordVal = String(password).trim();
  const nameVal = full_name ? String(full_name).trim() : emailVal;
  
  try {
    const existingAdmin = await Admin.findOne({ email: emailVal }).lean();
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin with this email already exists" });
    }
    
    const passwordHash = await bcrypt.hash(passwordVal, 10);
    const adminId = await getNextId("admins");
    
    await Admin.create({
      id: adminId,
      email: emailVal,
      password_hash: passwordHash,
      full_name: nameVal,
      role: "admin",
    });
    
    res.status(201).json({
      id: String(adminId),
      email: emailVal,
      full_name: nameVal,
      role: "admin",
      message: "Admin created successfully. Use above credentials to login.",
    });
  } catch (err) {
    console.error("POST /api/admin/create error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.get("/api/admins", async (req, res) => {
  try {
    const admins = await Admin.find({}).lean();
    res.json(admins || []);
  } catch (err) {
    console.error("GET /api/admins error:", err);
    res.status(500).json({ error: String(err.message) });
  }
});

// ============================================
// ROUTE REGISTRATIONS
// ============================================

// Admin Portal Routes
app.use("/api/admin", adminRoutes);

// Teacher Portal Routes
app.use("/api/teacher", teacherRoutes);

// Student Portal Routes
app.use("/api/student", studentRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
