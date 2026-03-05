/**
 * Content Generation Service
 * Generates PPTs, quizzes, and content using LLM with RAG context
 */

/**
 * Generate PPT structure using LLM
 */
export async function generatePPTStructure(
  classId,
  subjectId,
  chapterId,
  contextChunks,
  title = 'Generated Presentation'
) {
  try {
    const prompt = buildPPTPrompt(classId, subjectId, chapterId, contextChunks, title);

    // In production, call OpenAI or similar
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-4',
    //     messages: [{ role: 'user', content: prompt }],
    //     temperature: 0.7,
    //     max_tokens: 2000,
    //   }),
    // });
    // const data = await response.json();

    // Mock response for demo
    const pptStructure = {
      title,
      slides: [
        {
          slide_number: 1,
          type: 'title',
          title,
          subtitle: `Class ${classId} - Subject ${subjectId}`,
        },
        {
          slide_number: 2,
          type: 'bullet_points',
          title: 'Key Concepts',
          content: [
            'Concept 1: Introduction',
            'Concept 2: Main Theory',
            'Concept 3: Applications',
          ],
        },
        {
          slide_number: 3,
          type: 'bullet_points',
          title: 'Deep Dive',
          content: ['Detailed explanation of concepts', 'Real-world examples', 'Practice problems'],
        },
        {
          slide_number: 4,
          type: 'image',
          title: 'Visual Representation',
          image_description: 'Diagram explaining the main concept',
        },
        {
          slide_number: 5,
          type: 'bullet_points',
          title: 'Activities & Exercises',
          content: ['Group activity 1', 'Individual task', 'Discussion questions'],
        },
      ],
    };

    return pptStructure;
  } catch (err) {
    console.error('Error generating PPT structure:', err);
    throw err;
  }
}

/**
 * Generate quiz questions using LLM
 */
export async function generateQuizQuestions(
  classId,
  subjectId,
  chapterId,
  contextChunks,
  numQuestions = 10,
  difficulty = 'intermediate'
) {
  try {
    const prompt = buildQuizPrompt(classId, subjectId, chapterId, contextChunks, numQuestions, difficulty);

    // In production, call LLM
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-4',
    //     messages: [{ role: 'user', content: prompt }],
    //     temperature: 0.7,
    //     max_tokens: 3000,
    //   }),
    // });
    // const data = await response.json();

    // Mock response for demo
    const questions = [
      {
        question_number: 1,
        question_text: 'What is the main concept covered in this chapter?',
        question_type: 'multiple_choice',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 'Option A',
        difficulty,
        marks: 1,
      },
      {
        question_number: 2,
        question_text: 'Explain the application of this concept in real life.',
        question_type: 'short_answer',
        difficulty,
        marks: 2,
      },
      {
        question_number: 3,
        question_text: 'Which of the following is NOT a characteristic?',
        question_type: 'multiple_choice',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'D',
        difficulty,
        marks: 1,
      },
    ];

    return {
      quiz_title: `Quiz - Class ${classId} ${subjectId}`,
      total_questions: questions.length,
      duration_minutes: 30,
      difficulty,
      questions,
    };
  } catch (err) {
    console.error('Error generating quiz questions:', err);
    throw err;
  }
}

/**
 * Generate study summary using LLM
 */
export async function generateStudySummary(
  classId,
  subjectId,
  chapterId,
  contextChunks
) {
  try {
    const prompt = buildSummaryPrompt(classId, subjectId, chapterId, contextChunks);

    // In production, call LLM
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {...});

    // Mock response
    const summary = {
      title: `Summary - Class ${classId}`,
      key_concepts: [
        { concept: 'Concept 1', explanation: 'Short explanation' },
        { concept: 'Concept 2', explanation: 'Short explanation' },
        { concept: 'Concept 3', explanation: 'Short explanation' },
      ],
      key_formulas: [
        { formula: 'Formula 1', description: 'What it represents' },
      ],
      important_notes: [
        'Note 1: Important detail',
        'Note 2: Common mistake to avoid',
        'Note 3: Real-world application',
      ],
      must_know: [
        'Crucial definition 1',
        'Crucial definition 2',
      ],
    };

    return summary;
  } catch (err) {
    console.error('Error generating summary:', err);
    throw err;
  }
}

/**
 * Get YouTube recommendations using LLM
 */
export async function getYouTubeRecommendations(
  classId,
  subjectId,
  chapterId,
  contextChunks
) {
  try {
    const prompt = buildYouTubePrompt(classId, subjectId, chapterId, contextChunks);

    // In production:
    // 1. Use LLM to generate search queries
    // 2. Call YouTube API with those queries
    // 3. Filter and rank results

    // Mock recommendations
    const recommendations = [
      {
        title: 'Understanding Core Concepts',
        url: 'https://youtube.com/watch?v=example1',
        channel: 'Educational Channel',
        duration: '12:34',
        views: '1.2M',
        relevance_score: 0.95,
      },
      {
        title: 'Real-World Applications',
        url: 'https://youtube.com/watch?v=example2',
        channel: 'Science Simplified',
        duration: '15:22',
        views: '850K',
        relevance_score: 0.88,
      },
      {
        title: 'Practice Problems & Solutions',
        url: 'https://youtube.com/watch?v=example3',
        channel: 'Math Problems',
        duration: '25:45',
        views: '2.1M',
        relevance_score: 0.82,
      },
    ];

    return {
      class_id: classId,
      subject_id: subjectId,
      recommendations,
    };
  } catch (err) {
    console.error('Error getting YouTube recommendations:', err);
    throw err;
  }
}

