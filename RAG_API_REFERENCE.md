# Intelligent RAG API Reference Card

Quick reference for all endpoints in the Intelligent RAG system.

---

## 📋 Base URL
```
http://localhost:3001/api/rag
```

---

## 📁 MATERIAL PROCESSING

### Chunk Material
**POST** `/materials/:id/chunk`
- Split material into manageable chunks
- Returns: Chunk count and details
```json
Request: {
  "chunk_size": 1000,
  "overlap": 200
}
Response: {
  "material_id": 1,
  "chunks_created": 25,
  "chunks": [...]
}
```

### Embed Chunks
**POST** `/materials/:id/embed`
- Generate vector embeddings for all chunks
- Returns: Embedding count and model used
```json
Request: {
  "embedding_model": "text-embedding-3-small"
}
Response: {
  "material_id": 1,
  "chunks_embedded": 25,
  "embedding_model": "text-embedding-3-small"
}
```

---

## 📚 CHAPTER SESSIONS

### Create Sessions
**POST** `/chapters/:id/create-sessions`
- Auto-divide chapter into N teaching sessions
- Returns: Sessions created with metadata
```json
Request: {
  "subject_id": 5,
  "num_sessions": 4
}
Response: {
  "chapter_id": 1,
  "sessions_created": 4,
  "total_chunks": 100,
  "sessions": [...]
}
```

### List Sessions
**GET** `/chapters/:id/sessions`
- Get all sessions for a chapter
- Returns: Array of session objects

---

## 📋 ASSIGNMENT RULES

### Create Rule
**POST** `/assignment-rules`
- Define automatic assignment logic (class + subject → materials)
- Returns: Rule object with ID
```json
Request: {
  "rule_name": "Class 6 Math Auto-Assign",
  "rule_type": "class_subject_auto",
  "class_id": 6,
  "subject_id": 5,
  "material_type": "textbook",
  "due_date_offset": 7,
  "auto_assign": true
}
Response: {
  "id": 1,
  "rule_name": "Class 6 Math Auto-Assign",
  "is_active": true
}
```

### List Rules
**GET** `/assignment-rules`
- Get all active assignment rules
- Returns: Array of rule objects

### Execute Rule
**POST** `/assignment-rules/:id/execute`
- Execute rule and auto-assign to matching teachers
- Returns: Assignment statistics
```json
Response: {
  "rule_id": 1,
  "teachers_affected": 3,
  "materials_assigned": 5,
  "total_assignments_created": 15
}
```

---

## 🎓 INTERACTIVE SESSIONS

### Create Session
**POST** `/interactive-session`
- Start new teaching session for content generation
- Returns: Session object with ID
```json
Request: {
  "teacher_id": 1,
  "class_id": 6,
  "subject_id": 5,
  "chapter_session_id": 10,
  "session_date": "2024-01-15",
  "session_type": "ppt_generation"
}
Response: {
  "id": 1,
  "teacher_id": 1,
  "status": "active",
  "start_time": "2024-01-15T10:00:00Z"
}
```

**session_type** values:
- `ppt_generation` - Generate PowerPoint presentation
- `quiz_generation` - Generate quiz questions
- `youtube_recommendation` - Get curated videos
- `summary` - Generate study summary

### Retrieve Context
**POST** `/interactive-session/:id/retrieve-context`
- Get relevant chunks from Vector DB using RAG
- Returns: Retrieved chunks with similarity scores
```json
Request: {
  "query": "photosynthesis mechanisms",
  "limit": 5
}
Response: {
  "session_id": 1,
  "chunks_retrieved": 5,
  "chunks": [
    {
      "id": 101,
      "chunk_number": 5,
      "chunk_text": "..."
    }
  ]
}
```

### Generate PPT
**POST** `/interactive-session/:id/generate-ppt`
- Generate PowerPoint using RAG context
- Returns: Download URL and metadata
```json
Request: {
  "title": "Chapter 5 - Photosynthesis",
  "num_slides": 10
}
Response: {
  "session_id": 1,
  "content_type": "ppt",
  "content_url": "https://...",
  "slides": 10,
  "generated": true
}
```

### Generate Quiz
**POST** `/interactive-session/:id/generate-quiz`
- Generate quiz questions from chapter content
- Returns: Quiz JSON and download URL
```json
Request: {
  "title": "Chapter 5 Quiz",
  "num_questions": 10,
  "difficulty": "intermediate"
}
Response: {
  "session_id": 1,
  "content_type": "quiz",
  "content_url": "https://...",
  "questions": 10,
  "generated": true
}
```

**difficulty** values: `easy`, `intermediate`, `hard`

### Get YouTube Recommendations
**POST** `/interactive-session/:id/get-youtube-recommendations`
- Get curated video recommendations for topic
- Returns: Array of video objects with URLs
```json
Request: {}
Response: {
  "session_id": 1,
  "recommendations": [
    {
      "title": "Understanding Photosynthesis",
      "url": "https://youtube.com/...",
      "duration": "12:34",
      "relevance_score": 0.95
    }
  ]
}
```

