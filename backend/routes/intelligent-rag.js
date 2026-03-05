/**
 * Intelligent RAG & Interactive Teaching Routes
 * Material chunking, embedding, automatic assignment, and RAG-based content generation
 */

import express from 'express';
import { makeLooseModel } from '../server/supabase-model.js';

const router = express.Router();

// Initialize models
const Material = makeLooseModel('Material', 'materials');
const MaterialChunk = makeLooseModel('MaterialChunk', 'material_chunks');
const ChapterSession = makeLooseModel('ChapterSession', 'chapter_sessions');
const AssignmentRule = makeLooseModel('AssignmentRule', 'assignment_rules');
const AutomaticAssignment = makeLooseModel('AutomaticAssignment', 'automatic_assignments');
const InteractiveTeachingSession = makeLooseModel('InteractiveTeachingSession', 'interactive_teaching_sessions');
const GeneratedContentCache = makeLooseModel('GeneratedContentCache', 'generated_content_cache');
const EmbeddingJob = makeLooseModel('EmbeddingJob', 'embedding_jobs');
const RagRetrievalLog = makeLooseModel('RagRetrievalLog', 'rag_retrieval_log');
const TeacherClassSubjectMapping = makeLooseModel('TeacherClassSubjectMapping', 'teacher_class_subject_mapping');
const Chapter = makeLooseModel('Chapter', 'chapters');
const Topic = makeLooseModel('Topic', 'topics');
const Teacher = makeLooseModel('Teacher', 'teachers');
const Class = makeLooseModel('Class', 'classes');
const Subject = makeLooseModel('Subject', 'subjects');

const CACHE_TTL_HOURS = 24;
const CACHE_COST_SAVED_USD = {
  ppt: 0.1,
  quiz: 0.08,
  worksheet: 0.05,
  summary: 0.03,
};

// ============================================
// MATERIAL CHUNKING & EMBEDDING
// ============================================

/**
 * POST /api/rag/materials/:id/chunk
 * Chunk a material and prepare for embedding
 */
router.post('/materials/:id/chunk', async (req, res) => {
  try {
    const { id } = req.params;
    const { chunk_size = 1000, overlap = 200 } = req.body;

    // Get material
    const material = await Material.findOne({ id: parseInt(id) }).lean();
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Create embedding job
    const job = await EmbeddingJob.create({
      material_id: parseInt(id),
      job_type: 'chunk',
      status: 'processing',
    });

    // In production, this would:
    // 1. Extract text from PDF/document
    // 2. Split into chunks of chunk_size with overlap
    // 3. Store chunks in material_chunks table
    // 4. Update job status

    // For now, simulate chunk creation
    const chunks = [
      { text: `Introduction to ${material.title}` },
      { text: `Main content of ${material.title}` },
      { text: `Conclusion of ${material.title}` },
    ];

    const createdChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = await MaterialChunk.create({
        material_id: parseInt(id),
        chapter_id: material.chapter_id || null,
        topic_id: material.topic_id || null,
        chunk_number: i + 1,
        chunk_text: chunks[i].text,
        token_count: chunks[i].text.split(' ').length,
      });
      createdChunks.push(chunk);
    }

    // Update job
    await EmbeddingJob.findOneAndUpdate(
      { id: job.id },
      {
        status: 'completed',
        total_chunks: chunks.length,
        processed_chunks: chunks.length,
        completed_at: new Date(),
        progress_percentage: 100,
      }
    );

    res.json({
      material_id: parseInt(id),
      chunks_created: createdChunks.length,
      job_id: job.id,
      chunks: createdChunks,
    });
  } catch (err) {
    console.error('POST /api/rag/materials/:id/chunk error:', err);
    res.status(500).json({ error: 'Failed to chunk material' });
  }
});

/**
 * POST /api/rag/materials/:id/embed
 * Generate embeddings for material chunks
 */
