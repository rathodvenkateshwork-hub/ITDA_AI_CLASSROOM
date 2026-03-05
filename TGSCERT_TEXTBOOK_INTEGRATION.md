# 📚 TGSCERT Textbook Integration Guide

**How to Import and Manage TGSCERT Textbooks (Classes 1-10)**

---

## 🎯 Quick Start

You have TGSCERT Textbooks for all classes (1-10) and all subjects. Here's how to integrate them into the Materials Management system.

---

## 📋 Pre-Integration Checklist

- [ ] PDF files of TGSCERT textbooks organized by class
- [ ] Subject list (Math, Science, Social Studies, Language, etc.)
- [ ] Chapter information from each textbook
- [ ] Topics for each chapter
- [ ] Access to admin dashboard

---

## 🚀 Integration Steps

### **Step 1: Organize Textbook Files**

Create a folder structure:
```
TGSCERT_Textbooks/
├── Class_1/
│   ├── Mathematics/
│   │   ├── chapter_1.pdf
│   │   ├── chapter_2.pdf
│   └── English/
│       ├── chapter_1.pdf
├── Class_2/
├── ...
└── Class_10/
```

### **Step 2: Host PDF Files**

Upload PDFs to:
- **Option A:** Cloud storage (Google Drive, Dropbox) + get shareable links
- **Option B:** Your own server/CDN
- **Option C:** Direct upload to file storage service

**Get the file URLs** - you'll need these for uploading materials.

### **Step 3: Create Admin Script (Optional)**

For bulk import, create a script like this:

```bash
# Create textbooks-bulk-import.js in backend/scripts/

import { makeLooseModel } from '../server/supabase-model.js';
import fs from 'fs';

const Material = makeLooseModel('Material', 'materials');
const Subject = makeLooseModel('Subject', 'subjects');
const Chapter = makeLooseModel('Chapter', 'chapters');
const Topic = makeLooseModel('Topic', 'topics');

// Textbook data structure
const textbooksData = [
  {
    grade: 1,
    subjects: [
      {
        name: 'Mathematics',
        chapters: [
          { name: 'Numbers and Numerals', topics: ['1-9 Numbers', 'Numbers 1-9 Practice', '0 to 9 Numerals'] },
          { name: 'Addition', topics: ['Add within 5', 'Add within 10'] },
        ]
      }
    ]
  }
];

async function importTextbooks() {
  try {
    for (const gradeData of textbooksData) {
      for (const subjectData of gradeData.subjects) {
        // Get or create subject
        let subject = await Subject.findOne({ name: subjectData.name }).lean();
        if (!subject) {
          subject = await Subject.create({ 
            name: subjectData.name,
            grades: `[${gradeData.grade}]` 
          });
        }

        // Create chapters and materials
        for (const chapterData of subjectData.chapters) {
          let chapter = await Chapter.create({
            subject_id: subject.id,
            name: chapterData.name,
            grade: gradeData.grade,
          });

          // Create topics
          for (const topicName of chapterData.topics) {
            let topic = await Topic.create({
              chapter_id: chapter.id,
              name: topicName,
            });

            // Create material for this chapter
            await Material.create({
              subject_id: subject.id,
              chapter_id: chapter.id,
              topic_id: topic.id,
              title: `TGSCERT ${gradeData.grade} - ${subjectData.name} - ${chapterData.name}`,
              description: `Official TGSCERT textbook: Grade ${gradeData.grade} ${subjectData.name}`,
              material_type: 'textbook',
              category: 'textbook_chapter',
              file_url: `https://your-storage.com/textbooks/class_${gradeData.grade}/${subjectData.name}/${chapterData.name}.pdf`,
              grade_level: gradeData.grade,
              difficulty_level: 'intermediate',
              is_published: true,
            });
          }
        }
      }
    }
    console.log('✅ Textbooks imported successfully!');
  } catch (err) {
    console.error('❌ Import failed:', err);
  }
}

