/**
 * Intelligent RAG & Interactive Teaching Routes
 * Material chunking, embedding, automatic assignment, and Claude-based content generation
 */

import express from 'express';
import { makeLooseModel } from '../server/supabase-model.js';
import {
  splitTextIntoChunks,
  cleanText,
  processMaterialContent,
  validateChunks,
} from '../services/material-chunking.js';
import {
  generatePPTStructure,
  generateQuizQuestions,
  generateStudySummary,
  getYouTubeRecommendations,
  generateWorksheet,
  generateEmbedding,
  findSimilarChunks,
  cosineSimilarity,
} from '../services/content-generation.js';

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
// HELPER: Get subject/chapter names from IDs
// ============================================
async function resolveNames(subjectId, chapterId, classId) {
  const subject = subjectId ? await Subject.findOne({ id: parseInt(subjectId) }).lean() : null;
  const chapter = chapterId ? await Chapter.findOne({ id: parseInt(chapterId) }).lean() : null;
  const cls = classId ? await Class.findOne({ id: parseInt(classId) }).lean() : null;
  return {
    subjectName: subject?.name || 'General',
    chapterName: chapter?.name || 'General Topic',
    grade: cls?.grade || 6,
  };
}

// ============================================
// MATERIAL CHUNKING & EMBEDDING
// ============================================

/**
 * POST /api/rag/materials/:id/chunk
 * Chunk a material's content and store in DB
 */
router.post('/materials/:id/chunk', async (req, res) => {
  try {
    const { id } = req.params;
    const { chunk_size = 1000, overlap = 200, content } = req.body;

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

    // Determine text to chunk
    let textContent = content || material.description || '';

    // If no content provided and no description, return error
    if (!textContent.trim()) {
      await EmbeddingJob.findOneAndUpdate({ id: job.id }, { status: 'failed', error_message: 'No text content to chunk' });
      return res.status(400).json({ error: 'No text content provided. Pass "content" in body or ensure material has description.' });
    }

    // Clean and chunk the text
    const cleaned = cleanText(textContent);
    const rawChunks = splitTextIntoChunks(cleaned, chunk_size, overlap);
    const validChunks = validateChunks(rawChunks);

    // If validation removed all chunks, use raw chunks (content might be short)
    const chunksToStore = validChunks.length > 0 ? validChunks : rawChunks;

    // Delete existing chunks for this material (re-chunking)
    const existing = await MaterialChunk.find({ material_id: parseInt(id) }).lean();
    for (const old of existing) {
      await MaterialChunk.findOneAndDelete({ id: old.id });
    }

    // Store chunks in DB
    const createdChunks = [];
    for (let i = 0; i < chunksToStore.length; i++) {
      const chunk = chunksToStore[i];
      // Generate embedding for each chunk
      const embeddingVec = generateEmbedding(chunk.text);

      const created = await MaterialChunk.create({
        material_id: parseInt(id),
        chapter_id: material.chapter_id || null,
        topic_id: material.topic_id || null,
        chunk_number: i + 1,
        chunk_text: chunk.text,
        token_count: chunk.token_count,
        chunk_metadata: JSON.stringify({ embedding_256: embeddingVec }),
      });
      createdChunks.push(created);
    }

    // Update job
    await EmbeddingJob.findOneAndUpdate(
      { id: job.id },
      {
        status: 'completed',
        total_chunks: createdChunks.length,
        processed_chunks: createdChunks.length,
        completed_at: new Date(),
        progress_percentage: 100,
      }
    );

    res.json({
      material_id: parseInt(id),
      chunks_created: createdChunks.length,
      job_id: job.id,
      chunks: createdChunks.map(c => ({ id: c.id, chunk_number: c.chunk_number, token_count: c.token_count, preview: (c.chunk_text || '').slice(0, 100) })),
    });
  } catch (err) {
    console.error('POST /api/rag/materials/:id/chunk error:', err);
    res.status(500).json({ error: 'Failed to chunk material' });
  }
});

