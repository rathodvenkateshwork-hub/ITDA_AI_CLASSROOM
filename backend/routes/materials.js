/**
 * Materials Routes
 * All endpoints for managing learning materials, textbooks, videos, and resources
 * Includes admin upload, teacher assignment, and student access
 */

import express from 'express';
import { makeLooseModel } from '../server/supabase-model.js';

const router = express.Router();

// Initialize models
const Material = makeLooseModel('Material', 'materials');
const MaterialAttachment = makeLooseModel('MaterialAttachment', 'material_attachments');
const TextbookMapping = makeLooseModel('TextbookMapping', 'textbook_mappings');
const MaterialAccess = makeLooseModel('MaterialAccess', 'material_access');
const TeacherMaterialAssignment = makeLooseModel('TeacherMaterialAssignment', 'teacher_material_assignments');
const StudentMaterialAccess = makeLooseModel('StudentMaterialAccess', 'student_material_access');
const MaterialTag = makeLooseModel('MaterialTag', 'material_tags');
const MaterialRating = makeLooseModel('MaterialRating', 'material_ratings');
const YoutubeRecommendation = makeLooseModel('YoutubeRecommendation', 'youtube_recommendations');
const Chapter = makeLooseModel('Chapter', 'chapters');
const Topic = makeLooseModel('Topic', 'topics');
const Subject = makeLooseModel('Subject', 'subjects');
const Class = makeLooseModel('Class', 'classes');
const Teacher = makeLooseModel('Teacher', 'teachers');
const Student = makeLooseModel('Student', 'students');
const School = makeLooseModel('School', 'schools');

// ============================================
// MATERIALS MANAGEMENT - ADMIN ENDPOINTS
// ============================================

/**
 * POST /api/materials
 * Upload a new learning material
 */
