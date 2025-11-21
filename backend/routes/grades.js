const express = require('express');
const router = express.Router();
const Grade = require('../models/Grade');
const { auth } = require('../middleware/auth');
const { permit } = require('../middleware/permission');
const notificationService = require('../services/notificationService');
const { body, validationResult } = require('express-validator');

/**
 * @route   GET /api/grades
 * @desc    Get grades (filtered by role)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { subject, semester, academicYear, student } = req.query;

    const query = {};
    if (subject) query.subject = subject;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    // Students can only see their own grades
    if (req.user.role === 'student') {
      query.student = req.user.id;
    } else if (student) {
      query.student = student;
    }

    const grades = await Grade.find(query)
      .populate('student', 'name email rollNumber avatar')
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });

    res.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/grades/student/:studentId
 * @desc    Get all grades for a student
 * @access  Private
 */
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    // Students can only access their own grades
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const grades = await Grade.find({ student: req.params.studentId })
      .populate('subject', 'name code')
      .sort({ semester: -1, academicYear: -1 });

    // Calculate overall statistics
    const avgGPA = grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.gpa, 0) / grades.length).toFixed(2)
      : 0;

    const gradeDistribution = grades.reduce((acc, grade) => {
      acc[grade.letterGrade] = (acc[grade.letterGrade] || 0) + 1;
      return acc;
    }, {});

    res.json({
      grades,
      statistics: {
        totalSubjects: grades.length,
        avgGPA: parseFloat(avgGPA),
        gradeDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/grades/subject/:subjectId
 * @desc    Get all grades for a subject
 * @access  Private (Teacher/Admin)
 */
router.get('/subject/:subjectId', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { semester, academicYear } = req.query;

    const query = { subject: req.params.subjectId };
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    const grades = await Grade.find(query)
      .populate('student', 'name email rollNumber')
      .sort({ totalScore: -1 });

    // Calculate statistics
    const avgScore = grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.totalScore, 0) / grades.length).toFixed(2)
      : 0;

    const gradeDistribution = grades.reduce((acc, grade) => {
      acc[grade.letterGrade] = (acc[grade.letterGrade] || 0) + 1;
      return acc;
    }, {});

    res.json({
      grades,
      statistics: {
        totalStudents: grades.length,
        avgScore: parseFloat(avgScore),
        gradeDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching subject grades:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/grades
 * @desc    Create or update grade
 * @access  Private (Teacher/Admin)
 */
router.post(
  '/',
  auth,
  permit('teacher', 'admin'),
  [
    body('student').notEmpty().withMessage('Student ID is required'),
    body('subject').notEmpty().withMessage('Subject ID is required'),
    body('semester').notEmpty().withMessage('Semester is required'),
    body('academicYear').notEmpty().withMessage('Academic year is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        student,
        subject,
        semester,
        academicYear,
        assignments,
        midterm,
        final,
        attendance,
        participation,
        weights
      } = req.body;

      // Check if grade already exists
      let grade = await Grade.findOne({ student, subject, semester, academicYear });

      if (grade) {
        // Update existing grade
        grade.assignments = assignments !== undefined ? assignments : grade.assignments;
        grade.midterm = midterm !== undefined ? midterm : grade.midterm;
        grade.final = final !== undefined ? final : grade.final;
        grade.attendance = attendance !== undefined ? attendance : grade.attendance;
        grade.participation = participation !== undefined ? participation : grade.participation;
        if (weights) grade.weights = weights;

        await grade.save(); // Pre-save hook will calculate total and GPA
      } else {
        // Create new grade
        grade = await Grade.create({
          student,
          subject,
          semester,
          academicYear,
          assignments: assignments || 0,
          midterm: midterm || 0,
          final: final || 0,
          attendance: attendance || 0,
          participation: participation || 0,
          weights: weights || {}
        });
      }

      await grade.populate('student', 'name email');
      await grade.populate('subject', 'name code');

      res.status(201).json(grade);
    } catch (error) {
      console.error('Error creating/updating grade:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/grades/:id
 * @desc    Update grade
 * @access  Private (Teacher/Admin)
 */
router.put('/:id', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        grade[key] = req.body[key];
      }
    });

    await grade.save(); // Recalculate total and GPA

    await grade.populate('student', 'name email');
    await grade.populate('subject', 'name code');

    res.json(grade);
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/grades/:id/publish
 * @desc    Publish grade (notify student)
 * @access  Private (Teacher/Admin)
 */
router.post('/:id/publish', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'name email')
      .populate('subject', 'name');

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Notify student
    await notificationService.createNotification({
      recipient: grade.student._id,
      type: 'grade',
      title: 'Grade Published',
      message: `Your grade for ${grade.subject.name} has been published. Grade: ${grade.letterGrade} (GPA: ${grade.gpa})`,
      link: `/grades`,
      priority: 'high',
      metadata: {
        subjectId: grade.subject._id,
        letterGrade: grade.letterGrade,
        gpa: grade.gpa
      }
    });

    res.json({ message: 'Grade published and student notified' });
  } catch (error) {
    console.error('Error publishing grade:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/grades/:id
 * @desc    Delete grade
 * @access  Private (Admin)
 */
router.delete('/:id', auth, permit('admin'), async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    await grade.deleteOne();

    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/grades/bulk
 * @desc    Bulk import grades
 * @access  Private (Teacher/Admin)
 */
router.post('/bulk', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { grades } = req.body;

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ message: 'Grades array is required' });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const gradeData of grades) {
      try {
        let grade = await Grade.findOne({
          student: gradeData.student,
          subject: gradeData.subject,
          semester: gradeData.semester,
          academicYear: gradeData.academicYear
        });

        if (grade) {
          Object.assign(grade, gradeData);
          await grade.save();
        } else {
          grade = await Grade.create(gradeData);
        }

        results.success.push({ student: gradeData.student, grade: grade._id });
      } catch (error) {
        results.failed.push({ student: gradeData.student, error: error.message });
      }
    }

    res.json({
      message: 'Bulk import completed',
      results
    });
  } catch (error) {
    console.error('Error bulk importing grades:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/grades/analytics/distribution
 * @desc    Get grade distribution analytics
 * @access  Private (Teacher/Admin)
 */
router.get('/analytics/distribution', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { subject, semester, academicYear } = req.query;

    const query = {};
    if (subject) query.subject = subject;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    const distribution = await Grade.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$letterGrade',
          count: { $sum: 1 },
          avgGPA: { $avg: '$gpa' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(distribution);
  } catch (error) {
    console.error('Error fetching distribution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/grades/transcript/:studentId
 * @desc    Get student transcript
 * @access  Private
 */
router.get('/transcript/:studentId', auth, async (req, res) => {
  try {
    // Students can only access their own transcript
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const User = require('../models/User');
    const student = await User.findById(req.params.studentId).select('name email rollNumber');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const grades = await Grade.find({ student: req.params.studentId })
      .populate('subject', 'name code credits')
      .sort({ academicYear: -1, semester: -1 });

    // Group by academic year and semester
    const transcript = grades.reduce((acc, grade) => {
      const key = `${grade.academicYear}-${grade.semester}`;
      if (!acc[key]) {
        acc[key] = {
          academicYear: grade.academicYear,
          semester: grade.semester,
          grades: [],
          semesterGPA: 0
        };
      }
      acc[key].grades.push(grade);
      return acc;
    }, {});

    // Calculate semester GPAs
    Object.values(transcript).forEach(term => {
      const avgGPA = term.grades.reduce((sum, g) => sum + g.gpa, 0) / term.grades.length;
      term.semesterGPA = parseFloat(avgGPA.toFixed(2));
    });

    const cumulativeGPA = grades.length > 0
      ? parseFloat((grades.reduce((sum, g) => sum + g.gpa, 0) / grades.length).toFixed(2))
      : 0;

    res.json({
      student,
      transcript: Object.values(transcript),
      cumulativeGPA
    });
  } catch (error) {
    console.error('Error generating transcript:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
