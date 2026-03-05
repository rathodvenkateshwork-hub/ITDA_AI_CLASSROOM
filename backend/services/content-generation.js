/**
 * Content Generation Service
 * Generates PPTs, quizzes, summaries and recommendations using Claude (Anthropic) with RAG context
 * 
 * STRICT SUBJECT GUARDRAILS:
 * - Every prompt is scoped to the specific subject, chapter, and grade
 * - System prompt enforces curriculum-only responses
 * - Any off-topic content is rejected at the prompt level
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Build the system prompt that enforces strict subject boundaries
 */
function buildSystemPrompt(subjectName, chapterName, grade) {
  return `You are an educational content generator for ITDA (Integrated Tribal Development Agency) classrooms in Telangana, India.

STRICT RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
1. You MUST ONLY generate content related to the subject: "${subjectName}"
2. You MUST ONLY cover the chapter/topic: "${chapterName}"
3. You MUST NOT discuss, reference, or generate content about ANY other subject, chapter, or topic — even if the user asks.
4. Your content must be appropriate for Grade ${grade} students studying under TGSCERT (Telangana State Council of Educational Research and Training) curriculum.
5. Keep language simple, clear, and educational.
6. If the provided context chunks are empty or insufficient, generate content based on standard TGSCERT curriculum knowledge for the given subject and chapter.
7. All examples must relate to the subject and chapter only.
8. Do NOT include any disclaimers about being an AI. Just produce the educational content.
9. Respond ONLY with valid JSON as specified in the user prompt. No markdown code fences, no extra text outside JSON.`;
}

/**
 * Call Claude API
 */
async function callClaude(systemPrompt, userPrompt, maxTokens = 4000) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => response.statusText);
    throw new Error(`Claude API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude API');
  return text;
}

/**
 * Parse JSON from Claude response (handles markdown code fences)
 */
function parseClaudeJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

/**
 * Build context string from chunks
 */
function buildContext(contextChunks) {
  if (!contextChunks || contextChunks.length === 0) return 'No specific material context provided. Use standard curriculum knowledge.';
  return contextChunks.map((chunk, i) => `[${i + 1}] ${chunk.chunk_text || chunk.text || ''}`).join('\n\n');
}

// ============================================
// CONTENT GENERATION FUNCTIONS
// ============================================

/**
 * Generate PPT structure using Claude
 */
export async function generatePPTStructure(subjectName, chapterName, grade, contextChunks, title = 'Generated Presentation') {
  const systemPrompt = buildSystemPrompt(subjectName, chapterName, grade);
  const context = buildContext(contextChunks);

  const userPrompt = `Create a detailed PowerPoint presentation structure for teaching "${chapterName}" in ${subjectName} to Grade ${grade} students.

Title: ${title}

MATERIAL CONTEXT:
${context}

Generate a JSON object with this exact structure:
{
  "title": "presentation title",
  "slides": [
    {
      "slide_number": 1,
      "type": "title",
      "title": "...",
      "subtitle": "..."
    },
    {
      "slide_number": 2,
      "type": "bullet_points",
      "title": "Key Concepts",
      "content": ["point 1", "point 2", "point 3"]
    }
  ]
}

Requirements:
- Create 8-12 slides total
- Start with a title slide
- Include 2-3 "Key Concepts" slides with bullet points from the chapter
- Include 1 "Definitions" slide with important terms
- Include 1-2 "Examples" slides with worked examples from the chapter
- Include 1 "Activity" slide with a classroom activity
- Include 1 "Common Mistakes" slide
- End with a "Summary" slide
- ALL content must be strictly about ${subjectName} — ${chapterName} only
- Use language suitable for Grade ${grade} students`;

  const raw = await callClaude(systemPrompt, userPrompt, 4000);
  return parseClaudeJSON(raw);
}

/**
 * Generate quiz questions using Claude
 */
export async function generateQuizQuestions(subjectName, chapterName, grade, contextChunks, numQuestions = 10, difficulty = 'intermediate') {
  const systemPrompt = buildSystemPrompt(subjectName, chapterName, grade);
  const context = buildContext(contextChunks);

  const mcqCount = Math.ceil(numQuestions * 0.5);
  const shortCount = Math.ceil(numQuestions * 0.3);
  const tfCount = numQuestions - mcqCount - shortCount;

  const userPrompt = `Generate exactly ${numQuestions} quiz questions for "${chapterName}" in ${subjectName} for Grade ${grade} students.

Difficulty Level: ${difficulty}

MATERIAL CONTEXT:
${context}

Question mix:
- ${mcqCount} Multiple Choice Questions (4 options each)
- ${shortCount} Short Answer Questions
- ${tfCount} True/False Questions

Return a JSON object with this exact structure:
{
  "quiz_title": "Quiz: ${chapterName}",
  "total_questions": ${numQuestions},
  "duration_minutes": ${numQuestions * 2},
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question_number": 1,
      "question_text": "...",
      "question_type": "multiple_choice",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A) ...",
      "explanation": "brief explanation",
      "difficulty": "${difficulty}",
      "marks": 1
    }
  ]
}

