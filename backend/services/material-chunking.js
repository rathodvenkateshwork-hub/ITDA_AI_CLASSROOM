/**
 * Material Chunking Service
 * Extracts and chunks material content for embedding and RAG
 */

/**
 * Split text into chunks of approximate token count
 * @param {string} text - The text to split
 * @param {number} chunkSize - Target chunk size in tokens (default 1000)
 * @param {number} overlap - Overlap between chunks in tokens (default 200)
 * @returns {Array} Array of chunk objects
 */
export function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  if (!text) return [];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';
  let tokenCount = 0;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    // If adding this sentence would exceed chunk size
    if (tokenCount + sentenceTokens > chunkSize && currentChunk) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        token_count: tokenCount,
      });

      // Create overlap by keeping last part
      const overlapTokens = Math.floor(sentenceTokens * (overlap / chunkSize));
      currentChunk = sentence;
      tokenCount = sentenceTokens;
    } else {
      // Add to current chunk
      currentChunk += sentence;
      tokenCount += sentenceTokens;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      token_count: tokenCount,
    });
  }

  return chunks;
}

/**
 * Estimate number of tokens in text (simplified)
 * Actual OpenAI token counting would use their library
 * @param {string} text
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Extract text from PDF (mock implementation)
 * In production, use pdfjs-dist or similar
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDF(pdfBuffer) {
  try {
    // In production:
    // const pdfDoc = await PDFDocument.load(pdfBuffer);
    // const text = pdfDoc.pages.map(page => page.getText()).join('\n');

    // Mock for demo - in real implementation would use pdf parser
    return 'Sample extracted PDF content';
  } catch (err) {
    console.error('Error extracting PDF:', err);
    throw err;
  }
}

/**
 * Extract text from DOCX (mock implementation)
 * @param {Buffer} docBuffer - DOCX file buffer
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromDOCX(docBuffer) {
  try {
    // In production: use mammoth or python-docx via subprocess
    return 'Sample extracted DOCX content';
  } catch (err) {
    console.error('Error extracting DOCX:', err);
    throw err;
  }
}

/**
 * Clean text for processing
 * @param {string} text
 * @returns {string} Cleaned text
 */
export function cleanText(text) {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.!?,-]/g, '') // Remove special chars
    .trim();
}

/**
 * Process material content into chunks
 * Main function that orchestrates the chunking process
 * @param {Object} material - Material object
 * @param {string} materialContent - File content or URL
 * @param {number} chunkSize - Chunk size in tokens
 * @param {number} overlap - Overlap in tokens
 * @returns {Promise<Array>} Array of chunks ready for embedding
 */
export async function processMaterialContent(
  material,
  materialContent,
  chunkSize = 1000,
  overlap = 200
) {
  try {
    let text = '';

    // Extract text based on content type
    if (material.file_type === 'pdf') {
      text = await extractTextFromPDF(materialContent);
    } else if (material.file_type === 'docx') {
      text = await extractTextFromDOCX(materialContent);
    } else if (material.file_type === 'txt') {
      text = materialContent.toString();
    } else if (typeof materialContent === 'string') {
      text = materialContent;
    }

    // Clean text
    const cleanedText = cleanText(text);

    // Split into chunks
    const chunks = splitTextIntoChunks(cleanedText, chunkSize, overlap);

    // Add metadata to each chunk
    return chunks.map((chunk, index) => ({
      ...chunk,
      chunk_number: index + 1,
      total_chunks: chunks.length,
      source_material_id: material.id,
      source_chapter_id: material.chapter_id,
      source_topic_id: material.topic_id,
    }));
  } catch (err) {
    console.error('Error processing material content:', err);
    throw err;
  }
}

/**
 * Create chunks for a chapter
 * Divides chapter into learning units
 * @param {Object} chapter
 * @param {string} textContent
 * @returns {Promise<Array>} Array of learning unit chunks
 */