router.post('/', async (req, res) => {
  try {
    const {
      subject_id,
      chapter_id,
      topic_id,
      title,
      description,
      material_type, // 'textbook', 'ppt', 'video', 'pdf', 'worksheet', 'example', 'ref_link', 'youtube'
      category, // 'textbook_chapter', 'teaching_resource', 'study_guide', 'sample_problem', 'assessment', 'reference'
      file_url,
      file_name,
      file_size,
      mime_type,
      duration,
      youtube_link,
      external_link,
      grade_level,
      difficulty_level,
      is_published,
      upload_by,
      school_id,
    } = req.body;

    if (!title || !subject_id || !material_type || !category) {
      return res.status(400).json({ error: 'title, subject_id, material_type, and category are required' });
    }

    const material = await Material.create({
      subject_id,
      chapter_id: chapter_id || null,
      topic_id: topic_id || null,
      title,
      description: description || null,
      material_type,
      category,
      file_url: file_url || null,
      file_name: file_name || null,
      file_size: file_size || null,
      mime_type: mime_type || null,
      duration: duration || null,
      youtube_link: youtube_link || null,
      external_link: external_link || null,
      grade_level: grade_level || null,
      difficulty_level: difficulty_level || 'intermediate',
      is_published: is_published || false,
      is_sharedacross_schools: false,
      upload_by: upload_by || null,
      school_id: school_id || null,
    });

    res.status(201).json(material);
  } catch (err) {
    console.error('POST /api/materials error:', err);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

/**
 * GET /api/materials
 * Get all materials with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      subject_id,
      chapter_id,
      topic_id,
      material_type,
      category,
      school_id,
      grade_level,
    } = req.query;

    const query = {};
    if (subject_id) query.subject_id = parseInt(subject_id);
    if (chapter_id) query.chapter_id = parseInt(chapter_id);
    if (topic_id) query.topic_id = parseInt(topic_id);
    if (material_type) query.material_type = material_type;
    if (category) query.category = category;
    if (school_id) query.school_id = parseInt(school_id);
    if (grade_level) query.grade_level = parseInt(grade_level);

    const materials = await Material.find(query).lean();
    res.json(materials);
  } catch (err) {
    console.error('GET /api/materials error:', err);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

/**
 * GET /api/materials/:id
 * Get a specific material with all details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findOne({ id: parseInt(id) }).lean();
    
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Get attachments
    const attachments = await MaterialAttachment.find({ material_id: parseInt(id) }).lean();

    // Get textbook mappings
    const textbookMappings = await TextbookMapping.find({ material_id: parseInt(id) }).lean();

    // Get tags
    const tags = await MaterialTag.find({ material_id: parseInt(id) }).lean();

    // Get average rating
    const ratings = await MaterialRating.find({ material_id: parseInt(id) }).lean();
    const avgRating = ratings?.length > 0 
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
      : null;

    res.json({
      ...material,
      attachments,
      textbook_mappings: textbookMappings,
      tags: tags?.map(t => t.tag_name) || [],
      average_rating: avgRating,
      total_ratings: ratings?.length || 0,
    });
  } catch (err) {
    console.error('GET /api/materials/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

/**
 * PUT /api/materials/:id
 * Update a material
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Material.findOneAndUpdate(
      { id: parseInt(id) },
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('PUT /api/materials/:id error:', err);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

/**
 * DELETE /api/materials/:id
 * Delete a material
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Material.findOneAndDelete({ id: parseInt(id) });

    if (!deleted) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ success: true, message: 'Material deleted' });
  } catch (err) {
    console.error('DELETE /api/materials/:id error:', err);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

/**
 * POST /api/materials/:id/attachments
 * Add an attachment to a material
 */
router.post('/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, file_url, file_size, mime_type, attachment_order } = req.body;

    if (!file_name || !file_url) {
      return res.status(400).json({ error: 'file_name and file_url are required' });
    }

    const attachment = await MaterialAttachment.create({
      material_id: parseInt(id),
      file_name,
      file_url,
      file_size: file_size || null,
      mime_type: mime_type || null,
      attachment_order: attachment_order || 1,
    });

    res.status(201).json(attachment);
  } catch (err) {
    console.error('POST /api/materials/:id/attachments error:', err);
    res.status(500).json({ error: 'Failed to add attachment' });
  }
});

/**
 * POST /api/materials/:id/textbook-mapping
 * Add textbook mapping information
 */
router.post('/:id/textbook-mapping', async (req, res) => {
  try {
    const { id } = req.params;
    const { textbook_name, textbook_version, chapter_name, page_numbers, tgscert_reference } = req.body;

    const mapping = await TextbookMapping.create({
      material_id: parseInt(id),
      textbook_name,
      textbook_version,
      chapter_name,
      page_numbers,
      tgscert_reference,
    });

    res.status(201).json(mapping);
  } catch (err) {
    console.error('POST /api/materials/:id/textbook-mapping error:', err);
    res.status(500).json({ error: 'Failed to add textbook mapping' });
  }
});

/**
 * POST /api/materials/:id/tags
 * Add tags to a material
 */
router.post('/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body; // Array of tag names

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'tags must be an array' });
    }

    const createdTags = await Promise.all(
      tags.map(tag => 
        MaterialTag.create({
          material_id: parseInt(id),
          tag_name: tag,
        })
      )
    );

    res.status(201).json(createdTags);
  } catch (err) {
    console.error('POST /api/materials/:id/tags error:', err);
    res.status(500).json({ error: 'Failed to add tags' });
  }
});

// ============================================
// TEACHER MATERIAL ASSIGNMENTS
// ============================================

/**
 * POST /api/materials/assign
 * Teacher assigns material to a class
 */
router.post('/assign/class', async (req, res) => {
  try {
    const { teacher_id, material_id, class_id, assigned_date, due_date, optional, assignment_notes } = req.body;

    if (!teacher_id || !material_id || !class_id || !assigned_date) {
      return res.status(400).json({ error: 'teacher_id, material_id, class_id, and assigned_date are required' });
    }

    const assignment = await TeacherMaterialAssignment.create({
      teacher_id: parseInt(teacher_id),
      material_id: parseInt(material_id),
      class_id: parseInt(class_id),
      assigned_date,
      due_date: due_date || null,
      optional: optional || false,
      assignment_notes: assignment_notes || null,
    });

    res.status(201).json(assignment);
  } catch (err) {
    console.error('POST /api/materials/assign/class error:', err);
    res.status(500).json({ error: 'Failed to assign material' });
  }
});

/**
 * GET /api/materials/teacher/:teacher_id/assignments
 * Get all material assignments for a teacher
 */