router.post('/materials/:id/embed', async (req, res) => {
  try {
    const { id } = req.params;
    const { embedding_model = 'text-embedding-3-small' } = req.body;

    // Get all chunks for this material
    const chunks = await MaterialChunk.find({ material_id: parseInt(id) }).lean();
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No chunks found. Please chunk material first.' });
    }

    const job = await EmbeddingJob.create({
      material_id: parseInt(id),
      job_type: 'embed',
      status: 'processing',
      total_chunks: chunks.length,
    });

    // In production, call OpenAI API or similar:
    // const embedding = await openai.embeddings.create({
    //   model: embedding_model,
    //   input: chunk.chunk_text,
    // });

    // For now, simulate embeddings
    const updatedChunks = [];
    for (const chunk of chunks) {
      // Simulate embedding (in prod: call OpenAI)
      const mockEmbedding = Array(1536).fill(0).map(() => Math.random() * 2 - 1);
      
      const updated = await MaterialChunk.findOneAndUpdate(
        { id: chunk.id },
        {
          embedding: mockEmbedding,
          embedding_model,
        },
        { new: true }
      );
      updatedChunks.push(updated);
    }

    // Mark job complete
    await EmbeddingJob.findOneAndUpdate(
      { id: job.id },
      {
        status: 'completed',
        processed_chunks: chunks.length,
        progress_percentage: 100,
        completed_at: new Date(),
      }
    );

    res.json({
      material_id: parseInt(id),
      chunks_embedded: updatedChunks.length,
      embedding_model,
      job_id: job.id,
    });
  } catch (err) {
    console.error('POST /api/rag/materials/:id/embed error:', err);
    res.status(500).json({ error: 'Failed to embed material' });
  }
});

// ============================================
// CHAPTER SESSION DIVISION
// ============================================

/**
 * POST /api/rag/chapters/:id/create-sessions
 * Divide a chapter into teaching sessions
 */
router.post('/chapters/:id/create-sessions', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id, num_sessions } = req.body;

    if (!subject_id || !num_sessions) {
      return res.status(400).json({ error: 'subject_id and num_sessions are required' });
    }

    // Get chapter
    const chapter = await Chapter.findOne({ id: parseInt(id) }).lean();
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // Get chunks for this chapter
    const chunks = await MaterialChunk.find({ chapter_id: parseInt(id) }).lean();
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No chunks found for this chapter. Chunk material first.' });
    }

    // Calculate chunks per session
    const chunksPerSession = Math.ceil(chunks.length / num_sessions);
    const sessions = [];

    // Create sessions
    for (let i = 1; i <= num_sessions; i++) {
      const startIndex = (i - 1) * chunksPerSession;
      const endIndex = Math.min(i * chunksPerSession, chunks.length);
      const sessionChunks = chunks.slice(startIndex, endIndex);

      const session = await ChapterSession.create({
        chapter_id: parseInt(id),
        subject_id: parseInt(subject_id),
        session_number: i,
        total_sessions: num_sessions,
        title: `${chapter.name} - Session ${i}`,
        description: `Part ${i} of ${num_sessions}`,
        estimated_duration: 45 * i, // 45 min per session
        learning_objectives: [
          `Understand key concepts of session ${i}`,
          `Apply knowledge in practice`,
          `Prepare for assessment`,
        ],
        session_chunks: JSON.stringify(
          sessionChunks.map(c => ({ chunk_id: c.id, chunk_number: c.chunk_number }))
        ),
      });

      sessions.push(session);
    }

    res.status(201).json({
      chapter_id: parseInt(id),
      sessions_created: sessions.length,
      total_chunks: chunks.length,
      chunks_per_session: chunksPerSession,
      sessions,
    });
  } catch (err) {
    console.error('POST /api/rag/chapters/:id/create-sessions error:', err);
    res.status(500).json({ error: 'Failed to create sessions' });
  }
});

/**
 * GET /api/rag/chapters/:id/sessions
 * Get all sessions for a chapter
 */
