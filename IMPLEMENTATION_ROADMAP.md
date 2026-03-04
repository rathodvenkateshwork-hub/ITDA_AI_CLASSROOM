# ITDA AI Classroom - Implementation Roadmap

## PHASE 1: DATABASE & BACKEND SETUP (Current Phase)

### Task 1.1: Migrate New Tables to Supabase (IMMEDIATE - 30 minutes)
**Status**: Ready
**Action Items**:
1. Copy SQL from `backend/database/add-portal-features.sql`
2. Go to Supabase SQL Editor (https://supabase.com/dashboard)
3. Paste and execute all SQL
4. Verify 20 new tables created successfully
5. Check indexes and foreign key relationships

**Files to Execute**:
- `backend/database/add-portal-features.sql` (20 new tables)

**Verification Queries**:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- Should show 43 total tables (23 original + 20 new)
```

---

### Task 1.2: Seed Sample Data (30 minutes)
**Status**: Ready
**Action Items**:
1. Execute `backend/database/sample-data.sql` in Supabase
2. Verify records inserted in all key tables:
   - schools: 3 records
   - teachers: 4 records
   - students: 5 records
   - chapters: 6 records
   - quizzes: 3 records
   - study_materials: 6 records
   - activities: 4 records
   - badges: 5 records
3. Run validation queries

**Validation Queries**:
```sql
SELECT COUNT(*) FROM schools;  -- Should be 3
SELECT COUNT(*) FROM teachers;  -- Should be 4
SELECT COUNT(*) FROM students;  -- Should be 5
SELECT COUNT(*) FROM quizzes;  -- Should be 3
SELECT COUNT(*) FROM study_materials;  -- Should be 6
```

---

## PHASE 2: BACKEND API EXPANSION (2-3 days)

### Task 2.1: Create Authentication Middleware (2 hours)
**Status**: Planned
**Files to Create/Modify**:
- `backend/middleware/auth.js` (NEW)
- `backend/middleware/role-check.js` (NEW)
- `backend/server/index.js` (MODIFY)

**Implementation**:
```javascript
// middleware/auth.js
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// middleware/role-check.js
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  };
};
```

---

### Task 2.2: Admin Portal APIs (6 hours)

#### 2.2.1 Admin Authentication (1 hour)
**Endpoints**:
- `POST /api/admin/login`
- `POST /api/admin/register`
- `GET /api/admin/profile`
- `POST /api/admin/logout`

**Implementation Pattern**:
```javascript
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  // Find admin in database
  // Compare password (bcrypt)
  // Generate JWT token
  // Return token + admin data
});
```

---

#### 2.2.2 Admin Dashboard & Analytics (2 hours)
**Endpoints** (12 total):
- `GET /api/admin/dashboard/stats` - Overall statistics
- `GET /api/admin/dashboard/schools-summary` - Schools overview
- `GET /api/admin/dashboard/teachers-summary` - Teachers overview
- `GET /api/admin/dashboard/quiz-completion` - Quiz completion rates
- `GET /api/admin/dashboard/live-sessions` - Session tracking
- `GET /api/admin/dashboard/daily-active-students` - Active student count
- `GET /api/admin/dashboard/weak-chapters` - Weak areas analysis
- + 5 more analytical endpoints

**Database Queries**:
```sql
-- Total schools
SELECT COUNT(*) as total_schools FROM schools;

-- Total students per school
SELECT school_id, COUNT(*) as student_count FROM students GROUP BY school_id;

-- Quiz completion rate
SELECT COUNT(*) as submitted FROM quiz_submissions WHERE quiz_id = $1
AND DATE(submitted_at) = CURRENT_DATE;