router.get('/teacher/:teacher_id/assignments', async (req, res) => {
  try {
    const { teacher_id } = req.params;
    const assignments = await TeacherMaterialAssignment.find({ teacher_id: parseInt(teacher_id) }).lean();

    // Enrich with material details
    const enriched = await Promise.all(
      (assignments || []).map(async (assignment) => {
        const material = await Material.findOne({ id: assignment.material_id }).lean();
        return { ...assignment, material };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('GET /api/materials/teacher/:teacher_id/assignments error:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

/**
 * GET /api/materials/class/:class_id/materials
 * Get all materials assigned to a class
 */
router.get('/class/:class_id/materials', async (req, res) => {
  try {
    const { class_id } = req.params;
    const assignments = await TeacherMaterialAssignment.find({ class_id: parseInt(class_id) }).lean();

    // Get unique materials
    const materialIds = [...new Set((assignments || []).map(a => a.material_id))];
    const materials = await Promise.all(
      materialIds.map(id => Material.findOne({ id }).lean())
    );

    res.json(materials.filter(m => m));
  } catch (err) {
    console.error('GET /api/materials/class/:class_id/materials error:', err);
    res.status(500).json({ error: 'Failed to fetch class materials' });
  }
});

// ============================================
// STUDENT MATERIAL ACCESS
// ============================================

/**
 * POST /api/materials/:id/student-access
 * Record student accessing a material
 */
router.post('/:id/student-access', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, duration_viewed, completed, completion_percentage } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    // Check if record already exists
    let access = await StudentMaterialAccess.findOne({
      material_id: parseInt(id),
      student_id: parseInt(student_id),
    }).lean();

    if (access) {
      // Update existing record
      access = await StudentMaterialAccess.findOneAndUpdate(
        { material_id: parseInt(id), student_id: parseInt(student_id) },
        {
          duration_viewed: duration_viewed || access.duration_viewed,
          completed: completed !== undefined ? completed : access.completed,
          completion_percentage: completion_percentage || access.completion_percentage,
          last_accessed: new Date(),
        },
        { new: true }
      );
    } else {
      // Create new record
      access = await StudentMaterialAccess.create({
        material_id: parseInt(id),
        student_id: parseInt(student_id),
        duration_viewed: duration_viewed || 0,
        completed: completed || false,
        completion_percentage: completion_percentage || 0,
      });
    }

    res.status(201).json(access);
  } catch (err) {
    console.error('POST /api/materials/:id/student-access error:', err);
    res.status(500).json({ error: 'Failed to record material access' });
  }
});

/**
 * GET /api/materials/:id/student-progress
 * Get student progress on a material
 */
router.get('/:id/student-progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    const access = await StudentMaterialAccess.findOne({
      material_id: parseInt(id),
      student_id: parseInt(student_id),
    }).lean();

    res.json(access || { material_id: parseInt(id), student_id: parseInt(student_id), completion_percentage: 0 });
  } catch (err) {
    console.error('GET /api/materials/:id/student-progress error:', err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * GET /api/materials/student/:student_id/materials
 * Get all materials available to a student
 */
router.get('/student/:student_id/materials', async (req, res) => {
  try {
    const { student_id } = req.params;

    // Get student's class enrollment
    const studentData = await Student.findOne({ id: parseInt(student_id) }).lean();
    if (!studentData) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get materials assigned to student's class
    const assignments = await TeacherMaterialAssignment.find({
      class_id: studentData.enrolled_class_id || studentData.class_id,
    }).lean();

    const materialIds = [...new Set((assignments || []).map(a => a.material_id))];
    const materials = await Promise.all(
      materialIds.map(async (id) => {
        const material = await Material.findOne({ id }).lean();
        const progress = await StudentMaterialAccess.findOne({
          material_id: id,
          student_id: parseInt(student_id),
        }).lean();
        return { ...material, student_progress: progress };
      })
    );

    res.json(materials.filter(m => m));
  } catch (err) {
    console.error('GET /api/materials/student/:student_id/materials error:', err);
    res.status(500).json({ error: 'Failed to fetch student materials' });
  }
});

// ============================================
// MATERIAL RATINGS AND FEEDBACK
// ============================================

/**
 * POST /api/materials/:id/rate
 * Student rates a material
 */
router.post('/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, rating, feedback } = req.body;

    if (!student_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'student_id and rating (1-5) are required' });
    }

    // Check if rating already exists
    let existingRating = await MaterialRating.findOne({
      material_id: parseInt(id),
      student_id: parseInt(student_id),
    }).lean();

    if (existingRating) {
      // Update existing rating
      existingRating = await MaterialRating.findOneAndUpdate(
        { material_id: parseInt(id), student_id: parseInt(student_id) },
        { rating, feedback: feedback || null },
        { new: true }
      );
    } else {
      // Create new rating
      existingRating = await MaterialRating.create({
        material_id: parseInt(id),
        student_id: parseInt(student_id),
        rating,
        feedback: feedback || null,
      });
    }

    res.status(201).json(existingRating);
  } catch (err) {
    console.error('POST /api/materials/:id/rate error:', err);
    res.status(500).json({ error: 'Failed to save rating' });
  }
});