importTextbooks();
```

### **Step 4: Manual Upload via Admin Interface**

For smaller imports:

1. **Login to Admin Dashboard**
2. **Go to Materials Management**
3. **Click "Upload Material"**
4. **Fill Details:**
   - **Title:** "TGSCERT Grade 10 Mathematics Chapter 1 - Number Systems"
   - **Type:** Select "Textbook"
   - **Category:** Select "Textbook Chapter"
   - **Subject:** Select relevant subject
   - **Chapter:** Select chapter
   - **Grade Level:** 10
   - **File URL:** Paste the PDF file URL
5. **Add Textbook Mapping:**
   - **Textbook Name:** "TGSCERT"
   - **Textbook Version:** "2024 Edition"
   - **Chapter Name:** "Number Systems"
   - **Page Numbers:** "45-67"
   - **TGSCERT Reference:** "NS-001"
6. **Click "Upload"**

### **Step 5: Organize by Subject**

Create materials following this hierarchy:

```
Grade 10
├── Mathematics
│   ├── Number Systems (Chapter 1)
│   │   ├── Real Numbers (Topic)
│   │   └── Polynomials (Topic)
│   ├── Algebra (Chapter 2)
│   └── Geometry (Chapter 3)
├── Science
│   ├── Chemical Reactions (Chapter 1)
│   └── Light and Sound (Chapter 2)
└── Social Studies
    ├── History (Chapter 1)
    └── Geography (Chapter 2)
```

---

## 💾 Bulk Import File Format

If using bulk import, prepare CSV:

```csv
title,material_type,category,subject_id,chapter_id,grade_level,file_url,description
TGSCERT Grade 10 - Mathematics Chapter 1,textbook,textbook_chapter,1,1,10,https://url/class10_math_ch1.pdf,Official TGSCERT Mathematics
TGSCERT Grade 10 - Science Chapter 1,textbook,textbook_chapter,2,5,10,https://url/class10_sci_ch1.pdf,Official TGSCERT Science
```

---

## 🔗 TGSCERT Textbook Reference Codes

When mapping textbooks, use standard codes:

### **Mathematics**
- NS-001: Number Systems
- PL-002: Polynomials
- LP-003: Linear Equations
- QE-004: Quadratic Equations
- PR-005: Progressions
etc.

### **Science**
- CR-001: Chemical Reactions
- LS-002: Light and Sound
- EL-003: Electricity
- MA-004: Magnetism
etc.

### **Social Studies**
- HI-001: History Topics
- GE-002: Geography Topics
- CI-003: Civics Topics

---

## 🎯 Teacher Usage Workflow

Once textbooks are uploaded:

1. **Teacher browses available materials**
   - See "Textbooks" filter with all TGSCERT books
   - Filter by class and subject

2. **Teacher assigns textbook chapter to class**
   - "Today's topic is Chapter 3 - Quadratic Equations"
   - Assign the TGSCERT textbook material
   - Add due date if needed

3. **Students access the textbook**
   - See "Number Systems" chapter assigned
   - Download/view the PDF
   - Can't print (depending on PDF settings)

4. **Track usage**
   - See how many students accessed
   - Track completion times
   - Collect feedback via ratings

---

## 📊 Expected Outcome

After importing all TGSCERT textbooks:

**Materials Dashboard Shows:**
```
✅ Total Materials: 350+ (approximately)
   - 10 grades × 4-5 subjects × 7-8 chapters each

✅ Textbook Materials: 280+

✅ Available to All:
   - Admin: Can manage, share across schools
   - Teachers: Can assign to their classes
   - Students: Can access assigned materials
