import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import About from "./pages/About";
import Activities from "./pages/Activities";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherSetup from "./pages/teacher/TeacherSetup";
import LessonScreen from "./pages/teacher/LessonScreen";
import QuizScreen from "./pages/teacher/QuizScreen";
import InteractiveTeachingDashboard from "./pages/teacher/InteractiveTeachingDashboard";
import TeacherMaterials from "./pages/teacher/TeacherMaterials";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SchoolsAnalytics from "./pages/admin/SchoolsAnalytics";
import StudentsFilter from "./pages/admin/StudentsFilter";
import StudentsAnalytics from "./pages/admin/StudentsAnalytics";
import SchoolManagement from "./pages/admin/SchoolManagement";
import TeacherManagement from "./pages/admin/TeacherManagement";
import MaterialsManagement from "./pages/admin/MaterialsManagement";
import QuizManagement from "./pages/admin/QuizManagement";
import ActivityManagement from "./pages/admin/ActivityManagement";
import StudyMaterialsManagement from "./pages/admin/StudyMaterialsManagement";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentSubjects from "./pages/student/StudentSubjects";
import StudentQuiz from "./pages/student/StudentQuiz";
import StudentMaterials from "./pages/student/StudentMaterials";
import MaterialsSearch from "./pages/MaterialsSearch";
import NotFound from "./pages/NotFound";
import StudentRegistration from "./pages/admin/StudentRegistration";
import TeacherRegistration from "./pages/admin/TeacherRegistration";
import StudentBulkUpload from "./pages/admin/StudentBulkUpload";
import TeacherBulkUpload from "./pages/admin/TeacherBulkUpload";
import QuizBoardDisplay from "./pages/teacher/QuizBoardDisplay";
import TeacherQuizScanner from "./pages/teacher/TeacherQuizScanner";
import QuizSessionManager from "./pages/teacher/QuizSessionManager";
import PrintableQRCards from "./pages/teacher/PrintableQRCards";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/activities" element={<Activities />} />
            {/* Teacher Routes */}
            <Route path="/teacher/setup" element={<TeacherSetup />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/lesson" element={<LessonScreen />} />
            <Route path="/teacher/quiz" element={<QuizScreen />} />
            <Route path="/teacher/interactive-teaching" element={<InteractiveTeachingDashboard />} />
            <Route path="/teacher/materials" element={<TeacherMaterials />} />
            <Route path="/teacher/quiz-board" element={<QuizBoardDisplay />} />
            <Route path="/teacher/quiz-scanner" element={<TeacherQuizScanner />} />
            <Route path="/teacher/quiz-sessions" element={<QuizSessionManager />} />
            <Route path="/teacher/qr-cards" element={<PrintableQRCards />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/schools-analytics" element={<SchoolsAnalytics />} />
            <Route path="/admin/students-filter" element={<StudentsFilter />} />
            <Route path="/admin/students-analytics" element={<StudentsAnalytics />} />
            <Route path="/admin/schools" element={<SchoolManagement />} />
            <Route path="/admin/teachers" element={<TeacherManagement />} />
            <Route path="/admin/materials" element={<MaterialsManagement />} />
            <Route path="/admin/quizzes" element={<QuizManagement />} />
            <Route path="/admin/activities" element={<ActivityManagement />} />
            <Route path="/admin/study-materials" element={<StudyMaterialsManagement />} />
            <Route path="/admin/register/student" element={<StudentRegistration />} />
            <Route path="/admin/register/teacher" element={<TeacherRegistration />} />
            <Route path="/admin/bulk/students" element={<StudentBulkUpload />} />
            <Route path="/admin/bulk/teachers" element={<TeacherBulkUpload />} />
            {/* Student Routes */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/subjects" element={<StudentSubjects />} />
            <Route path="/student/quiz" element={<StudentQuiz />} />
            <Route path="/student/materials" element={<StudentMaterials />} />
            {/* Search */}
            <Route path="/materials/search" element={<MaterialsSearch />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
