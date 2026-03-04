import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import AIAssistant from "@/components/AIAssistant";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAppData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { createLeaveApplication } from "@/api/client";

type TopicLike = { id: string; chapterId: string; name: string; order: number; status: string; materials: Array<{ id: string; type: string; title: string; url: string }> };
type LiveSessionLike = { id: string; teacherId: string; classId: string; subjectId: string; chapterId: string; topicId: string; topicName: string; teacherName: string; className: string; subjectName: string; startTime: string; status: string; attendanceMarked: boolean; quizSubmitted: boolean };
import {
  BookOpen, Bot, Play, QrCode, CheckCircle2, XCircle, Lightbulb,
  Video, VideoOff, CalendarOff, CalendarCheck, FileText, Upload,
  Clock, ArrowLeft, ChevronRight, Trophy, Presentation, Image,
  PlayCircle, Film, FileDown, ChevronDown, Users, Radio,
  Microscope, Globe, Sparkles, Brain, BarChart3, MonitorPlay
} from "lucide-react";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const statusColors = {
  completed: { bg: "bg-success-light", text: "text-success", label: "Completed", color: "hsl(var(--success))" },
  in_progress: { bg: "bg-amber-light", text: "text-amber", label: "In Progress", color: "hsl(var(--amber))" },
  not_started: { bg: "bg-secondary", text: "text-muted-foreground", label: "Not Started", color: "hsl(var(--border))" },
};

const materialTypeIcons: Record<string, typeof FileText> = {
  ppt: Presentation, pdf: FileText, video: PlayCircle, image: Image,
  ai_video: Film, recording: Video, doc: FileText, notes: FileText,
  simulation: Microscope, vr: Globe,
};