-- Active students today
SELECT COUNT(DISTINCT student_id) FROM session_attendance 
WHERE DATE(marked_at) = CURRENT_DATE;
```

---

#### 2.2.3 Schools Management (1.5 hours)
**Endpoints** (8 total):
- `GET /api/admin/schools` - List all schools with pagination
- `GET /api/admin/schools/:id` - School details
- `POST /api/admin/schools` - Create school
- `PUT /api/admin/schools/:id` - Update school
- `DELETE /api/admin/schools/:id` - Delete school
- `GET /api/admin/schools/:id/classes` - Classes in school
- `GET /api/admin/schools/:id/performance-summary` - School performance
- `POST /api/admin/schools/:id/export-report` - Export data

---

#### 2.2.4 Teachers Management (1.5 hours)
**Endpoints** (6 total):
- `GET /api/admin/teachers` - List teachers with filters
- `GET /api/admin/teachers/:id` - Teacher details
- `POST /api/admin/teachers` - Create teacher & auto-assign password
- `PUT /api/admin/teachers/:id` - Update teacher
- `POST /api/admin/teachers/:id/assign-class` - Assign class/subject
- `POST /api/admin/teachers/bulk-export` - Export teacher list (CSV)

---

#### 2.2.5 Other Admin Endpoints (1 hour)
- Leave Management (4 endpoints)
- Materials Management (4 endpoints)
- Activity Logs (4 endpoints)
- QR Code Management (4 endpoints)

---

### Task 2.3: Teacher Portal APIs (6 hours)

#### 2.3.1 Teacher Authentication (1 hour)
**Endpoints**:
- `POST /api/teacher/login`
- `GET /api/teacher/profile`
- `PUT /api/teacher/profile`
- `POST /api/teacher/change-password`

---

#### 2.3.2 Teacher Dashboard & Progress (1 hour)
**Endpoints** (4 total):
- `GET /api/teacher/dashboard` - Main dashboard
- `GET /api/teacher/progress/chapters` - Chapter completion
- `GET /api/teacher/progress/syllabus` - Syllabus progress
- `GET /api/teacher/dashboard/quick-stats` - Quick statistics

---

#### 2.3.3 Sessions Management (2 hours)
**Endpoints** (8 total):
- `GET /api/teacher/sessions` - List sessions
- `POST /api/teacher/sessions` - Create session
- `GET /api/teacher/sessions/:id` - Session details
- `PUT /api/teacher/sessions/:id` - Edit session
- `DELETE /api/teacher/sessions/:id` - Cancel session
- `POST /api/teacher/sessions/:id/mark-attendance` - Mark attendance
- `POST /api/teacher/sessions/:id/ai-tools` - Launch AI tools
- `POST /api/teacher/sessions/:id/end-session` - End session

---

#### 2.3.4 Other Teacher Endpoints (2 hours)
- Chapters & Topics (6 endpoints)
- Student Management (6 endpoints)
- Quizzes (6 endpoints)
- Activities (6 endpoints)
- Leave Management (4 endpoints)

---

### Task 2.4: Student Portal APIs (5 hours)

#### 2.4.1 Student Authentication (1 hour)
**Endpoints**:
- `POST /api/student/login`
- `GET /api/student/profile`
- `PUT /api/student/profile`
- `POST /api/student/change-password`

---

#### 2.4.2 Dashboard & Performance (1 hour)
**Endpoints** (4 total):
- `GET /api/student/dashboard` - Main dashboard
- `GET /api/student/dashboard/performance-summary`
- `GET /api/student/dashboard/subject-performance`
- `GET /api/student/dashboard/weak-areas`

---

#### 2.4.3 Quizzes (1.5 hours)
**Endpoints** (6 total):
- `GET /api/student/quizzes` - Available quizzes
- `GET /api/student/quizzes/:id` - Quiz details
- `POST /api/student/quizzes/:id/start` - Start quiz
- `POST /api/student/quizzes/:id/submit` - Submit answers
- `GET /api/student/quizzes/:id/results` - View results
- `GET /api/student/quizzes/:id/performance-analysis`

---

#### 2.4.4 Other Student Endpoints (1.5 hours)
- Study Materials (6 endpoints)
- Badges & Certificates (4 endpoints)
- Activities (4 endpoints)
- AI Chatbot (2 endpoints)
- Records (2 endpoints)

---

### Task 2.5: Common & Batch Operations (2 hours)
**Endpoints** (22 total):
- Authentication/Authorization (4)
- Data Export & Reporting (4)
- File Management (4)
- Bulk Operations (10)

---

## PHASE 3: FRONTEND COMPONENT DEVELOPMENT (3-4 days)

### Task 3.1: Admin Portal Components (Already Partially Started)

#### 3.1.1 Dashboard Page (3 hours)
**Components to Create**:
- AdminDashboard.tsx (Main container)
- StatsCard.tsx (Statistics display)
- SchoolsChart.tsx (Schools overview)
- TeachersChart.tsx (Teachers overview)
- QuizCompletionChart.tsx (Quiz completion rates)
- LiveSessionsList.tsx (Active sessions)
- WeakChaptersHeatmap.tsx (Weak areas visualization)

**File**: `frontend/src/pages/admin/Dashboard.tsx`

---

#### 3.1.2 Schools Management (2 hours)
**Components**:
- SchoolsList.tsx
- SchoolDetail.tsx
- SchoolForm.tsx
- SchoolClasses.tsx
- SchoolPerformance.tsx

**File Structure**:
```
frontend/src/pages/admin/
  ├── schools/
  │   ├── SchoolsList.tsx
  │   ├── SchoolDetail.tsx
  │   ├── SchoolForm.tsx
  │   └── SchoolClassesView.tsx