router.get('/chapters/:id/sessions', async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await ChapterSession.find({ chapter_id: parseInt(id) }).lean();
    res.json(sessions);
  } catch (err) {
    console.error('GET /api/rag/chapters/:id/sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ============================================
// AUTOMATIC ASSIGNMENT RULES
// ============================================

/**
 * POST /api/rag/assignment-rules
 * Create an automatic assignment rule
 */
router.post('/assignment-rules', async (req, res) => {
  try {
    const {
      rule_name,
      rule_type,
      class_id,
      subject_id,
      material_category,
      material_type,
      due_date_offset = 7,
    } = req.body;

    if (!rule_name || !rule_type || !class_id || !subject_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rule = await AssignmentRule.create({
      rule_name,
      rule_type,
      class_id: parseInt(class_id),
      subject_id: parseInt(subject_id),
      material_category: material_category || null,
      material_type: material_type || null,
      due_date_offset: parseInt(due_date_offset),
      auto_assign: true,
      is_active: true,
    });

    res.status(201).json(rule);
  } catch (err) {
    console.error('POST /api/rag/assignment-rules error:', err);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

/**
 * GET /api/rag/assignment-rules
 * Get all assignment rules
 */
router.get('/assignment-rules', async (req, res) => {
  try {
    const rules = await AssignmentRule.find({ is_active: true }).lean();
    res.json(rules);
  } catch (err) {
    console.error('GET /api/rag/assignment-rules error:', err);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

/**
 * POST /api/rag/assignment-rules/:id/execute
 * Execute an assignment rule (assign to all teachers)
 */
router.post('/assignment-rules/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;

    // Get rule
    const rule = await AssignmentRule.findOne({ id: parseInt(id) }).lean();
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Get all teachers for this class and subject
    const teacherMappings = await TeacherClassSubjectMapping.find({
      class_id: rule.class_id,
      subject_id: rule.subject_id,
    }).lean();

    if (teacherMappings.length === 0) {
      return res.status(400).json({ error: 'No teachers found for this class/subject combination' });
    }

    // Get matching materials
    const materialQuery = {
      subject_id: rule.subject_id,
      is_published: true,
    };
    if (rule.material_category) materialQuery.category = rule.material_category;
    if (rule.material_type) materialQuery.material_type = rule.material_type;

    const materials = await Material.find(materialQuery).lean();

    // Create assignments
    let assignmentCount = 0;
    for (const mapping of teacherMappings) {
      for (const material of materials) {
        try {
          await AutomaticAssignment.create({
            assignment_rule_id: rule.id,
            material_id: material.id,
            teacher_id: mapping.teacher_id,
            class_id: rule.class_id,
            status: 'active',
          });
          assignmentCount++;
        } catch (err) {
          // Skip duplicates
        }
      }
    }

    res.json({
      rule_id: parseInt(id),
      teachers_affected: teacherMappings.length,
      materials_assigned: materials.length,
      total_assignments_created: assignmentCount,
    });
  } catch (err) {
    console.error('POST /api/rag/assignment-rules/:id/execute error:', err);
    res.status(500).json({ error: 'Failed to execute rule' });
  }
});

// ============================================
// INTERACTIVE TEACHING SESSIONS
// ============================================

/**
 * POST /api/rag/interactive-session
 * Create an interactive teaching session
 */
router.post('/interactive-session', async (req, res) => {
  try {
    const {
      teacher_id,
      class_id,
      subject_id,
      chapter_id,
      chapter_session_id,
      session_date,
      session_type, // 'ppt_generation', 'quiz_generation', 'summary', 'youtube_recommendation'
      student_count,
    } = req.body;

    if (!teacher_id || !class_id || !subject_id || !session_date || !session_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await InteractiveTeachingSession.create({
      teacher_id: parseInt(teacher_id),
      class_id: parseInt(class_id),
      subject_id: parseInt(subject_id),
      chapter_id: chapter_id ? parseInt(chapter_id) : null,
      chapter_session_id: chapter_session_id ? parseInt(chapter_session_id) : null,
      session_date,
      session_type,
      start_time: new Date(),
      student_count: student_count || 0,
      status: 'active',
    });

    res.status(201).json(session);
  } catch (err) {
    console.error('POST /api/rag/interactive-session error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * POST /api/rag/interactive-session/:id/retrieve-context
 * Retrieve relevant chunks for this class/subject from Vector DB
 */
router.post('/interactive-session/:id/retrieve-context', async (req, res) => {
  try {
    const { id } = req.params;
    const { query, limit = 5 } = req.body;

    // Get session
    const session = await InteractiveTeachingSession.findOne({ id: parseInt(id) }).lean();
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get relevant chunks for class/subject
    const chunks = await MaterialChunk.find({}).lean();

    // Filter by subject and chapter (in production, this would use cosine similarity)
    const relevantChunks = chunks
      .filter(c => {
        // Get material to check subject
        return true; // Simplified for demo
      })
      .slice(0, limit);

    // Log retrieval
    const retrievalLog = await RagRetrievalLog.create({
      interactive_session_id: parseInt(id),
      query_text: query,
      retrieved_chunks: JSON.stringify(relevantChunks.map(c => c.id)),
      chunk_count: relevantChunks.length,
      retrieval_time_ms: 100,
      used_for_generation: true,
    });

    // Update session
    await InteractiveTeachingSession.findOneAndUpdate(
      { id: parseInt(id) },
      { context_embeddings_retrieved: relevantChunks.length }
    );

    res.json({
      session_id: parseInt(id),
      chunks_retrieved: relevantChunks.length,
      chunks: relevantChunks,
      retrieval_log_id: retrievalLog.id,
    });
  } catch (err) {
    console.error('POST /api/rag/interactive-session/:id/retrieve-context error:', err);
    res.status(500).json({ error: 'Failed to retrieve context' });
  }
});

/**
 * POST /api/rag/interactive-session/:id/generate-ppt
 * Generate PPT based on class/subject context
 */
router.post('/interactive-session/:id/generate-ppt', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, num_slides = 10 } = req.body;

    const session = await InteractiveTeachingSession.findOne({ id: parseInt(id) }).lean();
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check cache first
    let cached = await GeneratedContentCache.findOne({
      content_type: 'ppt',
      class_id: session.class_id,
      subject_id: session.subject_id,
      chapter_session_id: session.chapter_session_id,
    }).lean();

    if (cached && new Date(cached.cache_valid_until) > new Date()) {
      await GeneratedContentCache.findOneAndUpdate(
        { id: cached.id },
        {
          access_count: (cached.access_count || 0) + 1,
          last_accessed_at: new Date(),
        }
      );
      return res.json({
        session_id: parseInt(id),
        content_type: 'ppt',
        content_url: cached.content_url,
        generated: false,
        cached: true,
      });
    }

    // In production:
    // 1. Retrieve context from Vector DB
    // 2. Call LLM with prompt
    // 3. Call PPT generation API (e.g., python-pptx)
    // 4. Cache result

    // Simulate PPT generation
    const mockPptUrl = `https://generated-content.com/ppt_${session.id}_${Date.now()}.pptx`;

    const generatedContent = await GeneratedContentCache.create({
      content_type: 'ppt',
      class_id: session.class_id,
      subject_id: session.subject_id,
      chapter_session_id: session.chapter_session_id,
      content_url: mockPptUrl,
      content_file_name: `${title || 'Generated'}_PPT.pptx`,
      content_metadata: JSON.stringify({
        slides: num_slides,
        title,
        class_id: session.class_id,
        subject_id: session.subject_id,
      }),
      generation_prompt: `Generate PPT for ${title} class ${session.class_id} subject ${session.subject_id}`,
      ai_model_used: 'gpt-4',
      generation_time_seconds: 30,
      cache_valid_until: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
      access_count: 1,
      last_accessed_at: new Date(),
    });

    // Update session
    await InteractiveTeachingSession.findOneAndUpdate(
      { id: parseInt(id) },
      {
        interactive_content: JSON.stringify({
          ppt_url: mockPptUrl,
          generated_at: new Date(),
        }),
      }
    );

    res.json({
      session_id: parseInt(id),
      content_type: 'ppt',
      content_url: mockPptUrl,
      slides: num_slides,
      title,
      generated: true,
    });
  } catch (err) {
    console.error('POST /api/rag/interactive-session/:id/generate-ppt error:', err);
    res.status(500).json({ error: 'Failed to generate PPT' });
  }
});

/**
 * POST /api/rag/interactive-session/:id/generate-quiz
 * Generate quiz based on class/subject context
 */
router.post('/interactive-session/:id/generate-quiz', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, num_questions = 10, difficulty = 'intermediate' } = req.body;

    const session = await InteractiveTeachingSession.findOne({ id: parseInt(id) }).lean();
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check cache
    let cached = await GeneratedContentCache.findOne({
      content_type: 'quiz',
      class_id: session.class_id,
      subject_id: session.subject_id,
    }).lean();

    if (cached && new Date(cached.cache_valid_until) > new Date()) {
      await GeneratedContentCache.findOneAndUpdate(
        { id: cached.id },
        {
          access_count: (cached.access_count || 0) + 1,
          last_accessed_at: new Date(),
        }
      );
      return res.json({
        session_id: parseInt(id),
        content_type: 'quiz',
        content_url: cached.content_url,
        generated: false,
        cached: true,
      });
    }

    // Simulate quiz generation
    const mockQuizUrl = `https://generated-content.com/quiz_${session.id}_${Date.now()}.json`;

    const generatedContent = await GeneratedContentCache.create({
      content_type: 'quiz',
      class_id: session.class_id,
      subject_id: session.subject_id,
      chapter_session_id: session.chapter_session_id,
      content_url: mockQuizUrl,
      content_file_name: `${title || 'Generated'}_Quiz.json`,
      content_metadata: JSON.stringify({
        questions: num_questions,
        difficulty,
        title,
      }),
      generation_prompt: `Generate ${difficulty} quiz with ${num_questions} questions for class ${session.class_id}`,
      ai_model_used: 'gpt-4',
      generation_time_seconds: 20,
      cache_valid_until: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
      access_count: 1,
      last_accessed_at: new Date(),
    });

    res.json({
      session_id: parseInt(id),
      content_type: 'quiz',
      content_url: mockQuizUrl,
      questions: num_questions,
      difficulty,
      title,
      generated: true,
    });
  } catch (err) {
    console.error('POST /api/rag/interactive-session/:id/generate-quiz error:', err);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

/**
 * POST /api/rag/interactive-session/:id/get-youtube-recommendations
 * Get curated YouTube videos for this class/subject
 */
router.post('/interactive-session/:id/get-youtube-recommendations', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await InteractiveTeachingSession.findOne({ id: parseInt(id) }).lean();
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get YouTube recommendations for this chapter (if applicable)
    // In a real implementation, fetch from youtube_recommendations table

    const recommendations = [
      {
        title: 'Understanding Concepts',
        url: 'https://youtube.com/watch?v=example1',
        duration: 1200,
      },
      {
        title: 'Real-world Applications',
        url: 'https://youtube.com/watch?v=example2',
        duration: 900,
      },
    ];

    res.json({
      session_id: parseInt(id),
      class_id: session.class_id,
      subject_id: session.subject_id,
      recommendations,
    });
  } catch (err) {
    console.error('POST /api/rag/interactive-session/:id/get-youtube-recommendations error:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * PUT /api/rag/interactive-session/:id/complete
 * Mark session as completed
 */
router.put('/interactive-session/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await InteractiveTeachingSession.findOneAndUpdate(
      { id: parseInt(id) },
      {
        status: 'completed',
        end_time: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      session_id: parseInt(id),
      status: 'completed',
      end_time: session.end_time,
    });
  } catch (err) {
    console.error('PUT /api/rag/interactive-session/:id/complete error:', err);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// ============================================
// TEACHER DASHBOARD - CONTEXT-AWARE
// ============================================

/**
 * GET /api/rag/teacher/:id/dashboard/class/:class_id/subject/:subject_id
 * Get teacher dashboard for specific class and subject
 */
router.get('/teacher/:id/dashboard/class/:class_id/subject/:subject_id', async (req, res) => {
  try {
    const { id: teacherId, class_id: classId, subject_id: subjectId } = req.params;

    // Get teacher info
    const teacher = await Teacher.findOne({ id: parseInt(teacherId) }).lean();
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Get class info
    const classInfo = await Class.findOne({ id: parseInt(classId) }).lean();
    const subject = await Subject.findOne({ id: parseInt(subjectId) }).lean();

    // Get assigned materials for this class/subject
    const materials = await Material.find({
      subject_id: parseInt(subjectId),
    }).lean();

    // Get chapter sessions
    const chapters = await Chapter.find({ subject_id: parseInt(subjectId) }).lean();
    const sessions = await ChapterSession.find({
      subject_id: parseInt(subjectId),
    }).lean();

    // Get recent interactive sessions
    const recentSessions = await InteractiveTeachingSession.find({
      teacher_id: parseInt(teacherId),
      class_id: parseInt(classId),
      subject_id: parseInt(subjectId),
    }).lean();

    res.json({
      teacher: { id: teacher.id, name: teacher.full_name },
      class: { id: classInfo.id, name: classInfo.name },
      subject: { id: subject.id, name: subject.name },
      available_materials: materials.length,
      materials: materials.slice(0, 5),
      chapters: chapters.length,
      chapter_sessions: sessions.length,
      recent_sessions: recentSessions.slice(0, 3),
      quick_actions: [
        { action: 'generate_ppt', label: 'Generate PPT' },
        { action: 'generate_quiz', label: 'Create Quiz' },
        { action: 'get_videos', label: 'YouTube Videos' },
        { action: 'summary', label: 'AI Summary' },
      ],
    });
  } catch (err) {
    console.error('GET /api/rag/teacher/:id/dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// ============================================
// CACHE OPERATIONS (COST CONTROL)
// ============================================

/**
 * GET /api/rag/cache/stats
 * Returns cache hit/cost-saving summary
 */
router.get('/cache/stats', async (_req, res) => {
  try {
    const allCache = await GeneratedContentCache.find({}).lean();
    const now = new Date();
    const active = allCache.filter((entry) => !entry.cache_valid_until || new Date(entry.cache_valid_until) > now);

    let totalAccesses = 0;
    let estimatedSavings = 0;
    const byType = {};

    for (const row of active) {
      const type = row.content_type || 'unknown';
      const accesses = row.access_count || 0;
      const unitSave = CACHE_COST_SAVED_USD[type] || 0;

      totalAccesses += accesses;
      estimatedSavings += accesses * unitSave;

      if (!byType[type]) {
        byType[type] = { entries: 0, accesses: 0, estimated_savings_usd: 0 };
      }

      byType[type].entries += 1;
      byType[type].accesses += accesses;
      byType[type].estimated_savings_usd += accesses * unitSave;
    }

    res.json({
      active_cache_entries: active.length,
      total_cache_accesses: totalAccesses,
      estimated_savings_usd: Number(estimatedSavings.toFixed(2)),
      by_type: byType,
      ttl_hours: CACHE_TTL_HOURS,
    });
  } catch (err) {
    console.error('GET /api/rag/cache/stats error:', err);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

/**
 * POST /api/rag/cache/cleanup
 * Removes expired cache rows
 */
router.post('/cache/cleanup', async (_req, res) => {
  try {
    const now = new Date();
    const allCache = await GeneratedContentCache.find({}).lean();
    const expired = allCache.filter((entry) => entry.cache_valid_until && new Date(entry.cache_valid_until) <= now);

    let deleted = 0;
    for (const row of expired) {
      await GeneratedContentCache.findOneAndDelete({ id: row.id });
      deleted += 1;
    }

    res.json({ deleted_expired_entries: deleted });
  } catch (err) {
    console.error('POST /api/rag/cache/cleanup error:', err);
    res.status(500).json({ error: 'Failed to cleanup cache' });
  }
});

/**
 * POST /api/rag/cache/invalidate
 * Invalidates cache for a specific context
 */
router.post('/cache/invalidate', async (req, res) => {
  try {
    const { content_type, class_id, subject_id, chapter_session_id } = req.body || {};
    if (!content_type) {
      return res.status(400).json({ error: 'content_type is required' });
    }

    const query = { content_type };
    if (class_id != null) query.class_id = parseInt(class_id);
    if (subject_id != null) query.subject_id = parseInt(subject_id);
    if (chapter_session_id != null) query.chapter_session_id = parseInt(chapter_session_id);

    const rows = await GeneratedContentCache.find(query).lean();
    let invalidated = 0;
    for (const row of rows) {
      await GeneratedContentCache.findOneAndUpdate(
        { id: row.id },
        { cache_valid_until: new Date(Date.now() - 1000) }
      );
      invalidated += 1;
    }

    res.json({ invalidated_entries: invalidated, scope: query });
  } catch (err) {
    console.error('POST /api/rag/cache/invalidate error:', err);
    res.status(500).json({ error: 'Failed to invalidate cache' });
  }
});

export default router;