/**
 * GET /api/materials/:id/ratings
 * Get all ratings for a material
 */
router.get('/:id/ratings', async (req, res) => {
  try {
    const { id } = req.params;
    const ratings = await MaterialRating.find({ material_id: parseInt(id) }).lean();

    const avg = ratings?.length > 0 
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
      : null;

    res.json({
      ratings: ratings || [],
      average_rating: avg,
      total_ratings: ratings?.length || 0,
    });
  } catch (err) {
    console.error('GET /api/materials/:id/ratings error:', err);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// ============================================
// YOUTUBE RECOMMENDATIONS
// ============================================

/**
 * POST /api/materials/youtube-recommendations
 * Add a YouTube video recommendation
 */
router.post('/youtube-recommendations', async (req, res) => {
  try {
    const {
      topic_id,
      chapter_id,
      youtube_title,
      youtube_url,
      youtube_video_id,
      description,
      duration,
      channel_name,
      added_by,
      is_curated,
    } = req.body;

    if (!youtube_url || (!topic_id && !chapter_id)) {
      return res.status(400).json({ error: 'youtube_url and either topic_id or chapter_id are required' });
    }

    const recommendation = await YoutubeRecommendation.create({
      topic_id: topic_id || null,
      chapter_id: chapter_id || null,
      youtube_title: youtube_title || 'Untitled',
      youtube_url,
      youtube_video_id: youtube_video_id || extractVideoId(youtube_url),
      description: description || null,
      duration: duration || null,
      channel_name: channel_name || null,
      added_by: added_by || null,
      is_curated: is_curated || false,
    });

    res.status(201).json(recommendation);
  } catch (err) {
    console.error('POST /api/materials/youtube-recommendations error:', err);
    res.status(500).json({ error: 'Failed to add YouTube recommendation' });
  }
});

/**
 * GET /api/materials/youtube-recommendations
 * Get YouTube recommendations for a topic or chapter
 */
router.get('/youtube-recommendations', async (req, res) => {
  try {
    const { topic_id, chapter_id } = req.query;

    const query = {};
    if (topic_id) query.topic_id = parseInt(topic_id);
    if (chapter_id) query.chapter_id = parseInt(chapter_id);

    const recommendations = await YoutubeRecommendation.find(query).lean();
    res.json(recommendations || []);
  } catch (err) {
    console.error('GET /api/materials/youtube-recommendations error:', err);
    res.status(500).json({ error: 'Failed to fetch YouTube recommendations' });
  }
});

// ============================================
// SEARCH AND FILTER
// ============================================

/**
 * GET /api/materials/search
 * Search materials by keyword
 */
router.get('/search/all', async (req, res) => {
  try {
    const { q, subject_id, grade_level, category } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Note: This is a simple keyword search. For production, use full-text search
    const allMaterials = await Material.find({}).lean();
    
    let results = (allMaterials || []).filter(m =>
      m.title?.toLowerCase().includes(q.toLowerCase()) ||
      m.description?.toLowerCase().includes(q.toLowerCase())
    );

    if (subject_id) {
      results = results.filter(m => m.subject_id === parseInt(subject_id));
    }
    if (grade_level) {
      results = results.filter(m => m.grade_level === parseInt(grade_level));
    }
    if (category) {
      results = results.filter(m => m.category === category);
    }

    res.json(results);
  } catch (err) {
    console.error('GET /api/materials/search/all error:', err);
    res.status(500).json({ error: 'Failed to search materials' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractVideoId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export default router;