```

---

#### 3.1.3 Teachers Management (2 hours)
**Components**:
- TeachersList.tsx
- TeacherDetail.tsx
- TeacherForm.tsx
- TeacherAssignments.tsx
- BulkImport.tsx

---

#### 3.1.4 Additional Admin Pages (4 hours)
- Leave Tracking Dashboard
- Materials Management
- Activity Logs Viewer
- QR Code Scanner
- Registration Module
- Analytics Dashboard

**Total Admin Components**: 20+

---

### Task 3.2: Teacher Portal Components (3 hours)

#### 3.2.1 Teacher Dashboard (2 hours)
**Components**:
- TeacherDashboard.tsx
- SubjectProgress.tsx
- SessionPlanner.tsx
- StudentOverview.tsx
- QuickStats.tsx

---

#### 3.2.2 Session Management (2 hours)
**Components**:
- SessionsList.tsx
- SessionDetail.tsx
- SessionForm.tsx
- AttendanceMarker.tsx
- AIToolsPanel.tsx (PPT, Chatbot, Lesson Plan, YouTube, etc.)

---

#### 3.2.3 Other Teacher Pages (2 hours)
- Chapter Management
- Quiz Creation & Management
- Student Management
- Leave Request Form
- Activity Management

**Total Teacher Components**: 15+

---

### Task 3.3: Student Portal Components (2 hours)

#### 3.3.1 Student Dashboard (1.5 hours)
**Components**:
- StudentDashboard.tsx
- PerformanceSummary.tsx
- SubjectChart.tsx
- RecentQuizzes.tsx
- WeakAreasCard.tsx

---

#### 3.3.2 Other Student Pages (1.5 hours)
- Study Materials Browser
- Quiz Interface
- Badges Display
- Certificate Wallet
- Activities Registration
- AI Chatbot

**Total Student Components**: 12+

---

## PHASE 4: INTEGRATION & TESTING (2 days)

### Task 4.1: API Integration Testing
- Test all 100+ endpoints
- Verify request/response formats
- Error handling validation
- Rate limiting & security

### Task 4.2: Frontend-Backend Integration
- Connect all UI forms to APIs
- Handle loading states
- Error boundaries & error messages
- Token refresh & auth flow

### Task 4.3: End-to-End Workflows
- Admin: Create school → Add teacher → Add students → Assign classes
- Teacher: Login → View dashboard → Create session → Mark attendance → Launch quiz
- Student: Login → View dashboard → Join session → Take quiz → View results

### Task 4.4: Performance Optimization
- Database query optimization
- Frontend bundle size reduction
- API response time optimization
- Caching strategies

---

## PHASE 5: DEPLOYMENT & LAUNCH (1 day)

### Task 5.1: Final Testing on Production
- Test on Vercel (frontend)
- Test on Render (backend)
- Test Supabase connections
- Load testing

### Task 5.2: Deployment
- Push code to GitHub
- Deploy backend to Render
- Deploy frontend to Vercel
- Verify all systems operational

### Task 5.3: Documentation & Handover
- API documentation complete
- User guide for each portal
- Admin guide
- Troubleshooting guide

---

## TIMELINE ESTIMATE

```
Phase 1 (Database): 1 day
Phase 2 (Backend APIs): 2-3 days
Phase 3 (Frontend): 3-4 days
Phase 4 (Testing): 2 days
Phase 5 (Deployment): 1 day

