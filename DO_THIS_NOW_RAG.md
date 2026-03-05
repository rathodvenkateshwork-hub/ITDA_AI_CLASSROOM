# Do This Now: Intelligent RAG Setup (Minimal Work for You)

This is the exact execution checklist. Follow in order.

## 1. Your Work (Required)

1. Add environment variables in backend `.env`:
```env
OPENAI_API_KEY=your_openai_key
EMBEDDING_MODEL=text-embedding-3-small
```

2. Run DB schema in Supabase/Postgres:
```bash
psql "$SUPABASE_DB_URL" -f backend/database/intelligent-rag-schema.sql
```

3. Restart backend server:
```bash
cd backend && npm run dev
```

4. Add frontend route (only if not added yet) to show teacher dashboard:
- Component file already exists: `frontend/src/pages/teacher/InteractiveTeachingDashboard.tsx`
- Add route path in your app router: `/teacher/interactive-teaching`

5. Seed teacher mapping data once (required for auto-assignment):
- Insert teacher-class-subject mappings into `teacher_class_subject_mapping`

6. Create at least 1 auto-assignment rule using API:
```bash
curl -X POST http://localhost:3001/api/rag/assignment-rules \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "Class 6 Science Auto-Assign",
    "rule_type": "class_subject_auto",
    "class_id": 6,
    "subject_id": 5,
    "material_type": "textbook",
    "due_date_offset": 7
  }'
```

## 2. What Is Already Done In Code

- RAG routes wired: `backend/server/index.js`
- Main API: `backend/routes/intelligent-rag.js`
- Chunking service: `backend/services/material-chunking.js`
- Content generation service: `backend/services/content-generation.js`
- Interactive teacher UI: `frontend/src/pages/teacher/InteractiveTeachingDashboard.tsx`
- DB schema with vector + cache: `backend/database/intelligent-rag-schema.sql`

## 3. Cache Money-Saving Features Now Active

These are now implemented, not just documented:

1. Cache hits are counted (`access_count`, `last_accessed_at`)
2. Same PPT/Quiz request returns cached output (no duplicate generation)
3. New endpoints added:
- `GET /api/rag/cache/stats` -> cache hit stats + estimated savings
- `POST /api/rag/cache/cleanup` -> remove expired entries
- `POST /api/rag/cache/invalidate` -> invalidate one scope

Example stats call:
```bash
curl http://localhost:3001/api/rag/cache/stats
```

## 4. 10-Minute Verification Flow

1. Upload one material.
2. Run chunk API:
```bash
curl -X POST http://localhost:3001/api/rag/materials/1/chunk -H "Content-Type: application/json" -d '{}'
```
3. Run embed API:
```bash
curl -X POST http://localhost:3001/api/rag/materials/1/embed -H "Content-Type: application/json" -d '{}'
```
4. Start one interactive session and generate PPT once.
5. Generate same PPT again -> should return `cached: true`.
6. Check savings:
```bash
curl http://localhost:3001/api/rag/cache/stats
```

## 5. If You Want Me To Continue

I can do these next in code immediately:
1. Connect real OpenAI embedding calls (instead of mock vectors).
2. Add automatic trigger: material publish -> chunk -> embed -> auto-assign.
3. Add cron/scheduled cache cleanup task.
4. Add frontend cache savings widget for admin.