export async function createChapterLearningUnits(chapter, textContent) {
  try {
    // Split chapter into sections (using headings as boundaries)
    const sections = splitByHeadings(textContent);

    // Create learning unit for each section
    return sections.map((section, index) => ({
      chapter_id: chapter.id,
      unit_number: index + 1,
      total_units: sections.length,
      title: section.title || `Unit ${index + 1}`,
      content: section.content,
      token_count: estimateTokens(section.content),
      learning_objectives: generateLearningObjectives(section.content),
      estimated_duration: estimateDuration(estimateTokens(section.content)),
    }));
  } catch (err) {
    console.error('Error creating learning units:', err);
    throw err;
  }
}

/**
 * Split text by headings
 * @param {string} text
 * @returns {Array} Array of sections with title and content
 */
function splitByHeadings(text) {
  const headingPattern = /^#+\s+(.+)$/gm;
  const sections = [];
  let match;
  let lastIndex = 0;
  let lastTitle = 'Introduction';

  while ((match = headingPattern.exec(text)) !== null) {
    const content = text.substring(lastIndex, match.index).trim();
    if (content) {
      sections.push({
        title: lastTitle,
        content,
      });
    }
    lastTitle = match[1];
    lastIndex = match.index + match[0].length;
  }

  // Add final section
  const finalContent = text.substring(lastIndex).trim();
  if (finalContent) {
    sections.push({
      title: lastTitle,
      content: finalContent,
    });
  }

  return sections;
}

/**
 * Generate learning objectives from content
 * In production, could use LLM for better objectives
 * @param {string} content
 * @returns {Array} Array of learning objectives
 */
function generateLearningObjectives(content) {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const objectives = [];

  // Extract key concepts (first 3 sentences often contain main ideas)
  const keySentences = sentences.slice(0, Math.min(3, sentences.length));
  keySentences.forEach((sentence) => {
    objectives.push(`Understand: ${sentence.trim().substring(0, 60)}...`);
  });

  objectives.push('Apply concepts in practical scenarios');
  objectives.push('Relate to real-world examples');

  return objectives.slice(0, 5); // Limit to 5 objectives
}

/**
 * Estimate duration for learning unit
 * @param {number} tokenCount
 * @returns {number} Duration in minutes
 */
function estimateDuration(tokenCount) {
  // Rough estimate: 1 token ≈ 0.5 minutes of reading
  return Math.ceil(tokenCount * 0.5);
}

/**
 * Validate chunk quality
 * Ensures chunks are meaningful and not too small
 * @param {Array} chunks
 * @returns {Array} Filtered chunks
 */
export function validateChunks(chunks) {
  return chunks.filter((chunk) => {
    // Minimum chunk size: 50 tokens
    // Maximum: 2000 tokens
    if (chunk.token_count < 50 || chunk.token_count > 2000) {
      return false;
    }

    // Minimum meaningful content length
    if (chunk.text.length < 100) {
      return false;
    }

    // Check for mostly whitespace or gibberish
    const wordCount = chunk.text.split(/\s+/).length;
    if (wordCount < 10) {
      return false;
    }

    return true;
  });
}

/**
 * Batch process chunks for efficient embedding
 * Groups chunks to optimize API calls
 * @param {Array} chunks - Array of chunks
 * @param {number} batchSize - Number of chunks per batch
 * @returns {Array<Array>} Array of chunk batches
 */
export function createChunkBatches(chunks, batchSize = 20) {
  const batches = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    batches.push(chunks.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Generate metadata for chunk
 * @param {Object} chunk
 * @param {Object} material
 * @returns {Object} Chunk with metadata
 */
export function addChunkMetadata(chunk, material) {
  return {
    ...chunk,
    created_at: new Date().toISOString(),
    metadata: {
      material_id: material.id,
      material_title: material.title,
      class_id: material.class_id,
      subject_id: material.subject_id,
      chapter_id: material.chapter_id,
      material_type: material.material_type,
      source_url: material.file_url,
    },
  };
}