Total: 9-12 days (7-10 working days)

ASAP with parallel workstreams: 5-7 days
```

---

## CRITICAL PATH

```
Day 1:
- Migrate database schema ✓
- Seed sample data ✓
- Start backend API development (authentication, models)

Day 2-3:
- Complete all Admin APIs (40 endpoints)
- Complete all Teacher APIs (38 endpoints)
- Begin frontend work in parallel

Day 4-5:
- Complete all Student APIs (32 endpoints)
- Build Admin UI components
- Build Teacher UI components

Day 6-7:
- Build Student UI components
- Integration testing
- Bug fixes

Day 8:
- Final testing on staging
- Deploy to production
```

---

## CURRENT STATUS

✅ **COMPLETED**:
1. Database schema expansion file created
2. Sample data file created
3. API endpoints documentation created
4. Implementation roadmap created

⏳ **NEXT IMMEDIATE STEPS**:
1. Execute SQL migrations in Supabase
2. Insert sample data
3. Create backend authentication middlewares
4. Start implementing Admin APIs
5. Begin frontend development

---

## REQUIRED CLARIFICATIONS

Before starting implementation, confirm:

1. **Live Session Technology**:
   - Option A: Use Zoom API for live sessions
   - Option B: Use custom WebRTC solution
   - Option C: Implement mock sessions for MVP

2. **Study Materials Storage**:
   - Option A: Store in Supabase Storage
   - Option B: Store URLs only (external links)
   - Option C: Hybrid approach

3. **AI Tools Implementation**:
   - Option A: Use OpenAI API for chatbot & lesson plans
   - Option B: Use free alternatives (Hugging Face)
   - Option C: Mock implementations for MVP

4. **UI Framework**:
   - Option A: Continue with Shadcn + TailwindCSS (recommended)
   - Option B: Switch to another component library

5. **Sample Data Volume**:
   - Option A: 1 school, 10 teachers, 50 students
   - Option B: 3 schools, 30 teachers, 150 students (current)
   - Option C: 5 schools, 50 teachers, 300 students

6. **Deployment Scale**:
   - Option A: Keep on free Render/Vercel tiers (current)
   - Option B: Upgrade to paid tiers
   - Option C: Multi-region deployment

---

## SUCCESS CRITERIA

✅ All 134+ API endpoints functional and tested
✅ Three complete portals (Admin, Teacher, Student) with all features
✅ Sample data populated and verified
✅ All workflows tested end-to-end
✅ Frontend properly styled with Shadcn components
✅ Deployments on Vercel & Render working
✅ Documentation complete
✅ Performance metrics acceptable (< 500ms API response time)

---

## NEXT ACTION

**User Decision Required**:
1. Confirm proceeding with implementation
2. Answer clarification questions above
3. Approve timeline and approach

OR

**Autonomous Proceed**:
Agent can immediately:
1. Migrate database schema
2. Seed sample data
3. Begin backend API development
4. Request clarifications as implementation progresses

**Recommended**: Autonomous proceed with immediate clarifications asked during implementation.