/**
 * POST /api/rag/materials/:id/embed
 * Re-generate embeddings for all chunks of a material
 */
router.post('/materials/:id/embed', async (req, res) => {
  try {
    const { id } = req.params;

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

    const updatedChunks = [];
    for (const chunk of chunks) {
      const embeddingVec = generateEmbedding(chunk.chunk_text || '');

      // Store embedding in chunk_metadata
      const meta = typeof chunk.chunk_metadata === 'string' ? JSON.parse(chunk.chunk_metadata || '{}') : (chunk.chunk_metadata || {});
      meta.embedding_256 = embeddingVec;

      await MaterialChunk.findOneAndUpdate(
        { id: chunk.id },
        { chunk_metadata: JSON.stringify(meta) },
        { new: true }
      );
      updatedChunks.push(chunk.id);
    }

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
      embedding_model: 'trigram-256',
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

router.post('/chapters/:id/create-sessions', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id, num_sessions } = req.body;

    if (!subject_id || !num_sessions) {
      return res.status(400).json({ error: 'subject_id and num_sessions are required' });
    }

    const chapter = await Chapter.findOne({ id: parseInt(id) }).lean();
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    const chunks = await MaterialChunk.find({ chapter_id: parseInt(id) }).lean();
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No chunks found for this chapter. Chunk material first.' });
    }

    const chunksPerSession = Math.ceil(chunks.length / num_sessions);
    const sessions = [];

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
        estimated_duration: 45,
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

router.post('/assignment-rules', async (req, res) => {
  try {
    const { rule_name, rule_type, class_id, subject_id, material_category, material_type, due_date_offset = 7 } = req.body;
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

router.get('/assignment-rules', async (req, res) => {
  try {
    const rules = await AssignmentRule.find({ is_active: true }).lean();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

router.post('/assignment-rules/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await AssignmentRule.findOne({ id: parseInt(id) }).lean();
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    const teacherMappings = await TeacherClassSubjectMapping.find({
      class_id: rule.class_id,
      subject_id: rule.subject_id,
    }).lean();

    if (teacherMappings.length === 0) {
      return res.status(400).json({ error: 'No teachers found for this class/subject combination' });
    }

    const materialQuery = { subject_id: rule.subject_id, is_published: true };
    if (rule.material_category) materialQuery.category = rule.material_category;
    if (rule.material_type) materialQuery.material_type = rule.material_type;

    const materials = await Material.find(materialQuery).lean();
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
        } catch (err) { /* skip duplicates */ }
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

router.post('/interactive-session', async (req, res) => {
  try {
    const { teacher_id, class_id, subject_id, chapter_id, chapter_session_id, session_date, session_type, student_count } = req.body;

    if (!teacher_id || !class_id || !subject_id || !session_date || !session_type) {
      return res.status(400).json({ error: 'Missing required fields: teacher_id, class_id, subject_id, session_date, session_type' });
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
 * Retrieve relevant chunks using keyword-embedding similarity
 */
router.post('/interactive-session/:id/retrieve-context', async (req, res) => {
  try {
    const { id } = req.params;
    const { query, limit = 5 } = req.body;

    const session = await InteractiveTeachingSession.findOne({ id: parseInt(id) }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const startMs = Date.now();

    // Get all chunks (filter by subject via material)
    const allChunks = await MaterialChunk.find({}).lean();

    // Parse embeddings from chunk_metadata
    const chunksWithEmbeddings = allChunks.map(c => {
      let meta = {};
      try { meta = typeof c.chunk_metadata === 'string' ? JSON.parse(c.chunk_metadata) : (c.chunk_metadata || {}); } catch { /* ignore */ }
      return { ...c, embedding: meta.embedding_256 || null };
    }).filter(c => c.embedding);

    let relevantChunks;
    if (query && chunksWithEmbeddings.length > 0) {
      // Use embedding similarity
      const queryEmb = generateEmbedding(query);
      relevantChunks = findSimilarChunks(queryEmb, chunksWithEmbeddings, limit);
    } else {
      // Fallback: filter by chapter_id if available
      const filtered = allChunks.filter(c => {
        if (session.chapter_id) return c.chapter_id === session.chapter_id;
        return true;
      });
      relevantChunks = filtered.slice(0, limit).map(c => ({ ...c, similarity: 1.0 }));
    }

    const retrievalTimeMs = Date.now() - startMs;

    // Log retrieval
    await RagRetrievalLog.create({
      interactive_session_id: parseInt(id),
      query_text: query || 'no query',
      retrieved_chunks: JSON.stringify(relevantChunks.map(c => c.id)),
      relevance_scores: JSON.stringify(relevantChunks.map(c => c.similarity || 0)),
      chunk_count: relevantChunks.length,
      retrieval_time_ms: retrievalTimeMs,
      used_for_generation: true,
    });

    await InteractiveTeachingSession.findOneAndUpdate(
      { id: parseInt(id) },
      { context_embeddings_retrieved: relevantChunks.length }
    );

    res.json({
      session_id: parseInt(id),
      chunks_retrieved: relevantChunks.length,
      retrieval_time_ms: retrievalTimeMs,
      chunks: relevantChunks.map(c => ({
        id: c.id,
        chunk_number: c.chunk_number,
        chunk_text: c.chunk_text,
        similarity: c.similarity,
        chapter_id: c.chapter_id,
      })),
    });
  } catch (err) {
    console.error('POST /api/rag/interactive-session/:id/retrieve-context error:', err);
    res.status(500).json({ error: 'Failed to retrieve context' });
  }
});

/**
 * POST /api/rag/interactive-session/:id/generate-ppt
 * Generate PPT using Claude with RAG context
 */
router.post('/interactive-session/:id/generate-ppt', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, num_slides = 10 } = req.body;

    const session = await InteractiveTeachingSession.findOne({ id: parseInt(id) }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Check cache first
    const cached = await GeneratedContentCache.findOne({
      content_type: 'ppt',
      class_id: session.class_id,
      subject_id: session.subject_id,
      chapter_session_id: session.chapter_session_id,
    }).lean();

    if (cached && cached.cache_valid_until && new Date(cached.cache_valid_until) > new Date()) {
      await GeneratedContentCache.findOneAndUpdate(
        { id: cached.id },
        { access_count: (cached.access_count || 0) + 1, last_accessed_at: new Date() }
      );
      const cachedContent = typeof cached.content_metadata === 'string' ? JSON.parse(cached.content_metadata) : cached.content_metadata;
      return res.json({
        session_id: parseInt(id),
        content_type: 'ppt',
        generated: false,
        cached: true,
        data: cachedContent,
      });
    }

    // Resolve names for guardrails
    const { subjectName, chapterName, grade } = await resolveNames(session.subject_id, session.chapter_id, session.class_id);

    // Get context chunks
    const chunks = await MaterialChunk.find({ chapter_id: session.chapter_id }).lean();
    const contextChunks = chunks.length > 0 ? chunks.slice(0, 10) : [];

    // Generate PPT with Claude
    const startTime = Date.now();
    const pptData = await generatePPTStructure(subjectName, chapterName, grade, contextChunks, title || `${chapterName} - ${subjectName}`);
    const genSeconds = Math.round((Date.now() - startTime) / 1000);

    // Cache the result
    await GeneratedContentCache.create({
      content_type: 'ppt',
      class_id: session.class_id,
      subject_id: session.subject_id,
      chapter_session_id: session.chapter_session_id || null,
      content_metadata: JSON.stringify(pptData),
      content_file_name: `${title || chapterName}_PPT.json`,
      generation_prompt: `PPT for ${subjectName} - ${chapterName} Grade ${grade}`,
      ai_model_used: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      generation_time_seconds: genSeconds,
      cache_valid_until: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
      access_count: 1,
      last_accessed_at: new Date(),
    });

    // Update session
    await InteractiveTeachingSession.findOneAndUpdate(
      { id: parseInt(id) },
      { interactive_content: JSON.stringify({ ppt: pptData, generated_at: new Date() }), ai_model_used: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514' }
    );

    res.json({
      session_id: parseInt(id),
      content_type: 'ppt',
      generated: true,
      cached: false,
      generation_time_seconds: genSeconds,
      data: pptData,
    });
  } catch (err) {
    console.error('POST /api/rag/interactive-session/:id/generate-ppt error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate PPT' });
  }
});

/**
 * POST /api/rag/interactive-session/:id/generate-quiz
 * Generate quiz using Claude with RAG context
 */
router.post('/interactive-session/:id/generate-quiz', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, num_questions = 10, difficulty = 'intermediate' } = req.body;

    const session = await InteractiveTeachingSession.findOne({ id: parseInt(id) }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Check cache
    const cached = await GeneratedContentCache.findOne({
      content_type: 'quiz',
      class_id: session.class_id,
      subject_id: session.subject_id,
    }).lean();

    if (cached && cached.cache_valid_until && new Date(cached.cache_valid_until) > new Date()) {
      await GeneratedContentCache.findOneAndUpdate(
        { id: cached.id },
        { access_count: (cached.access_count || 0) + 1, last_accessed_at: new Date() }
      );
      const cachedContent = typeof cached.content_metadata === 'string' ? JSON.parse(cached.content_metadata) : cached.content_metadata;
      return res.json({
        session_id: parseInt(id),
        content_type: 'quiz',
        generated: false,
        cached: true,
        data: cachedContent,
      });
    }

    const { subjectName, chapterName, grade } = await resolveNames(session.subject_id, session.chapter_id, session.class_id);
    const chunks = await MaterialChunk.find({ chapter_id: session.chapter_id }).lean();

    const startTime = Date.now();
    const quizData = await generateQuizQuestions(subjectName, chapterName, grade, chunks.slice(0, 10), num_questions, difficulty);
    const genSeconds = Math.round((Date.now() - startTime) / 1000);

    await GeneratedContentCache.create({
      content_type: 'quiz',
      class_id: session.class_id,
      subject_id: session.subject_id,
      chapter_session_id: session.chapter_session_id || null,
      content_metadata: JSON.stringify(quizData),
      content_file_name: `${title || chapterName}_Quiz.json`,
      generation_prompt: `Quiz for ${subjectName} - ${chapterName} Grade ${grade} ${difficulty}`,
      ai_model_used: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      generation_time_seconds: genSeconds,
      cache_valid_until: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
      access_count: 1,
      last_accessed_at: new Date(),
    });

    res.json({
      session_id: parseInt(id),
      content_type: 'quiz',
      generated: true,
      cached: false,
      generation_time_seconds: genSeconds,
      data: quizData,
    });
  } catch (err) {
    console.error('POST /api/rag/interactive-session/:id/generate-quiz error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz' });
  }
});

/**
 * POST /api/rag/interactive-session/:id/generate-summary
 * Generate study summary using Claude
 */
router.post('/interactive-session/:id/generate-summary', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await InteractiveTeachingSession.findOne({ id: parseInt(id) }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Check cache
    const cached = await GeneratedContentCache.findOne({
      content_type: 'summary',
      class_id: session.class_id,
      subject_id: session.subject_id,
    }).lean();

    if (cached && cached.cache_valid_until && new Date(cached.cache_valid_until) > new Date()) {
      await GeneratedContentCache.findOneAndUpdate(
        { id: cached.id },
        { access_count: (cached.access_count || 0) + 1, last_accessed_at: new Date() }
      );
      const cachedContent = typeof cached.content_metadata === 'string' ? JSON.parse(cached.content_metadata) : cached.content_metadata;
      return res.json({ session_id: parseInt(id), content_type: 'summary', generated: false, cached: true, data: cachedContent });
    }

    const { subjectName, chapterName, grade } = await resolveNames(session.subject_id, session.chapter_id, session.class_id);
    const chunks = await MaterialChunk.find({ chapter_id: session.chapter_id }).lean();

    const startTime = Date.now();
    const summaryData = await generateStudySummary(subjectName, chapterName, grade, chunks.slice(0, 10));
    const genSeconds = Math.round((Date.now() - startTime) / 1000);

    await GeneratedContentCache.create({
      content_type: 'summary',
      class_id: session.class_id,
      subject_id: session.subject_id,
      chapter_session_id: session.chapter_session_id || null,
      content_metadata: JSON.stringify(summaryData),
      generation_prompt: `Summary for ${subjectName} - ${chapterName} Grade ${grade}`,
      ai_model_used: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      generation_time_seconds: genSeconds,
      cache_valid_until: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
      access_count: 1,
      last_accessed_at: new Date(),
    });

    res.json({ session_id: parseInt(id), content_type: 'summary', generated: true, cached: false, generation_time_seconds: genSeconds, data: summaryData });
  } catch (err) {
    console.error('POST /api/rag/interactive-session/:id/generate-summary error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate summary' });
  }
});

/**
 * POST /api/rag/interactive-session/:id/get-youtube-recommendations
 * Get YouTube search suggestions using Claude
 */
router.post('/interactive-session/:id/get-youtube-recommendations', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await InteractiveTeachingSession.findOne({ id: parseInt(id) }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { subjectName, chapterName, grade } = await resolveNames(session.subject_id, session.chapter_id, session.class_id);
    const chunks = await MaterialChunk.find({ chapter_id: session.chapter_id }).lean();

    const startTime = Date.now();
    const ytData = await getYouTubeRecommendations(subjectName, chapterName, grade, chunks.slice(0, 5));
    const genSeconds = Math.round((Date.now() - startTime) / 1000);

    res.json({
      session_id: parseInt(id),
      content_type: 'youtube',
      generation_time_seconds: genSeconds,
      data: ytData,
    });
  } catch (err) {
    console.error('POST /api/rag/interactive-session/:id/get-youtube-recommendations error:', err);
    res.status(500).json({ error: err.message || 'Failed to get recommendations' });
  }
});

/**
 * POST /api/rag/interactive-session/:id/generate-worksheet
 * Generate worksheet using Claude
 */
router.post('/interactive-session/:id/generate-worksheet', async (req, res) => {
  try {
    const { id } = req.params;
    const { num_questions = 15 } = req.body;

    const session = await InteractiveTeachingSession.findOne({ id: parseInt(id) }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { subjectName, chapterName, grade } = await resolveNames(session.subject_id, session.chapter_id, session.class_id);
    const chunks = await MaterialChunk.find({ chapter_id: session.chapter_id }).lean();

    const startTime = Date.now();
    const worksheetData = await generateWorksheet(subjectName, chapterName, grade, chunks.slice(0, 10), num_questions);
    const genSeconds = Math.round((Date.now() - startTime) / 1000);

    await GeneratedContentCache.create({
      content_type: 'worksheet',
      class_id: session.class_id,
      subject_id: session.subject_id,
      chapter_session_id: session.chapter_session_id || null,
      content_metadata: JSON.stringify(worksheetData),
      generation_prompt: `Worksheet for ${subjectName} - ${chapterName} Grade ${grade}`,
      ai_model_used: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      generation_time_seconds: genSeconds,
      cache_valid_until: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
      access_count: 1,
      last_accessed_at: new Date(),
    });

    res.json({
      session_id: parseInt(id),
      content_type: 'worksheet',
      generated: true,
      generation_time_seconds: genSeconds,
      data: worksheetData,
    });
  } catch (err) {
    console.error('POST /api/rag/interactive-session/:id/generate-worksheet error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate worksheet' });
  }
});

/**
 * PUT /api/rag/interactive-session/:id/complete
 */
router.put('/interactive-session/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await InteractiveTeachingSession.findOneAndUpdate(
      { id: parseInt(id) },
      { status: 'completed', end_time: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session_id: parseInt(id), status: 'completed', end_time: session.end_time });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// ============================================
// DIRECT GENERATION (no session needed)
// ============================================

/**
 * POST /api/rag/generate
 * Direct content generation without creating a session first
 * Great for quick generation from the admin or teacher dashboard
 */
router.post('/generate', async (req, res) => {
  try {
    const { type, subject_id, chapter_id, class_id, title, num_questions, difficulty, num_slides } = req.body;

    if (!type || !subject_id) {
      return res.status(400).json({ error: 'type and subject_id are required. type: ppt|quiz|summary|youtube|worksheet' });
    }

    const { subjectName, chapterName, grade } = await resolveNames(subject_id, chapter_id, class_id);
    const chunks = chapter_id ? await MaterialChunk.find({ chapter_id: parseInt(chapter_id) }).lean() : [];

    let data;
    const startTime = Date.now();

    switch (type) {
      case 'ppt':
        data = await generatePPTStructure(subjectName, chapterName, grade, chunks.slice(0, 10), title || `${chapterName}`);
        break;
      case 'quiz':
        data = await generateQuizQuestions(subjectName, chapterName, grade, chunks.slice(0, 10), num_questions || 10, difficulty || 'intermediate');
        break;
      case 'summary':
        data = await generateStudySummary(subjectName, chapterName, grade, chunks.slice(0, 10));
        break;
      case 'youtube':
        data = await getYouTubeRecommendations(subjectName, chapterName, grade, chunks.slice(0, 5));
        break;
      case 'worksheet':
        data = await generateWorksheet(subjectName, chapterName, grade, chunks.slice(0, 10), num_questions || 15);
        break;
      default:
        return res.status(400).json({ error: `Unknown type: ${type}. Use: ppt, quiz, summary, youtube, worksheet` });
    }

    const genSeconds = Math.round((Date.now() - startTime) / 1000);

    res.json({
      content_type: type,
      subject: subjectName,
      chapter: chapterName,
      grade,
      generation_time_seconds: genSeconds,
      data,
    });
  } catch (err) {
    console.error('POST /api/rag/generate error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate content' });
  }
});

// ============================================
// TEACHER DASHBOARD
// ============================================

router.get('/teacher/:id/dashboard/class/:class_id/subject/:subject_id', async (req, res) => {
  try {
    const { id: teacherId, class_id: classId, subject_id: subjectId } = req.params;

    const teacher = await Teacher.findOne({ id: parseInt(teacherId) }).lean();
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const classInfo = await Class.findOne({ id: parseInt(classId) }).lean();
    const subject = await Subject.findOne({ id: parseInt(subjectId) }).lean();
    const materials = await Material.find({ subject_id: parseInt(subjectId) }).lean();
    const chapters = await Chapter.find({ subject_id: parseInt(subjectId) }).lean();
    const sessions = await ChapterSession.find({ subject_id: parseInt(subjectId) }).lean();
    const recentSessions = await InteractiveTeachingSession.find({
      teacher_id: parseInt(teacherId),
      class_id: parseInt(classId),
      subject_id: parseInt(subjectId),
    }).lean();

    // Count chunks across all materials for this subject
    let totalChunks = 0;
    for (const ch of chapters) {
      const chunkCount = await MaterialChunk.find({ chapter_id: ch.id }).lean();
      totalChunks += chunkCount.length;
    }

    res.json({
      teacher: { id: teacher.id, name: teacher.full_name },
      class: classInfo ? { id: classInfo.id, name: classInfo.name, grade: classInfo.grade } : null,
      subject: subject ? { id: subject.id, name: subject.name } : null,
      available_materials: materials.length,
      materials: materials.slice(0, 5),
      chapters: chapters.length,
      chapter_list: chapters.map(c => ({ id: c.id, name: c.name })),
      chapter_sessions: sessions.length,
      total_chunks: totalChunks,
      recent_sessions: recentSessions.slice(0, 3),
      quick_actions: [
        { action: 'generate_ppt', label: 'Generate PPT', type: 'ppt' },
        { action: 'generate_quiz', label: 'Create Quiz', type: 'quiz' },
        { action: 'generate_summary', label: 'AI Summary', type: 'summary' },
        { action: 'get_videos', label: 'YouTube Videos', type: 'youtube' },
        { action: 'generate_worksheet', label: 'Worksheet', type: 'worksheet' },
      ],
    });
  } catch (err) {
    console.error('GET /api/rag/teacher/:id/dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// ============================================
// CACHE OPERATIONS
// ============================================

router.get('/cache/stats', async (_req, res) => {
  try {
    const allCache = await GeneratedContentCache.find({}).lean();
    const now = new Date();
    const active = allCache.filter(e => !e.cache_valid_until || new Date(e.cache_valid_until) > now);

    let totalAccesses = 0;
    let estimatedSavings = 0;
    const byType = {};

    for (const row of active) {
      const type = row.content_type || 'unknown';
      const accesses = row.access_count || 0;
      const unitSave = CACHE_COST_SAVED_USD[type] || 0;
      totalAccesses += accesses;
      estimatedSavings += accesses * unitSave;
      if (!byType[type]) byType[type] = { entries: 0, accesses: 0, estimated_savings_usd: 0 };
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
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

router.post('/cache/cleanup', async (_req, res) => {
  try {
    const now = new Date();
    const allCache = await GeneratedContentCache.find({}).lean();
    const expired = allCache.filter(e => e.cache_valid_until && new Date(e.cache_valid_until) <= now);
    let deleted = 0;
    for (const row of expired) {
      await GeneratedContentCache.findOneAndDelete({ id: row.id });
      deleted++;
    }
    res.json({ deleted_expired_entries: deleted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cleanup cache' });
  }
});

router.post('/cache/invalidate', async (req, res) => {
  try {
    const { content_type, class_id, subject_id, chapter_session_id } = req.body || {};
    if (!content_type) return res.status(400).json({ error: 'content_type is required' });

    const query = { content_type };
    if (class_id != null) query.class_id = parseInt(class_id);
    if (subject_id != null) query.subject_id = parseInt(subject_id);
    if (chapter_session_id != null) query.chapter_session_id = parseInt(chapter_session_id);

    const rows = await GeneratedContentCache.find(query).lean();
    let invalidated = 0;
    for (const row of rows) {
      await GeneratedContentCache.findOneAndUpdate({ id: row.id }, { cache_valid_until: new Date(Date.now() - 1000) });
      invalidated++;
    }
    res.json({ invalidated_entries: invalidated, scope: query });
  } catch (err) {
    res.status(500).json({ error: 'Failed to invalidate cache' });
  }
});

// ============================================
// STATUS ENDPOINT
// ============================================

router.get('/status', async (_req, res) => {
  try {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    const chunks = await MaterialChunk.find({}).lean();
    const sessions = await InteractiveTeachingSession.find({}).lean();
    const cache = await GeneratedContentCache.find({}).lean();

    res.json({
      rag_system: 'active',
      llm_configured: hasApiKey,
      llm_model: model,
      total_chunks: chunks.length,
      total_sessions: sessions.length,
      cached_content: cache.length,
      embedding_type: 'trigram-256 (local, no API cost)',
      features: ['ppt', 'quiz', 'summary', 'youtube', 'worksheet'],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;

export default router;