const TeacherDashboard = () => {
  const [aiOpen, setAiOpen] = useState(false);
  const [lessonPlanOpen, setLessonPlanOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, refetch } = useAppData();
  const { userName, teacherId, role } = useAuth();

  const classes = data.classes;
  const subjects = data.subjects;
  const chapters = data.chapters;
  const topics = data.topics as TopicLike[];
  const students = data.students;
  const schools = data.schools;
  const classStatusFromApi = data.classStatus;
  const leaveApplications = data.leaveApplications;
  const studentAttendance = data.studentAttendance;
  const studentQuizResults = data.studentQuizResults;
  const studyMaterials = data.studyMaterials;
  const liveSessionsFromApi = data.liveSessions as LiveSessionLike[];
  const chapterQuizzes = data.chapterQuizzes || [];
  const studentUsageLogs = (data.studentUsageLogs || []) as Array<{ studentId: string; date: string; minutes: number }>;

  const urlClass = searchParams.get("class") || "";
  const urlSubject = searchParams.get("subject") || "";

  const [selectedClass, setSelectedClass] = useState<string>(urlClass);
  const [selectedSubject, setSelectedSubject] = useState<string>(urlSubject);

  useEffect(() => {
    setSelectedClass(urlClass);
    setSelectedSubject(urlSubject);
  }, [urlClass, urlSubject]);

  const currentClass = useMemo(() => classes.find((c) => c.id === selectedClass), [classes, selectedClass]);
  const grade = currentClass?.grade ?? 8;
  const currentSubject = useMemo(() => subjects.find((s) => s.id === selectedSubject), [subjects, selectedSubject]);

  useEffect(() => {
    if (role !== "teacher") return;
    if (!selectedClass || !selectedSubject || !currentClass || !currentSubject) {
      navigate("/teacher/setup", { replace: true });
    }
  }, [role, selectedClass, selectedSubject, currentClass, currentSubject, navigate]);

  const [chapterStatusState, setChapterStatusState] = useState<Record<string, string>>({});
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const filteredChaptersForTopics = useMemo(
    () => chapters.filter((ch) => ch.subjectId === selectedSubject && ch.grade === grade),
    [chapters, selectedSubject, grade]
  );
  const topicIdsForFilteredChapters = useMemo(
    () => new Set(topics.filter((t) => filteredChaptersForTopics.some((c) => c.id === t.chapterId)).map((t) => t.id)),
    [topics, filteredChaptersForTopics]
  );
  const [topicStatusState, setTopicStatusState] = useState<Record<string, string>>({});
  useEffect(() => {
    const initial: Record<string, string> = {};
    topics.forEach((t) => {
      if (topicIdsForFilteredChapters.has(t.id)) initial[t.id] = t.status || "not_started";
    });
    setTopicStatusState((prev) => ({ ...initial, ...prev }));
  }, [topics, topicIdsForFilteredChapters]);

  const filteredChapters = filteredChaptersForTopics;

  const [activeSession, setActiveSession] = useState<LiveSessionLike | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionAttendance, setSessionAttendance] = useState<Record<string, boolean>>({});
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [sessionQuizDone, setSessionQuizDone] = useState(false);

  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const classStatusState = useMemo(
    () =>
      classStatusFromApi.filter((cs) => cs.classId === selectedClass) as Array<{
        id: string;
        date: string;
        classId: string;
        status: "conducted" | "cancelled";
        teacherId: string;
        reason?: string;
      }>,
    [classStatusFromApi, selectedClass]
  );
  const [classStatusLocal, setClassStatusLocal] = useState<typeof classStatusState>([]);
  useEffect(() => {
    setClassStatusLocal(classStatusState);
  }, [classStatusState]);

  const leaves = useMemo(() => leaveApplications.filter((l) => l.teacherId === teacherId), [leaveApplications, teacherId]);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const [activities] = useState<Array<{ id: string; title: string; description: string; date: string; status: string; icon: string; registrations: number }>>([]);
  const [registrations, setRegistrations] = useState<Array<{ activityId: string; studentId: string; status: string }>>([]);

  // state for inline registration form
  const [registeringActivity, setRegisteringActivity] = useState<string | null>(null);
  const [registerStudentId, setRegisterStudentId] = useState("");
  const [viewingActivityRegistrations, setViewingActivityRegistrations] = useState<string | null>(null);

  const beginRegister = (activityId: string) => {
    setRegisteringActivity(activityId);
    setRegisterStudentId("");
  };

  const confirmRegister = () => {
    if (!registeringActivity || !registerStudentId) {
      setRegisteringActivity(null);
      return;
    }
    // increment count on activity
    setActivities(prev =>
      prev.map(a =>
        a.id === registeringActivity
          ? { ...a, registrations: a.registrations + 1 }
          : a
      )
    );
    // record registration details
    setRegistrations(prev => [
      ...prev,
      { activityId: registeringActivity, studentId: registerStudentId, status: "registered" as const },
    ]);
    setRegisteringActivity(null);
    setRegisterStudentId("");
  };

  const classStudents = useMemo(() => students.filter((s) => s.classId === selectedClass), [students, selectedClass]);

  const downloadClassCsv = useCallback(() => {
    if (!classStudents.length || !currentClass) return;
    const rows: string[] = [];
    const header = ["Student ID", "Name", "Roll No", "Section", "Class", "School", "Quiz %", "Attendance %", "Avg Usage (min)"];
    const escape = (val: unknown) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    rows.push(header.join(","));
    const schoolName = schools.find((sc) => sc.id === currentClass.schoolId)?.name || "";

    classStudents.forEach((s) => {
      const studentResults = studentQuizResults.filter((r) => r.studentId === s.id);
      const totalScore = studentResults.reduce((a, r) => a + r.score, 0);
      const totalPossible = studentResults.reduce((a, r) => a + r.total, 0);
      const quizPct = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      const att = studentAttendance.find((a) => a.studentId === s.id);
      const attPct = att ? att.percentage : "";
      const usageLogs = studentUsageLogs.filter((u) => u.studentId === s.id);
      const avgUsage = usageLogs.length ? Math.round(usageLogs.reduce((a, u) => a + u.minutes, 0) / usageLogs.length) : 0;
      const line = [
        escape(s.id),
        escape(s.name),
        escape(s.rollNo),
        escape((s as { section?: string }).section ?? ""),
        escape(currentClass.name),
        escape(schoolName),
        escape(quizPct),
        escape(attPct),
        escape(avgUsage),
      ];
      rows.push(line.join(","));
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = `${currentClass.name.replace(/\s+/g, "_")}_students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.href = url;
    a.setAttribute("download", fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [classStudents, currentClass, schools, studentQuizResults, studentAttendance, studentUsageLogs]);

  // used when clicking "view" on a student row
  const [viewingStudent, setViewingStudent] = useState<string | null>(null);

  const detailedStudent = viewingStudent ? students.find((s) => s.id === viewingStudent) : null;
  const detailedResults = viewingStudent ? studentQuizResults.filter((r) => r.studentId === viewingStudent) : [];
  const detailedUsage = viewingStudent ? studentUsageLogs.filter((u) => u.studentId === viewingStudent) : [];
  const detailedRegistrations = viewingStudent ? registrations.filter((r) => r.studentId === viewingStudent) : [];

  const detailedSubjectPerf = useMemo(() => {
    if (!viewingStudent) return [];
    const gradeVal = currentClass?.grade ?? 0;
    const gradeSubs = subjects.filter((s) => s.grades.includes(gradeVal));
    return gradeSubs.map((sub) => {
      const subChaps = chapters.filter((ch) => ch.subjectId === sub.id && ch.grade === gradeVal);
      const subRes = detailedResults.filter((r) => subChaps.some((ch) => ch.id === r.chapterId));
      const score = subRes.reduce((a, r) => a + r.score, 0);
      const total = subRes.reduce((a, r) => a + r.total, 0);
      return { name: sub.name, score: total > 0 ? Math.round((score / total) * 100) : 0 };
    });
  }, [viewingStudent, currentClass?.grade, subjects, chapters, detailedResults]);

  const detailedWeak = detailedSubjectPerf.filter((s) => s.score > 0 && s.score < 60).sort((a, b) => a.score - b.score);

  const filteredChapterIds = filteredChapters.map((ch) => ch.id);
  const completedChapterCount = filteredChapters.filter((ch) => {
    const chTopics = topics.filter((t) => t.chapterId === ch.id);
    if (chTopics.length === 0) return (chapterStatusState[ch.id] || "not_started") === "completed";
    return chTopics.every((t) => (topicStatusState[t.id] ?? t.status) === "completed");
  }).length;
  const syllabusProgress = filteredChapters.length > 0
    ? Math.round((completedChapterCount / filteredChapters.length) * 100)
    : 0;
  const totalQuizChapterIds = Array.from(
    new Set(chapterQuizzes.filter((q) => filteredChapterIds.includes(q.chapterId)).map((q) => q.chapterId))
  );
  const completedQuizChapterIds = Array.from(
    new Set(
      studentQuizResults
        .filter((r) => classStudents.some((student) => student.id === r.studentId) && filteredChapterIds.includes(r.chapterId))
        .map((r) => r.chapterId)
    )
  );
  const totalQuizCount = totalQuizChapterIds.length;
  const completedQuizCount = completedQuizChapterIds.length;
  const conductedSessions = classStatusLocal.filter((cs) => cs.status === "conducted").length;
  const scheduledSessions = classStatusLocal.length;

  const rankedStudentsByMarks = classStudents
    .map((student) => {
      const results = studentQuizResults.filter(
        (r) => r.studentId === student.id && filteredChapterIds.includes(r.chapterId)
      );
      const totalScore = results.reduce((sum, r) => sum + r.score, 0);
      const totalPossible = results.reduce((sum, r) => sum + r.total, 0);
      const percentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      return { student, percentage, totalPossible, totalScore };
    })
    .sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return b.totalScore - a.totalScore;
    });

  const selectedChapterObj = chapters.find(c => c.id === selectedChapter);

  // Session timer
  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(() => setSessionTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Chapter progress based on topics
  const getChapterProgress = (chapterId: string) => {
    const chTopics = topics.filter(t => t.chapterId === chapterId);
    if (chTopics.length === 0) return 0;
    const completed = chTopics.filter(t => (topicStatusState[t.id] || t.status) === "completed").length;
    return Math.round((completed / chTopics.length) * 100);
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleStartSession = (topic: TopicLike) => {
    const session: LiveSessionLike = {
      id: `ls_${Date.now()}`,
      teacherId: teacherId || "",
      classId: selectedClass,
      subjectId: selectedSubject,
      chapterId: topic.chapterId,
      topicId: topic.id,
      topicName: topic.name,
      teacherName: userName || "Teacher",
      className: currentClass?.name || "",
      subjectName: currentSubject?.name || "",
      startTime: new Date().toISOString(),
      status: "active",
      attendanceMarked: false,
      quizSubmitted: false,
    };
    setActiveSession(session);
    setSessionTime(0);
    setSessionAttendance(Object.fromEntries(classStudents.map((s) => [s.id, false])));
    setAttendanceMarked(false);
    setSessionQuizDone(false);
  };

  const handleEndSession = () => {
    if (!activeSession) return;
    setTopicStatusState((prev) => ({ ...prev, [activeSession.topicId]: "completed" }));
    const today = new Date().toISOString().split("T")[0];
    setClassStatusLocal((prev) => [
      { id: `cs_${Date.now()}`, date: today, classId: selectedClass, status: "conducted" as const, teacherId: teacherId || "" },
      ...prev,
    ]);
    setActiveSession(null);
    setSessionTime(0);
  };

  const handleMarkAttendance = () => {
    setAttendanceMarked(true);
  };

  const handleApplyLeave = async () => {
    if (!leaveDate || !leaveReason || !teacherId) return;
    setLeaveError(null);
    setLeaveSubmitting(true);
    try {
      await createLeaveApplication({ teacher_id: teacherId, start_date: leaveDate, reason: leaveReason.trim() });
      setLeaveDate("");
      setLeaveReason("");
      refetch();
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : "Failed to submit leave");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleChapterStatusChange = (chId: string, newStatus: string) => {
    setChapterStatusState((prev) => ({ ...prev, [chId]: newStatus }));
  };

  if (role === "teacher" && !activeSession && (!selectedClass || !selectedSubject || !currentClass || !currentSubject)) {
    return (
      <DashboardLayout title="Teacher Dashboard">
        <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">Loading…</div>
      </DashboardLayout>
    );
  }

  if (activeSession) {
    const sessionTopic = topics.find((t) => t.id === activeSession.topicId);
    const sessionChapter = chapters.find((c) => c.id === activeSession.chapterId);
    const canEnd = attendanceMarked && sessionQuizDone;

    return (
      <DashboardLayout title="Live Teaching Session">
        {/* LIVE indicator */}
        <div className="fixed top-3 right-20 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-sm font-bold animate-pulse">
          <Radio className="w-4 h-4" /> LIVE • {formatTime(sessionTime)}
        </div>

        <div className="mb-4">
          <Button variant="ghost" onClick={() => {
            if (canEnd) handleEndSession();
            else if (confirm("End session without completing requirements?")) handleEndSession();
          }} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> End & Return
          </Button>
        </div>

        {/* Session Info Bar */}
        <div className="bg-teal-light rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-muted-foreground">{activeSession.subjectName} → {sessionChapter?.name}</p>
              <h2 className="font-display text-lg font-bold text-foreground">{activeSession.topicName}</h2>
              <p className="text-xs text-muted-foreground">{activeSession.className} • Started {new Date(activeSession.startTime).toLocaleTimeString()}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={attendanceMarked ? "bg-success-light text-success" : "bg-amber-light text-amber"}>
                {attendanceMarked ? "✅ Attendance Done" : "⏳ Attendance Pending"}
              </Badge>
              <Badge className={sessionQuizDone ? "bg-success-light text-success" : "bg-amber-light text-amber"}>
                {sessionQuizDone ? "✅ Quiz Done" : "⏳ Quiz Pending"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main workspace - PPT/Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Camera Preview */}
            <Card className="shadow-card border-border">
              <CardContent className="p-4">
                <div className="aspect-video bg-foreground/5 rounded-xl flex items-center justify-center border-2 border-dashed border-border relative">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-destructive" />
                    </div>
                    <p className="text-foreground font-display font-bold">📹 Recording in Progress</p>
                    <p className="text-2xl font-mono text-primary font-bold mt-1">{formatTime(sessionTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Topic Materials */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm">Topic Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Textual Reference
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Presentation className="w-3.5 h-3.5" /> PPT
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> E-resources
                  </Button>
                </div>
                {sessionTopic && sessionTopic.materials.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {sessionTopic.materials.map(mat => {
                      const Icon = materialTypeIcons[mat.type] || FileText;
                      return (
                        <div key={mat.id} className="flex items-center gap-3 p-3 bg-secondary rounded-xl cursor-pointer hover:bg-secondary/80 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-teal-light flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{mat.title}</p>
                            <Badge variant="outline" className="text-xs uppercase mt-0.5">{mat.type}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No materials for this topic.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar - Tools & Attendance */}
          <div className="space-y-4">
            {/* Teaching Tools */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" /> AI Teaching Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: Presentation, label: "AI PPT Generator", desc: "Generate slides from topic" },
                  { icon: Brain, label: "AI Chatbot", desc: "Ask AI anything" },
                  { icon: PlayCircle, label: "YouTube Recommendations", desc: "Find related videos" },
                  { icon: QrCode, label: "Launch Quiz", desc: "QR-based quiz" },
                  { icon: FileText, label: "Lesson Plan Viewer", desc: "Chapter lesson plan" },
                ].map((tool, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                    onClick={() => {
                      if (tool.label === "AI Chatbot") setAiOpen(true);
                      if (tool.label === "Launch Quiz") {
                        setSessionQuizDone(true);
                        navigate("/teacher/quiz");
                      }
                      if (tool.label === "Lesson Plan Viewer") setLessonPlanOpen(true);
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-light flex items-center justify-center">
                      <tool.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{tool.label}</p>
                      <p className="text-[10px] text-muted-foreground">{tool.desc}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Attendance */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-info" /> Attendance ({Object.values(sessionAttendance).filter(Boolean).length}/{classStudents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {classStudents.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary cursor-pointer">
                      <Checkbox
                        checked={sessionAttendance[s.id] || false}
                        onCheckedChange={(checked) => {
                          setSessionAttendance((prev) => ({ ...prev, [s.id]: !!checked }));
                        }}
                        disabled={attendanceMarked}
                      />
                      <span className="text-xs text-foreground">{s.rollNo}. {s.name}</span>
                    </label>
                  ))}
                </div>
                {!attendanceMarked && (
                  <Button size="sm" className="w-full mt-3" onClick={handleMarkAttendance}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Submit Attendance
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* End Session */}
            <Button
              size="lg"
              variant="destructive"
              className="w-full gap-2"
              onClick={handleEndSession}
              disabled={!canEnd}
            >
              <VideoOff className="w-5 h-5" /> End Session
            </Button>
            {!canEnd && (
              <p className="text-xs text-muted-foreground text-center">
                Complete attendance & quiz before ending session
              </p>
            )}
          </div>
        </div>

        {/* Lesson Plan Viewer — ongoing chapter only */}
        <Dialog open={lessonPlanOpen} onOpenChange={setLessonPlanOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="font-display">Lesson Plan — {sessionChapter?.name ?? "Chapter"}</DialogTitle>
              <DialogDescription id="lesson-plan-desc">
                Chapter-wise micro lesson plan for this session only.
              </DialogDescription>
            </DialogHeader>
            {sessionChapter && (
              <div className="space-y-4">
                {(sessionChapter.monthLabel || sessionChapter.periods != null || sessionChapter.teachingPlanSummary) && (
                  <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-2">
                    {sessionChapter.monthLabel && (
                      <p className="text-sm font-medium text-foreground">{sessionChapter.monthLabel}</p>
                    )}
                    {sessionChapter.periods != null && (
                      <p className="text-xs text-muted-foreground">{sessionChapter.periods} periods</p>
                    )}
                    {sessionChapter.teachingPlanSummary && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{sessionChapter.teachingPlanSummary}</p>
                    )}
                  </div>
                )}
                <div>
                  <h4 className="font-display font-semibold text-foreground text-sm mb-2">Topics (micro lesson plan)</h4>
                  <ul className="space-y-2">
                    {topics
                      .filter((t) => t.chapterId === activeSession.chapterId)
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((t) => (
                        <li key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary text-sm">
                          <span className="text-muted-foreground tabular-nums">{t.order}.</span>
                          <span className="font-medium text-foreground">{t.name}</span>
                          <Badge variant="outline" className="text-[10px] ml-auto">{t.status}</Badge>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AIAssistant
          isOpen={aiOpen}
          onClose={() => setAiOpen(false)}
          topicName={sessionTopic?.name}
          chapterName={sessionChapter?.name}
        />
      </DashboardLayout>
    );
  }

  // Normal dashboard
  return (
    <DashboardLayout title="Teacher Dashboard">
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex gap-8">
          {/* Fixed Sidebar */}
          <aside className="w-[200px] flex-shrink-0">
            <TabsList className="flex-col h-auto gap-2 w-full bg-transparent p-0">
              <TabsTrigger value="overview" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Overview</TabsTrigger>
              <TabsTrigger value="chapters" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Chapters & Topics</TabsTrigger>
              <TabsTrigger value="students" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Students</TabsTrigger>
              <TabsTrigger value="classstatus" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Class Status</TabsTrigger>
              <TabsTrigger value="leave" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Leave</TabsTrigger>
              <TabsTrigger value="cocurricular" className="justify-start w-full data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary/50 rounded-lg px-4 py-2 transition-colors">Co-Curricular</TabsTrigger>
            </TabsList>
          </aside>
          {/* Content Area */}
          <div className="flex-1 min-w-0">
        <TabsContent value="overview" className="space-y-4">
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Overview — {currentSubject?.name} • {currentClass?.name}
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-card border-border">
              <CardContent className="p-4 text-center">
                <p className="font-display text-2xl font-bold text-foreground">{syllabusProgress}%</p>
                <p className="text-xs text-muted-foreground">Syllabus Progress</p>
                <p className="text-[10px] text-muted-foreground mt-1">{completedChapterCount}/{filteredChapters.length} chapters</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardContent className="p-4 text-center">
                <p className="font-display text-2xl font-bold text-foreground">{completedQuizCount}/{totalQuizCount}</p>
                <p className="text-xs text-muted-foreground">Quizzes</p>
                <p className="text-[10px] text-muted-foreground mt-1">Completed / Total</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardContent className="p-4 text-center">
                <p className="font-display text-2xl font-bold text-foreground">{conductedSessions}/{scheduledSessions}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="text-[10px] text-muted-foreground mt-1">Conducted/Scheduled</p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardContent className="p-4 text-center">
                <p className="font-display text-2xl font-bold text-foreground">{rankedStudentsByMarks.length}</p>
                <p className="text-xs text-muted-foreground">Students Ranked</p>
                <p className="text-[10px] text-muted-foreground mt-1">Based on marks</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" /> Students by Marks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rankedStudentsByMarks.length > 0 ? (
                rankedStudentsByMarks.map((item, index) => (
                  <div key={item.student.id} className="p-3 bg-secondary rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.student.name}</p>
                      <p className="text-xs text-muted-foreground">Roll No: {item.student.rollNo}</p>
                    </div>
                    <Badge className="bg-success-light text-success">{item.percentage}%</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No students found for this class.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chapters" className="space-y-4">
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            {currentSubject?.icon} {currentSubject?.name} — {currentClass?.name}
          </h3>
          <div className="space-y-3">
            {[...filteredChapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((ch) => {
              const status = chapterStatusState[ch.id] || "not_started";
              const sc = statusColors[status as keyof typeof statusColors];
              const chTopics = topics.filter((t) => t.chapterId === ch.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              const progress = getChapterProgress(ch.id);
              const isExpanded = selectedChapter === ch.id;

              return (
                <Card key={ch.id} className="shadow-card border-border overflow-hidden">
                  {/* Chapter Header */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setSelectedChapter(isExpanded ? null : ch.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-10 rounded-full" style={{ backgroundColor: sc.color }} />
                      <div>
                        <h4 className="font-display font-semibold text-foreground text-sm">{ch.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className={`${sc.bg} ${sc.text} text-xs`}>{sc.label}</Badge>
                          <span className="text-xs text-muted-foreground">{chTopics.length} topics</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 flex items-center gap-2">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Topics Dropdown */}
                  {isExpanded && (
                    <div className="border-t border-border bg-secondary/30 p-4 space-y-2">
                      {chTopics.length > 0 ? chTopics.map((topic) => {
                        const tStatus = topicStatusState[topic.id] || topic.status;
                        const tsc = statusColors[tStatus as keyof typeof statusColors];
                        const isTopicExpanded = expandedTopics[topic.id];

                        return (
                          <div key={topic.id} className="bg-card rounded-xl border border-border overflow-hidden">
                            <div
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                              onClick={() => toggleTopic(topic.id)}
                            >
                              <div className="flex items-center gap-2">
                                {tStatus === "completed" ? (
                                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                                ) : tStatus === "in_progress" ? (
                                  <Clock className="w-4 h-4 text-amber flex-shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium text-foreground">{topic.name}</span>
                                <Badge variant="outline" className="text-[10px]">{topic.materials.length} materials</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartSession(topic);
                                  }}
                                >
                                  <Play className="w-3 h-3" /> Start Session
                                </Button>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isTopicExpanded ? "rotate-180" : ""}`} />
                              </div>
                            </div>

                            {isTopicExpanded && (
                              <div className="px-3 pb-3 space-y-2">
                                {topic.materials.map((mat) => {
                                  const Icon = materialTypeIcons[mat.type] || FileText;
                                  return (
                                    <div key={mat.id} className="flex items-center gap-3 p-2 bg-secondary rounded-lg">
                                      <div className="w-8 h-8 rounded-lg bg-teal-light flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">{mat.title}</p>
                                        <Badge variant="outline" className="text-[10px] uppercase">{mat.type}</Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }) : (
                        <p className="text-sm text-muted-foreground p-2">No topics defined for this chapter yet.</p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
            {filteredChapters.length === 0 && (
              <Card className="shadow-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No chapters available for this subject and class combination.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* STUDENTS TAB */}
        <TabsContent value="students" className="space-y-4">
          <Card className="shadow-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> {currentClass?.name} — Students ({classStudents.length})
                </CardTitle>
                <div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadClassCsv()}>
                    <FileDown className="w-4 h-4" /> Download Students CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary">
                      <th className="text-left p-3 font-medium text-muted-foreground">Roll</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Attendance</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map(s => {
                      const att = studentAttendance.find(a => a.studentId === s.id);
                      return (
                        <tr key={s.id} className="border-b border-border last:border-0">
                          <td className="p-3 text-foreground">{s.rollNo}</td>
                          <td className="p-3 text-foreground font-medium">{s.name}</td>
                          <td className="p-3">
                            {att ? (
                              <div className="flex items-center gap-2">
                                <Progress value={att.percentage} className="h-2 w-20" />
                                <span className="text-xs text-muted-foreground">{att.percentage}%</span>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer"
                              onClick={() => setViewingStudent(s.id)}
                            >
                              View
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLASS STATUS TAB */}
        <TabsContent value="classstatus" className="space-y-4">
          {liveSessionsFromApi.filter((ls) => ls.classId === selectedClass && (ls.status === "active" || ls.status === "ongoing")).length > 0 && (
            <Card className="shadow-card border-border border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="font-display text-sm flex items-center gap-2 text-primary">
                  <Radio className="w-4 h-4" /> Live / Ongoing sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {liveSessionsFromApi
                  .filter((ls) => ls.classId === selectedClass && (ls.status === "active" || ls.status === "ongoing"))
                  .map((ls) => (
                    <div key={ls.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                      <span className="text-sm">{ls.subjectName} — {ls.topicName}</span>
                      <Badge className="bg-destructive/10 text-destructive text-xs">Live</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" /> Class Status — {currentClass?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary">
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Reason</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStatusLocal.map((cs) => (
                      <tr key={cs.id} className="border-b border-border last:border-0">
                        <td className="p-3 text-foreground">{cs.date}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            cs.status === "conducted" ? "bg-success-light text-success" : "bg-destructive/10 text-destructive"
                          }`}>
                            {cs.status === "conducted"
                              ? <><CheckCircle2 className="w-3 h-3" /> Conducted</>
                              : <><XCircle className="w-3 h-3" /> Cancelled</>
                            }
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{cs.reason || "—"}</td>
                        <td className="p-3">
                          <Select
                            value={cs.status}
                            onValueChange={(val) => {
                              setClassStatusLocal((prev) =>
                                prev.map((c) => (c.id === cs.id ? { ...c, status: val as "conducted" | "cancelled" } : c))
                              );
                            }}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conducted">Conducted</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEAVE TAB */}
        <TabsContent value="leave" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <CalendarOff className="w-5 h-5 text-primary" /> Apply for Leave
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {leaveError && <p className="text-sm text-destructive">{leaveError}</p>}
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Enter reason for leave..." className="mt-1" />
                </div>
                <Button onClick={handleApplyLeave} disabled={!leaveDate || !leaveReason || leaveSubmitting} className="w-full">
                  {leaveSubmitting ? "Submitting…" : "Submit Leave Application"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  ⚠️ While on leave, your classes will be marked as cancelled and students will be notified.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="font-display text-sm">Your leave applications</CardTitle>
              </CardHeader>
              <CardContent>
                {leaves.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leave applications yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {leaves.map((lv) => (
                      <li key={lv.id} className="flex justify-between items-center p-2 rounded-lg bg-secondary">
                        <span>{lv.date} — {lv.reason}</span>
                        <Badge variant="outline" className="text-xs">{lv.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CO-CURRICULAR TAB */}
        <TabsContent value="cocurricular" className="space-y-4">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent" /> Co-Curricular Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {activities.map(act => (
                  <div key={act.id} className="p-4 bg-secondary rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{act.icon}</span>
                      <div>
                        <h4 className="font-display font-semibold text-foreground text-sm">{act.title}</h4>
                        <Badge className={`text-xs ${
                          act.status === "upcoming" ? "bg-info-light text-info" :
                          act.status === "ongoing" ? "bg-success-light text-success" :
                          "bg-secondary text-muted-foreground"
                        }`}>{act.status}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{act.description}</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{act.date} • {act.registrations} registered</span>
                      </div>
                      {act.status !== "completed" && (
                        <div>
                          <div className="flex gap-2 mb-2">
                            <Button variant="outline" size="sm" className="text-xs flex-1"
                              onClick={() => beginRegister(act.id)}
                            >
                              Register Student
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs flex-1"
                              onClick={() => setViewingActivityRegistrations(act.id)}
                            >
                              Registered Students ({registrations.filter(r => r.activityId === act.id).length})
                            </Button>
                          </div>
                          {registeringActivity === act.id && (
                            <div className="flex items-center gap-1">
                              <Input
                                type="text"
                                placeholder="Student ID"
                                value={registerStudentId}
                                onChange={e => setRegisterStudentId(e.target.value)}
                                className="text-xs w-24"
                              />
                              <Button size="sm" onClick={confirmRegister} className="text-xs">
                                OK
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
          </div> {/* end flex-1 wrapper */}
        </div> {/* end flex wrapper */}
      </Tabs>

      {/* Floating AI Button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full gradient-primary shadow-hover flex items-center justify-center z-30 hover:scale-105 transition-transform"
      >
        <Bot className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Registered Students modal */}
      <Dialog open={!!viewingActivityRegistrations} onOpenChange={open => { if (!open) setViewingActivityRegistrations(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registered Students</DialogTitle>
            <DialogDescription>
              {activities.find(a => a.id === viewingActivityRegistrations)?.title || ""}
            </DialogDescription>
          </DialogHeader>
          {viewingActivityRegistrations && (
            <div>
              {registrations.filter(r => r.activityId === viewingActivityRegistrations).length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="grid gap-2">
                    {registrations.filter((r) => r.activityId === viewingActivityRegistrations).map((reg) => {
                      const student = students.find((s) => s.id === reg.studentId);
                      return (
                        <div key={`${reg.activityId}-${reg.studentId}`} className="p-3 bg-secondary rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{student?.name || reg.studentId}</p>
                            <p className="text-xs text-muted-foreground">Roll No: {student?.rollNo || "—"}</p>
                          </div>
                          <Badge className="bg-success-light text-success text-xs">{reg.status}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No students registered yet.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student performance/details modal */}
      <Dialog open={!!viewingStudent} onOpenChange={open => { if (!open) setViewingStudent(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              {detailedStudent ? `${detailedStudent.name} (${detailedStudent.rollNo})` : ""}
            </DialogDescription>
          </DialogHeader>
          {detailedStudent && (
            <div className="space-y-4">
              {/* Performance graph */}
              <div>
                <p className="text-sm font-medium">Subject-wise Scores</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={detailedSubjectPerf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(200,20%,90%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(174,62%,38%)" radius={[4,4,0,0]} name="Score %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Strong/weak areas */}
              {detailedWeak.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-destructive">Weak Areas</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {detailedWeak.map(a => (
                      <Badge key={a.name} className="bg-destructive/10 text-destructive text-xs">
                        {a.name} ({a.score}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Time spent chart */}
              {detailedUsage.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Time Spent (min)</p>
                  <p className="text-xs text-muted-foreground">
                    Total: {detailedUsage.reduce((a, u) => a + u.minutes, 0)} minutes
                  </p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={detailedUsage} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="minutes" fill="hsl(220, 60%, 60%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {/* Co-curricular list */}
              {detailedRegistrations.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Co‑curricular Activities</p>
                  <ul className="list-disc list-inside text-xs mt-1">
                    {detailedRegistrations.map((r) => {
                      const act = activities.find((a) => a.id === r.activityId);
                      return (
                        <li key={r.activityId}>
                          {act?.title} ({r.status})
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </DashboardLayout>
  );
};

export default TeacherDashboard;