/**
 * Generate worksheet using LLM
 */
export async function generateWorksheet(
  classId,
  subjectId,
  chapterId,
  contextChunks,
  numQuestions = 15
) {
  try {
    const questions = generateWorksheetQuestions(contextChunks, numQuestions);

    const worksheet = {
      title: `Worksheet - Class ${classId}`,
      instructions: 'Answer all questions. Show your work where required.',
      total_questions: numQuestions,
      questions,
      difficulty: 'mixed',
    };

    return worksheet;
  } catch (err) {
    console.error('Error generating worksheet:', err);
    throw err;
  }
}

// ============================================
// HELPER FUNCTIONS - PROMPT BUILDERS
// ============================================

function buildPPTPrompt(classId, subjectId, chapterId, contextChunks, title) {
  return `
Create a comprehensive PowerPoint presentation for Class ${classId}, Subject ${subjectId}.

Title: ${title}

Based on the following educational content, create a structured PPT outline with:
- Opening/Title slide
- 2-3 slides on key concepts
- 1 slide on real-world applications
- 1 slide on common misconceptions
- Exercises/Activities slide
- Summary slide

Content Context:
${contextChunks.map((chunk, i) => `${i + 1}. ${chunk.chunk_text}`).join('\n')}

Return a JSON structure with slide number, type, title, and content for each slide.
  `;
}

function buildQuizPrompt(classId, subjectId, chapterId, contextChunks, numQuestions, difficulty) {
  return `
Generate ${numQuestions} quiz questions for Class ${classId}, Subject ${subjectId}.

Difficulty Level: ${difficulty}

Mix of:
- ${Math.ceil(numQuestions * 0.4)} Multiple choice questions
- ${Math.ceil(numQuestions * 0.4)} Short answer questions
- ${Math.floor(numQuestions * 0.2)} True/False questions

Based on:
${contextChunks.map((chunk, i) => `${i + 1}. ${chunk.chunk_text}`).join('\n')}

Return JSON with: question_number, question_text, question_type, options (if MC), correct_answer, marks.
  `;
}

function buildSummaryPrompt(classId, subjectId, chapterId, contextChunks) {
  return `
Create a concise study summary for Class ${classId}, Subject ${subjectId}.

Based on:
${contextChunks.map((c) => c.chunk_text).join('\n')}

Include:
1. Key concepts with brief explanations
2. Important formulas (if applicable)
3. Common misconceptions to avoid
4. Real-world applications
5. Must-know definitions

Format as JSON with structured sections.
  `;
}

function buildYouTubePrompt(classId, subjectId, chapterId, contextChunks) {
  return `
Suggest the best YouTube videos and online resources for Class ${classId}, Subject ${subjectId}.

Context: ${contextChunks.map((c) => c.chunk_text).join(' ')}

Suggest videos that:
1. Explain core concepts clearly
2. Show real-world applications
3. Include practice problems
4. Have high-quality production

Return a list of recommended videos with descriptions.
  `;
}

function generateWorksheetQuestions(contextChunks, numQuestions) {
  const questions = [];
  for (let i = 1; i <= numQuestions; i++) {
    questions.push({
      question_number: i,
      question_text: `Question ${i}: Based on the lesson content, answer this question.`,
      question_type: i % 3 === 0 ? 'long_answer' : 'short_answer',
      marks: i % 3 === 0 ? 5 : 2,
    });
  }
  return questions;
}

// ============================================
// EMBEDDING SERVICE FUNCTIONS
// ============================================

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(text, model = 'text-embedding-3-small') {
  try {
    // In production:
    // const response = await fetch('https://api.openai.com/v1/embeddings', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model,
    //     input: text,
    //   }),
    // });
    // const data = await response.json();
    // return data.data[0].embedding;

    // Mock embedding for demo
    return Array(1536)
      .fill(0)
      .map(() => Math.random() * 2 - 1);
  } catch (err) {
    console.error('Error generating embedding:', err);
    throw err;
  }
}

/**
 * Batch generate embeddings for multiple texts
 */
export async function batchGenerateEmbeddings(texts, model = 'text-embedding-3-small') {
  try {
    const embeddings = [];
    for (const text of texts) {
      const embedding = await generateEmbedding(text, model);
      embeddings.push(embedding);
    }
    return embeddings;
  } catch (err) {
    console.error('Error batch generating embeddings:', err);
    throw err;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  return dotProduct / (normA * normB);
}

/**
 * Find most similar chunks (for RAG)
 */
export function findSimilarChunks(queryEmbedding, chunks, topK = 5) {
  const similarities = chunks.map((chunk) => ({
    ...chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}
