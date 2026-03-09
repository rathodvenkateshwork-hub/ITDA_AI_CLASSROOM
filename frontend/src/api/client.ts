const API_BASE = typeof import.meta.env !== "undefined" && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : "";

export interface AllDataResponse {
  schools: Array<{ id: string; name: string; code: string; district: string; mandal?: string; teachers: number; students: number; classes: number; sessionsCompleted: number; activeStatus: boolean }>;
  classes: Array<{ id: string; schoolId: string; name: string; section: string; grade: number; studentCount: number }>;
  teachers: Array<{ id: string; name: string; email: string; schoolId: string; classIds: string[]; subjects: string[] }>;
  students: Array<{ id: string; name: string; rollNo: number; section?: string; classId: string | null; schoolId: string; score: number; student_unique_id?: string }>;
  subjects: Array<{ id: string; name: string; icon: string; grades: number[] }>;
  chapters: Array<{
    id: string;
    subjectId: string;
    name: string;
    grade: number;
    order: number;
    chapterNo?: number | null;
    monthLabel?: string | null;
    periods?: number | null;
    teachingPlanSummary?: string | null;
    concepts?: string | null;
  }>;
  topics: Array<{ id: string; chapterId: string; name: string; order: number; status: string; materials: Array<{ id: string; type: string; title: string; url: string }> }>;
  studentQuizResults: Array<{ studentId: string; chapterId: string; score: number; total: number; date: string | null; answers: unknown[] }>;
  activityLogs: Array<{ id: string; user: string; role: string; action: string; school: string; class: string; timestamp: string; gps: string }>;
  classStatus: Array<{ id: string; date: string; classId: string; status: string; teacherId: string; reason: string | null }>;
  leaveApplications: Array<{ id: string; teacherId: string; date: string; reason: string; status: string; appliedOn: string }>;
  classRecordings: Array<{ id: string; teacherId: string; classId: string; subject: string; chapter: string; date: string; duration: string; size: string; status: string }>;
  homework: Array<{ id: string; classId: string; subjectName: string; chapterName: string; title: string; dueDate: string | null; assignedDate: string | null; submissions: number; totalStudents: number }>;
  studentAttendance: Array<{ studentId: string; present: number; total: number; percentage: number }>;
  studyMaterials: Array<{ id: string; chapterId: string; type: string; title: string; url: string }>;
  liveSessions: Array<{ id: string; teacherId: string; classId: string; subjectId: string; chapterId: string; topicId: string; topicName: string; teacherName: string; className: string; subjectName: string; startTime: string; status: string; attendanceMarked: boolean; quizSubmitted: boolean; recordingId: string | null }>;
  chapterQuizzes: Array<{ id: string; chapterId: string; question: string; options: string[]; correct: string }>;
  impactMetrics: { schoolsOnboarded: number; teachersActive: number; studentsReached: number; sessionsCompleted: number; quizParticipation: number };
  teacherEffectiveness: unknown[];
  weakTopicHeatmap: unknown[];
  engagementMetrics: { dailyActiveStudents: unknown[]; materialViews: Record<string, number>; quizCompletionRate: number; avgSessionDuration: number };
  curriculum: unknown;
  studentUsageLogs: unknown[];
  admins: Array<{ id: string; email: string; full_name: string; role: string }>;
}

export async function fetchAll(): Promise<AllDataResponse> {
  const res = await fetch(`${API_BASE}/api/all`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json() as Promise<AllDataResponse>;
}

export function getApiBase(): string {
  return API_BASE;
}

async function parseErrorResponse(res: Response): Promise<string> {
  const text = await res.text().catch(() => res.statusText);
  const trimmed = (text || "").trim();
  try {
    const json = JSON.parse(trimmed) as { error?: string };
    if (json?.error && typeof json.error === "string" && json.error.trim()) return json.error;
  } catch {
    // not JSON
  }
  if (trimmed) return trimmed;
  if (res.statusText && String(res.statusText).trim()) return String(res.statusText).trim();
  return `Request failed (${res.status || "unknown"})`;
}

export async function registerStudent(body: { full_name: string; roll_no?: number; section?: string; school_id: string; class_id?: string; password?: string }): Promise<{ id: string; student_unique_id?: string }> {
  const res = await fetch(`${API_BASE}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function registerTeacher(body: { full_name: string; email: string; school_id: string; password?: string }): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/teachers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function createSchool(body: { name: string; code: string; district: string; mandal?: string; sessions_completed?: number; active_status?: boolean }): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/schools`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateSchool(id: string, body: { name?: string; code?: string; district?: string; mandal?: string; sessions_completed?: number; active_status?: boolean }): Promise<{ id: string; updated: boolean }> {
  const res = await fetch(`${API_BASE}/api/schools/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteSchool(id: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/api/schools/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createClass(body: { school_id: string; name: string; section?: string; grade: number }): Promise<{ id: string; schoolId: string; name: string; section: string; grade: number; studentCount: number }> {
  const res = await fetch(`${API_BASE}/api/classes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateClass(id: string, body: { school_id?: string; name?: string; section?: string; grade?: number; student_count?: number }): Promise<{ id: string; updated: boolean }> {
  const res = await fetch(`${API_BASE}/api/classes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteClass(id: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/api/classes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateStudent(id: string, body: { full_name?: string; roll_no?: number; section?: string; school_id?: string; password?: string }): Promise<{ id: string; updated: boolean }> {
  const res = await fetch(`${API_BASE}/api/students/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteStudent(id: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/api/students/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function studentLogin(body: { email: string; password?: string }): Promise<{ id: string; email?: string; student_unique_id?: string; name: string; role: string }> {
  const res = await fetch(`${API_BASE}/api/student/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function studentBulkUpload(students: Array<{ full_name: string; roll_no?: number; section?: string; school_id: string; class_id?: string; password?: string }>): Promise<{ results: Array<any> }> {
  const res = await fetch(`${API_BASE}/api/students/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ students }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function teacherBulkUpload(teachers: Array<{ full_name: string; email: string; school_id: string; password?: string }>): Promise<{ results: Array<any> }> {
  const res = await fetch(`${API_BASE}/api/teachers/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teachers }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function updateTeacher(id: string, body: { full_name?: string; email?: string; school_id?: string; password?: string }): Promise<{ id: string; updated: boolean }> {
  const res = await fetch(`${API_BASE}/api/teachers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteTeacher(id: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/api/teachers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export type TeacherAssignment = { id: string; teacherId: string; schoolId: string; classId: string; subjectId: string; subjectName: string; className: string; schoolName: string };

export async function getTeacherAssignments(teacherId: string): Promise<{ assignments: TeacherAssignment[] }> {
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}/assignments`);
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateTeacherAssignments(
  teacherId: string,
  body: { school_id?: string; assignments: Array<{ school_id?: string; class_id: string; subject_id: string }> }
): Promise<{ updated: boolean }> {
  const res = await fetch(`${API_BASE}/api/teachers/${teacherId}/assignments`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function adminLogin(body: { email: string; password?: string }): Promise<{ id: string; email: string; full_name: string; role: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function teacherLogin(body: { email: string; password?: string }): Promise<{ id: string; email: string; full_name: string; school_id: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login/teacher`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function createLeaveApplication(body: { teacher_id: string; start_date: string; reason: string }): Promise<{ id: string; teacherId: string; date: string; reason: string; status: string; appliedOn: string }> {
  const res = await fetch(`${API_BASE}/api/teachers/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}