### Complete Session
**PUT** `/interactive-session/:id/complete`
- Mark session as completed and save metrics
- Returns: Session with end time
```json
Request: {}
Response: {
  "session_id": 1,
  "status": "completed",
  "end_time": "2024-01-15T10:30:00Z"
}
```

---

## 👨‍🏫 TEACHER DASHBOARD

### Get Dashboard
**GET** `/teacher/:id/dashboard/class/:class_id/subject/:subject_id`
- Get personalized teacher dashboard
- Returns: Materials, sessions, actions, history
```json
Response: {
  "teacher": {
    "id": 1,
    "name": "John Doe"
  },
  "class": {
    "id": 6,
    "name": "Class 6"
  },
  "subject": {
    "id": 5,
    "name": "Science"
  },
  "available_materials": 12,
  "chapter_sessions": 24,
  "recent_sessions": 3,
  "quick_actions": [
    {
      "action": "generate_ppt",
      "label": "Generate PPT"
    }
  ]
}
```

---

## 🔄 COMMON WORKFLOWS

### Workflow 1: Upload & Auto-Assign
```bash
# 1. Upload material (existing endpoint)
POST /api/materials
  material.is_published = true

# 2. System auto-triggers assignment rule
# 3. Teachers get material in dashboard
# (No additional API calls needed)
```

### Workflow 2: Generate Content in One Session
```bash
# 1. Create session
POST /api/rag/interactive-session
  → Returns: session_id = 1

# 2. Retrieve context
POST /api/rag/interactive-session/1/retrieve-context
  → Returns: chunks for class/subject

# 3. Generate PPT
POST /api/rag/interactive-session/1/generate-ppt
  → Returns: download URL

# 4. Complete
PUT /api/rag/interactive-session/1/complete
  → Session saved
```

### Workflow 3: Auto-Assign Materials
```bash
# 1. Create rule
POST /api/rag/assignment-rules
  rule: "Class 6 Science auto-assign"

# 2. Execute rule
POST /api/rag/assignment-rules/1/execute
  → Teachers affected: 3
  → Assignments created: 15

# 3. Teachers see materials in dashboard
```

---

## 📊 RESPONSE STATUS CODES

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Normal operation |
| 201 | Created | Resource created (POST) |
| 400 | Bad Request | Missing required fields |
| 404 | Not Found | Material/Session ID invalid |
| 500 | Server Error | API key missing, LLM error |

---

## 🔧 COMMON ERRORS & FIXES

### Error: "No chunks found"
**Cause**: Material not chunked yet
**Fix**: Call `/materials/:id/chunk` first

### Error: "OpenAI API key not found"
**Cause**: OPENAI_API_KEY not in .env
**Fix**: Add `OPENAI_API_KEY=sk-...` to .env

### Error: "No teachers found for this class/subject"
**Cause**: Teacher mappings not created
**Fix**: Populate `teacher_class_subject_mapping` table

### Error: "Cache expired"
**Cause**: Generated content >24 hours old
**Fix**: Generate content again (recreates)

---

## ⚙️ OPTIONAL QUERY PARAMETERS

### Chunking
- `chunk_size=2000` - Larger chunks (default: 1000)
- `overlap=300` - More context overlap (default: 200)

### Retrieval
- `limit=10` - Get more chunks (default: 5)

### Generation
- `num_slides=15` - Create longer PPT (default: 10)
- `num_questions=20` - More quiz questions (default: 10)

---

## 📈 ESTIMATED RESPONSE TIMES

| Endpoint | Time | Notes |
|----------|------|-------|
| Chunk | 2-5s | Per 50KB of text |
| Embed | 3-8s | For 25 chunks (batched) |
| Create Sessions | 1-2s | Fast DB operation |
| Retrieve Context | 0.1-0.5s | Vector search |
| Generate PPT | 30-60s | LLM generation |
| Generate Quiz | 20-40s | LLM generation |
| Get Videos | <5s | Curated list |

---

## 💡 TIPS & BEST PRACTICES

1. **Batch Operations**: Chunk multiple materials together for efficiency
2. **Cache Usage**: Same class/subject PPT gets cached version (much faster)
3. **Query Limits**: Retrieve 5-7 chunks for good context (more = slower)
4. **Session Cleanup**: Always call `/complete` to save metrics
5. **Rule Testing**: Test rules on small class before scaling

---

## 🔐 AUTHENTICATION

**Method**: Bearer Token (implement in your frontend)
```bash
Header: Authorization: Bearer <teacher-jwt-token>
```

All endpoints validate teacher access to their class/subject.

---

## 📚 RELATED DOCS

- **Full Guide**: [RAG_IMPLEMENTATION_GUIDE.md](RAG_IMPLEMENTATION_GUIDE.md)
- **Architecture**: [INTELLIGENT_RAG_SUMMARY.md](INTELLIGENT_RAG_SUMMARY.md)
- **Quick Start**: [SMART_TEACHING_ASSISTANT.md](SMART_TEACHING_ASSISTANT.md)

---

**Version**: 1.0 | **Last Updated**: January 2024 | **Status**: Production Ready