CRITICAL: Every question MUST be about ${subjectName} — ${chapterName}. No general knowledge or off-topic questions.`;

  const raw = await callClaude(systemPrompt, userPrompt, 5000);
  return parseClaudeJSON(raw);
}

/**
 * Generate study summary using Claude
 */
export async function generateStudySummary(subjectName, chapterName, grade, contextChunks) {
  const systemPrompt = buildSystemPrompt(subjectName, chapterName, grade);
  const context = buildContext(contextChunks);

  const userPrompt = `Create a concise study summary for "${chapterName}" in ${subjectName} for Grade ${grade} students.

MATERIAL CONTEXT:
${context}

Return a JSON object with this exact structure:
{
  "title": "Summary: ${chapterName}",
  "key_concepts": [
    { "concept": "concept name", "explanation": "clear explanation in 1-2 sentences" }
  ],
  "key_formulas": [
    { "formula": "formula text", "description": "what it represents" }
  ],
  "important_definitions": [
    { "term": "term", "definition": "definition" }
  ],
  "important_notes": ["note 1", "note 2"],
  "common_mistakes": ["mistake 1 to avoid", "mistake 2 to avoid"],
  "must_know": ["crucial point 1", "crucial point 2"],
  "real_world_applications": ["application 1", "application 2"]
}

Include at least 4 key concepts, 2+ definitions, and 3+ important notes.
If the subject doesn't have formulas, return an empty array for key_formulas.
ALL content must be strictly about ${subjectName} — ${chapterName}.`;

  const raw = await callClaude(systemPrompt, userPrompt, 3000);
  return parseClaudeJSON(raw);
}

/**
 * Get YouTube search recommendations using Claude
 */
export async function getYouTubeRecommendations(subjectName, chapterName, grade, contextChunks) {
  const systemPrompt = buildSystemPrompt(subjectName, chapterName, grade);
  const context = buildContext(contextChunks);

  const userPrompt = `Suggest YouTube search queries and expected video descriptions for "${chapterName}" in ${subjectName} for Grade ${grade} students.

MATERIAL CONTEXT:
${context}

Return a JSON object with this exact structure:
{
  "search_queries": [
    "exact youtube search query 1",
    "exact youtube search query 2"
  ],
  "recommendations": [
    {
      "title": "descriptive video title a student should search for",
      "search_query": "youtube search query",
      "description": "what the student will learn from this type of video",
      "relevance": "why this is useful for the chapter",
      "language": "English"
    }
  ]
}

Requirements:
- Suggest 4-6 specific YouTube search queries
- Include queries in both English and Telugu if applicable
- All queries MUST be about ${subjectName} — ${chapterName} for Grade ${grade}
- Prefer educational channels (NCERT, TGSCERT, Khan Academy, Byju's)
- Do NOT fabricate video URLs — only suggest search queries and descriptions`;

  const raw = await callClaude(systemPrompt, userPrompt, 2000);
  return parseClaudeJSON(raw);
}

/**
 * Generate worksheet using Claude
 */
export async function generateWorksheet(subjectName, chapterName, grade, contextChunks, numQuestions = 15) {
  const systemPrompt = buildSystemPrompt(subjectName, chapterName, grade);
  const context = buildContext(contextChunks);

  const userPrompt = `Create a classroom worksheet with ${numQuestions} questions for "${chapterName}" in ${subjectName} for Grade ${grade} students.

MATERIAL CONTEXT:
${context}

Return a JSON object with this exact structure:
{
  "title": "Worksheet: ${chapterName}",
  "instructions": "clear instructions for students",
  "total_questions": ${numQuestions},
  "total_marks": 0,
  "difficulty": "mixed",
  "questions": [
    {
      "question_number": 1,
      "question_text": "...",
      "question_type": "fill_in_the_blank",
      "marks": 1
    }
  ]
}

Question types mix: fill_in_the_blank, short_answer, long_answer, match_the_following, diagram.
Set total_marks to the sum of all marks.
ALL questions MUST be about ${subjectName} — ${chapterName} only.`;

  const raw = await callClaude(systemPrompt, userPrompt, 5000);
  return parseClaudeJSON(raw);
}

// ============================================
// EMBEDDING FUNCTIONS (keyword-based, no external API needed)
// ============================================

/**
 * Generate a simple keyword-based embedding vector.
 * Uses character trigram hashing — lightweight, no external API needed.
 * Effective for educational content similarity matching.
 */
export function generateEmbedding(text) {
  const dim = 256;
  const vec = new Float64Array(dim);
  const cleaned = (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = cleaned.split(/\s+/).filter(Boolean);

  for (const word of words) {
    for (let i = 0; i <= word.length - 3; i++) {
      const trigram = word.slice(i, i + 3);
      const hash = trigramHash(trigram, dim);
      vec[hash] += 1;
    }
  }

  // Normalize to unit vector
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) vec[i] /= norm;
  }

  return Array.from(vec);
}

function trigramHash(trigram, dim) {
  let h = 0;
  for (let i = 0; i < trigram.length; i++) {
    h = ((h << 5) - h + trigram.charCodeAt(i)) | 0;
  }
  return ((h % dim) + dim) % dim;
}

/**
 * Batch generate embeddings
 */
export function batchGenerateEmbeddings(texts) {
  return texts.map(t => generateEmbedding(t));
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA, vecB) {
  const len = Math.min(vecA.length, vecB.length);
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}

/**
 * Find most similar chunks using cosine similarity
 */
export function findSimilarChunks(queryEmbedding, chunks, topK = 5) {
  const scored = chunks
    .filter(c => c.embedding && Array.isArray(c.embedding) && c.embedding.length > 0)
    .map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));
  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}