/**
 * QR Quiz Session Routes
 * Endpoints for the QR-based classroom quiz system:
 *  - Session CRUD & lifecycle
 *  - Question management
 *  - Response ingestion (from teacher scanner)
 *  - Evaluation & leaderboard
 *  - SSE real-time board updates
 */

import express from 'express';
import crypto from 'crypto';
import { makeLooseModel } from '../server/supabase-model.js';

const router = express.Router();

const Session     = makeLooseModel('QrQuizSession', 'qr_quiz_sessions');
const Question    = makeLooseModel('QrQuizQuestion', 'qr_quiz_questions');
const Response    = makeLooseModel('QrQuizResponse', 'qr_quiz_responses');
const Leaderboard = makeLooseModel('QrQuizLeaderboard', 'qr_quiz_leaderboard');
const Student     = makeLooseModel('Student', 'students');

// ── SSE connections per session ──────────────────────────────
const sseClients = new Map(); // session_id -> Set<res>

function broadcastToSession(sessionId, event, data) {
  const clients = sseClients.get(String(sessionId));
  if (!clients) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try { client.write(payload); } catch { /* client gone */ }
  }
}

// SSE endpoint — board connects here for real-time updates
router.get('/session/:id/stream', (req, res) => {
  const sid = String(req.params.id);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ session_id: sid })}\n\n`);

  if (!sseClients.has(sid)) sseClients.set(sid, new Set());
  sseClients.get(sid).add(res);

  req.on('close', () => {
    sseClients.get(sid)?.delete(res);
    if (sseClients.get(sid)?.size === 0) sseClients.delete(sid);
  });
});

// ── Helper: generate short session code ──────────────────────
function generateSessionCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
}

// ══════════════════════════════════════════════════════════════
//  SESSION ENDPOINTS
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/qr-quiz/sessions
 * Create a new quiz session with questions
 */
router.post('/sessions', async (req, res) => {
  try {
    const { teacher_id, class_id, subject_id, chapter_id, topic_id, title, questions } = req.body;
    if (!teacher_id || !questions || !questions.length) {
      return res.status(400).json({ error: 'teacher_id and questions[] are required' });
    }

    const session_code = generateSessionCode();
    const session = await Session.create({
      teacher_id,
      class_id: class_id || null,
      subject_id: subject_id || null,
      chapter_id: chapter_id || null,
      topic_id: topic_id || null,
      session_code,
      title: title || `Quiz ${session_code}`,
      status: 'created',
    });

    const sessionId = session.id;

    // Insert questions
    const insertedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const created = await Question.create({
        session_id: sessionId,
        question_number: i + 1,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option?.toUpperCase(),
        time_limit_seconds: q.time_limit_seconds || 30,
        points: q.points || 10,
        explanation: q.explanation || null,
        status: 'pending',
      });
      insertedQuestions.push(created);
    }

    res.status(201).json({
      ...session,
      session_code,
      questions: insertedQuestions,
      question_count: insertedQuestions.length,
    });
  } catch (err) {
    console.error('POST /api/qr-quiz/sessions error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * GET /api/qr-quiz/sessions
 * List sessions for a teacher
 */
router.get('/sessions', async (req, res) => {
  try {
    const filter = {};
    if (req.query.teacher_id) filter.teacher_id = Number(req.query.teacher_id);
    if (req.query.status) filter.status = req.query.status;
    const sessions = await Session.find(filter).lean();
    res.json(sessions || []);
  } catch (err) {
    console.error('GET /api/qr-quiz/sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * GET /api/qr-quiz/sessions/:id
 * Get full session detail with questions, responses, leaderboard
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const sessions = await Session.find({ id: Number(req.params.id) }).lean();
    const session = sessions?.[0];
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const questions = await Question.find({ session_id: session.id }).lean();
    const responses = await Response.find({ session_id: session.id }).lean();
    const leaderboard = await Leaderboard.find({ session_id: session.id }).lean();

    // Enrich leaderboard with student names
    const studentIds = [...new Set((leaderboard || []).map(l => l.student_id))];
    const allStudents = await Student.find({}).lean();
    const studentMap = {};
    (allStudents || []).forEach(s => { studentMap[s.id] = s; });

    const enrichedLeaderboard = (leaderboard || [])
      .sort((a, b) => (a.rank_position || 999) - (b.rank_position || 999))
      .map(l => ({
        ...l,
        student_name: studentMap[l.student_id]?.full_name || studentMap[l.student_id]?.name || `Student ${l.student_id}`,
        roll_no: studentMap[l.student_id]?.roll_no,
      }));

    res.json({
      ...session,
      questions: (questions || []).sort((a, b) => a.question_number - b.question_number),
      responses: responses || [],
      leaderboard: enrichedLeaderboard,
      total_responses: (responses || []).length,
      unique_students: new Set((responses || []).map(r => r.student_id)).size,
    });
  } catch (err) {
    console.error('GET /api/qr-quiz/sessions/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/**
 * GET /api/qr-quiz/sessions/code/:code
 * Find session by short code (used by board to connect)
 */
router.get('/sessions/code/:code', async (req, res) => {
  try {
    const sessions = await Session.find({ session_code: req.params.code.toUpperCase() }).lean();
    const session = sessions?.[0];
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    const questions = await Question.find({ session_id: session.id }).lean();
    res.json({
      ...session,
      questions: (questions || []).sort((a, b) => a.question_number - b.question_number),
    });
  } catch (err) {
    console.error('GET /api/qr-quiz/sessions/code/:code error:', err);
    res.status(500).json({ error: 'Failed to fetch session by code' });
  }
});

// ══════════════════════════════════════════════════════════════
//  SESSION LIFECYCLE
// ══════════════════════════════════════════════════════════════

/**
 * PUT /api/qr-quiz/sessions/:id/start
 * Start the quiz session
 */
router.put('/sessions/:id/start', async (req, res) => {
  try {
    const updated = await Session.findOneAndUpdate(
      { id: Number(req.params.id) },
      { status: 'active', started_at: new Date().toISOString() }
    );
    broadcastToSession(req.params.id, 'session_started', { status: 'active' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to start session' });
  }
});

/**
 * PUT /api/qr-quiz/sessions/:id/complete
 * End the entire session
 */
router.put('/sessions/:id/complete', async (req, res) => {
  try {
    const updated = await Session.findOneAndUpdate(
      { id: Number(req.params.id) },
      { status: 'completed', ended_at: new Date().toISOString() }
    );
    broadcastToSession(req.params.id, 'session_completed', { status: 'completed' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// ══════════════════════════════════════════════════════════════
//  QUESTION LIFECYCLE
// ══════════════════════════════════════════════════════════════

/**
 * PUT /api/qr-quiz/questions/:id/display
 * Display question on board — enters "collecting" mode
 */
router.put('/questions/:id/display', async (req, res) => {
  try {
    const question = await Question.findOneAndUpdate(
      { id: Number(req.params.id) },
      { status: 'collecting', displayed_at: new Date().toISOString() }
    );
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // Also update session status
    await Session.findOneAndUpdate(
      { id: question.session_id },
      { status: 'collecting' }
    );

    const questions = await Question.find({ id: Number(req.params.id) }).lean();
    const q = questions?.[0] || question;

    broadcastToSession(question.session_id, 'question_displayed', {
      question_id: q.id,
      question_number: q.question_number,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      time_limit_seconds: q.time_limit_seconds,
      points: q.points,
      status: 'collecting',
    });

    res.json({ ...q, status: 'collecting' });
  } catch (err) {
    console.error('PUT /questions/:id/display error:', err);
    res.status(500).json({ error: 'Failed to display question' });
  }
});

/**
 * PUT /api/qr-quiz/questions/:id/reveal
 * Reveal correct answer and compute results
 */
router.put('/questions/:id/reveal', async (req, res) => {
  try {
    const questions = await Question.find({ id: Number(req.params.id) }).lean();
    const question = questions?.[0];
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // Evaluate all responses for this question
    const responses = await Response.find({ question_id: question.id }).lean();
    let correctCount = 0;
    const distribution = { A: 0, B: 0, C: 0, D: 0 };

    for (const resp of (responses || [])) {
      const isCorrect = resp.selected_option === question.correct_option;
      const points = isCorrect ? (question.points || 10) : 0;
      distribution[resp.selected_option] = (distribution[resp.selected_option] || 0) + 1;
      if (isCorrect) correctCount++;

      // Update response with evaluation
      await Response.findOneAndUpdate(
        { id: resp.id },
        { is_correct: isCorrect, points_awarded: points }
      );

      // Update leaderboard
      const existing = await Leaderboard.find({ session_id: question.session_id, student_id: resp.student_id }).lean();
      if (existing?.[0]) {
        await Leaderboard.findOneAndUpdate(
          { id: existing[0].id },
          {
            total_correct: (existing[0].total_correct || 0) + (isCorrect ? 1 : 0),
            total_points: (existing[0].total_points || 0) + points,
            total_answered: (existing[0].total_answered || 0) + 1,
            updated_at: new Date().toISOString(),
          }
        );
      } else {
        await Leaderboard.create({
          session_id: question.session_id,
          student_id: resp.student_id,
          total_correct: isCorrect ? 1 : 0,
          total_points: points,
          total_answered: 1,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Compute ranks
    const lb = await Leaderboard.find({ session_id: question.session_id }).lean();
    const sorted = (lb || []).sort((a, b) => (b.total_points - a.total_points) || (b.total_correct - a.total_correct));
    for (let i = 0; i < sorted.length; i++) {
      await Leaderboard.findOneAndUpdate(
        { id: sorted[i].id },
        { rank_position: i + 1 }
      );
    }

    // Mark question as revealed
    await Question.findOneAndUpdate(
      { id: question.id },
      { status: 'revealed', revealed_at: new Date().toISOString() }
    );
    await Session.findOneAndUpdate(
      { id: question.session_id },
      { status: 'revealed' }
    );

    // Enrich leaderboard with names for broadcast
    const allStudents = await Student.find({}).lean();
    const studentMap = {};
    (allStudents || []).forEach(s => { studentMap[s.id] = s; });

    const top5 = sorted.slice(0, 5).map((l, i) => ({
      rank: i + 1,
      student_id: l.student_id,
      student_name: studentMap[l.student_id]?.full_name || `Student ${l.student_id}`,
      total_points: (l.total_points || 0) + (responses?.find(r => r.student_id === l.student_id && r.selected_option === question.correct_option) ? (question.points || 10) : 0),
      total_correct: l.total_correct + (responses?.find(r => r.student_id === l.student_id && r.selected_option === question.correct_option) ? 1 : 0),
    }));

    const revealData = {
      question_id: question.id,
      correct_option: question.correct_option,
      explanation: question.explanation,
      distribution,
      total_responses: (responses || []).length,
      correct_count: correctCount,
      accuracy: (responses || []).length > 0 ? Math.round((correctCount / (responses || []).length) * 100) : 0,
      leaderboard_top5: sorted.slice(0, 5).map((l, i) => ({
        rank: i + 1,
        student_id: l.student_id,
        student_name: studentMap[l.student_id]?.full_name || `Student ${l.student_id}`,
        total_points: l.total_points,
        total_correct: l.total_correct,
      })),
    };

    broadcastToSession(question.session_id, 'answer_revealed', revealData);
    res.json(revealData);
  } catch (err) {
    console.error('PUT /questions/:id/reveal error:', err);
    res.status(500).json({ error: 'Failed to reveal answer' });
  }
});

// ══════════════════════════════════════════════════════════════
//  RESPONSE INGESTION (from teacher scanner)
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/qr-quiz/responses/batch
 * Submit a batch of scanned responses (from teacher mobile scanner)
 */
router.post('/responses/batch', async (req, res) => {
  try {
    const { session_id, question_id, responses: scannedResponses } = req.body;
    if (!session_id || !question_id || !scannedResponses?.length) {
      return res.status(400).json({ error: 'session_id, question_id, and responses[] are required' });
    }

    const results = { inserted: 0, duplicates: 0, errors: 0 };

    for (const scan of scannedResponses) {
      try {
        // Check for duplicate
        const existing = await Response.find({
          question_id: Number(question_id),
          student_id: Number(scan.student_id),
        }).lean();

        if (existing?.length > 0) {
          results.duplicates++;
          continue;
        }

        await Response.create({
          session_id: Number(session_id),
          question_id: Number(question_id),
          student_id: Number(scan.student_id),
          selected_option: scan.selected_option?.toUpperCase(),
          scanned_at: scan.scanned_at || new Date().toISOString(),
        });
        results.inserted++;
      } catch (e) {
        results.errors++;
      }
    }

    // Broadcast scan count update to board
    const totalResponses = await Response.find({ question_id: Number(question_id) }).lean();
    broadcastToSession(session_id, 'scan_count_updated', {
      question_id: Number(question_id),
      total_scanned: (totalResponses || []).length,
    });

    res.json({ ...results, total_for_question: (totalResponses || []).length });
  } catch (err) {
    console.error('POST /responses/batch error:', err);
    res.status(500).json({ error: 'Failed to submit responses' });
  }
});

/**
 * POST /api/qr-quiz/responses/single
 * Submit a single scanned response (real-time as teacher scans)
 */
router.post('/responses/single', async (req, res) => {
  try {
    const { session_id, question_id, student_id, selected_option } = req.body;
    if (!session_id || !question_id || !student_id || !selected_option) {
      return res.status(400).json({ error: 'session_id, question_id, student_id, selected_option required' });
    }

    // Check duplicate
    const existing = await Response.find({
      question_id: Number(question_id),
      student_id: Number(student_id),
    }).lean();

    if (existing?.length > 0) {
      return res.status(409).json({ error: 'duplicate', message: 'Student already scanned for this question' });
    }

    await Response.create({
      session_id: Number(session_id),
      question_id: Number(question_id),
      student_id: Number(student_id),
      selected_option: selected_option.toUpperCase(),
      scanned_at: new Date().toISOString(),
    });

    // Get updated count
    const totalResponses = await Response.find({ question_id: Number(question_id) }).lean();
    const count = (totalResponses || []).length;

    broadcastToSession(session_id, 'scan_count_updated', {
      question_id: Number(question_id),
      total_scanned: count,
      last_student_id: student_id,
    });

    res.json({ success: true, total_scanned: count });
  } catch (err) {
    console.error('POST /responses/single error:', err);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// ══════════════════════════════════════════════════════════════
//  LEADERBOARD & ANALYTICS
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/qr-quiz/sessions/:id/leaderboard
 * Get full ranked leaderboard for a session
 */
router.get('/sessions/:id/leaderboard', async (req, res) => {
  try {
    const lb = await Leaderboard.find({ session_id: Number(req.params.id) }).lean();
    const allStudents = await Student.find({}).lean();
    const studentMap = {};
    (allStudents || []).forEach(s => { studentMap[s.id] = s; });

    const ranked = (lb || [])
      .sort((a, b) => (a.rank_position || 999) - (b.rank_position || 999))
      .map(l => ({
        ...l,
        student_name: studentMap[l.student_id]?.full_name || `Student ${l.student_id}`,
        roll_no: studentMap[l.student_id]?.roll_no,
      }));

    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/qr-quiz/sessions/:id/analytics
 * Get detailed analytics for a session
 */
router.get('/sessions/:id/analytics', async (req, res) => {
  try {
    const sessionId = Number(req.params.id);
    const questions = await Question.find({ session_id: sessionId }).lean();
    const responses = await Response.find({ session_id: sessionId }).lean();
    const lb = await Leaderboard.find({ session_id: sessionId }).lean();

    const questionAnalytics = (questions || []).map(q => {
      const qResponses = (responses || []).filter(r => r.question_id === q.id);
      const correct = qResponses.filter(r => r.is_correct).length;
      const dist = { A: 0, B: 0, C: 0, D: 0 };
      qResponses.forEach(r => { dist[r.selected_option] = (dist[r.selected_option] || 0) + 1; });

      return {
        question_number: q.question_number,
        question_text: q.question_text,
        correct_option: q.correct_option,
        total_responses: qResponses.length,
        correct_count: correct,
        accuracy: qResponses.length > 0 ? Math.round((correct / qResponses.length) * 100) : 0,
        distribution: dist,
      };
    });

    const totalQuestions = (questions || []).length;
    const totalResponses = (responses || []).length;
    const totalCorrect = (responses || []).filter(r => r.is_correct).length;
    const uniqueStudents = new Set((responses || []).map(r => r.student_id)).size;

    res.json({
      session_id: sessionId,
      total_questions: totalQuestions,
      total_responses: totalResponses,
      unique_students: uniqueStudents,
      overall_accuracy: totalResponses > 0 ? Math.round((totalCorrect / totalResponses) * 100) : 0,
      question_analytics: questionAnalytics,
      leaderboard: (lb || []).sort((a, b) => (a.rank_position || 999) - (b.rank_position || 999)),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