```

---

## 🔄 Update Workflow

When TGSCERT releases new editions:

1. **Upload new textbook PDFs**
2. **Create new materials** with updated version
3. **Optionally deprecate old versions**
4. **Teachers switch to new materials**

---

## 📚 Classroom Usage Scenarios

### **Scenario 1: Daily Lesson**
```
Teacher prepares for Class 10 Math lecture on Quadratic Equations
1. Accesses "Materials Management" 
2. Finds "TGSCERT Class 10 Math - Quadratic Equations"
3. Downloads PDF for reference
4. Teaches the lesson
5. Assigns the material to Class 10-A
6. Students access it in their materials section
```

### **Scenario 2: Chapter Review**
```
Teacher wants to review Chapter completion
1. Goes to "My Materials"
2. Sees "Quadratic Equations" assigned on March 1
3. Checks student engagement
4. Sees 35 out of 40 students accessed material
5. Notes average rating: 4.2/5 stars
```

### **Scenario 3: Student Access**
```
Student starts their day
1. Logs into Student Portal
2. Goes to "My Learning Materials"
3. Sees today's assigned material: "TGSCERT Ch 5"
4. Clicks "View"
5. Downloads and reads the PDF
6. Marks as "Completed" when done
7. Leaves a 5-star rating
```

---

## 🎓 Supporting Materials Beyond TGSCERT

The system also supports adding alongside textbooks:

- **PPT Presentations** - Teacher-created or downloaded
- **Solution Manuals** - Answer keys and worked examples
- **Practice Worksheets** - Different difficulty levels
- **YouTube Videos** - Concept explanations
- **Reference Links** - Additional resources
- **Assessment Tests** - Quizzes and exams

---

## 📈 Analytics After Implementation

Track:
- Which chapters are most accessed
- Student completion rates
- Average time spent per material
- Rating trends
- Download frequency
- Device-wise access patterns

**Example Query in Admin Dashboard:**
```
Materials used by Class 10-A:
- "Chapter 1 - Number Systems" → 38/40 students (95%)
- "Chapter 2 - Polynomials" → 36/40 students (90%)
- "Chapter 3 - Linear Equations" → 32/40 students (80%)
```

---

## 🚀 Deployment Checklist

- [ ] All TGSCERT PDFs uploaded to cloud storage
- [ ] File URLs ready for import
- [ ] Grade and subject structure set up
- [ ] Chapters created in system
- [ ] Topics mapped to chapters
- [ ] Sample textbook materials uploaded
- [ ] Teachers trained on assignment workflow
- [ ] Students trained on access workflow
- [ ] Analytics dashboard configured
- [ ] Monitoring in place

---

## 💡 Pro Tips

1. **Name Consistency:** Use consistent naming convention
   - Example: "TGSCERT G10 Math Ch1 - Number Systems"

2. **Chapter Ordering:** Number chapters sequentially (Chapter 1, 2, 3...)

3. **Quality Assurance:** Verify PDF links work before assigning to students

4. **Version Management:** Keep track of textbook editions

5. **Backup:** Keep copies of PDFs in at least 2 locations

6. **Access Metrics:** Monitor which chapters get the most engagement

7. **Feedback Loop:** Use student ratings to identify difficult chapters

8. **Regular Updates:** Update materials as new TGSCERT editions release

---

## ❓ FAQ

**Q: Can students download textbooks?**
A: Yes, if PDF is publicly accessible. You can also disable downloads via PDF permissions.

**Q: What if PDF file is very large?**
A: System supports files of any size. Consider compression if > 100MB.

**Q: Can I reorganize materials later?**
A: Yes, edit materials anytime. Reassign to classes as needed.

**Q: How to handle supplementary materials?**
A: Upload as separate materials with category "Reference" or "Teaching Resource"

**Q: Can multiple schools share textbooks?**
A: Yes, mark as "Shared Across Schools" in settings.

**Q: How to track if students actually read textbooks?**
A: System tracks access, but not reading. Consider adding comprehension quizzes.

---

## 📞 Support

For issues:
1. Check if PDF URL is accessible
2. Verify subject/chapter exist
3. Check user permissions
4. Review browser console for errors
5. Contact system administrator

---

## ✅ Implementation Complete!

Once all TGSCERT textbooks are imported, your platform becomes:

✨ **A complete AI-enabled classroom system with standardized, curriculum-aligned materials**

- 📚 Full curriculum coverage (Classes 1-10, all subjects)
- 👨‍🏫 Teachers get structured lesson materials
- 👨‍🎓 Students access organized learning resources
- 📊 Admins monitor engagement and completion
- 🤖 AI can generate supporting content based on textbook chapters

---

**Ready to transform your classroom experience!** 🚀
