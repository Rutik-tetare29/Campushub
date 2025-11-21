const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { auth } = require('../middleware/auth');
const { permit } = require('../middleware/permission');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const { body, validationResult } = require('express-validator');

/**
 * @route   GET /api/assignments
 * @desc    Get all assignments (with filters)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { subject, status, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (subject) query.subject = subject;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Students see published and closed assignments (but closed assignments won't allow new submissions)
    if (req.user.role === 'student') {
      query.status = { $in: ['published', 'closed'] };
      // Don't apply status filter from query params for students
      if (status) {
        delete query.status;
        query.status = { $in: ['published', 'closed'] };
      }
    }

    console.log('Assignment query for user:', req.user.role, 'Query:', JSON.stringify(query));

    const assignments = await Assignment.find(query)
      .populate('subject', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Assignment.countDocuments(query);

    // For students, add submission status
    if (req.user.role === 'student') {
      const assignmentIds = assignments.map(a => a._id);
      const submissions = await Submission.find({
        assignment: { $in: assignmentIds },
        student: req.user.id
      }).select('assignment status grade');

      assignments.forEach(assignment => {
        const submission = submissions.find(
          s => s.assignment.toString() === assignment._id.toString()
        );
        assignment.submissionStatus = submission?.status || 'not_submitted';
        assignment.submissionGrade = submission?.grade || null;
      });
    }

    res.json({
      assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/assignments/:id
 * @desc    Get assignment by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name email avatar');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if student has submitted
    if (req.user.role === 'student') {
      const submission = await Submission.findOne({
        assignment: assignment._id,
        student: req.user.id
      }).populate('gradedBy', 'name email');
      assignment._doc.submission = submission;
    }

    // Get submission count for teachers
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      const submissionCount = await Submission.countDocuments({
        assignment: assignment._id
      });
      assignment._doc.submissionCount = submissionCount;
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/assignments
 * @desc    Create new assignment
 * @access  Private (Teacher/Admin)
 */
router.post(
  '/',
  auth,
  permit('teacher', 'admin'),
  [
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('maxScore').isNumeric().withMessage('Max score must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        description,
        subject,
        dueDate,
        maxScore,
        attachments,
        instructions,
        allowLateSubmission,
        lateSubmissionPenalty,
        status
      } = req.body;

      // Check for duplicate assignment (same title, subject, and due date within 1 minute)
      const existingAssignment = await Assignment.findOne({
        title,
        subject,
        dueDate: {
          $gte: new Date(new Date(dueDate).getTime() - 60000),
          $lte: new Date(new Date(dueDate).getTime() + 60000)
        },
        createdBy: req.user.id
      });

      if (existingAssignment) {
        return res.status(409).json({ 
          message: 'Assignment with similar details already exists',
          existingAssignment: existingAssignment._id 
        });
      }

      const assignment = await Assignment.create({
        title,
        description,
        subject,
        createdBy: req.user.id,
        dueDate,
        maxScore,
        attachments: attachments || [],
        instructions: instructions || '',
        allowLateSubmission: allowLateSubmission !== false,
        lateSubmissionPenalty: lateSubmissionPenalty || 10,
        status: status || 'draft'
      });

      await assignment.populate('subject', 'name code');

      // If published, notify students (non-blocking)
      if (status === 'published') {
        try {
          // Get all students and send notification
          const User = require('../models/User');
          const students = await User.find({ role: 'student' }).select('_id');
          const studentIds = students.map(s => s._id);
          
          if (studentIds.length > 0) {
            await notificationService.sendBulkNotifications(studentIds, {
              type: 'assignment',
              title: 'New Assignment Posted',
              message: `New assignment "${title}" has been posted. Due date: ${new Date(dueDate).toLocaleDateString()}`,
              link: `/assignments/${assignment._id}`,
              priority: 'high',
              metadata: { assignmentId: assignment._id, dueDate }
            });
          }
        } catch (notifyError) {
          console.error('Error sending notifications (non-critical):', notifyError.message);
          // Don't fail assignment creation if notifications fail
        }
      }

      res.status(201).json(assignment);
    } catch (error) {
      console.error('Error creating assignment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/assignments/:id
 * @desc    Update assignment
 * @access  Private (Teacher/Admin)
 */
router.put('/:id', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check ownership
    if (
      req.user.role !== 'admin' &&
      assignment.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('subject', 'name code');

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete assignment
 * @access  Private (Teacher/Admin)
 */
router.delete('/:id', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check ownership
    if (
      req.user.role !== 'admin' &&
      assignment.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete all submissions
    await Submission.deleteMany({ assignment: req.params.id });

    await assignment.deleteOne();

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/assignments/:id/submit
 * @desc    Submit assignment
 * @access  Private (Student)
 */
router.post(
  '/:id/submit',
  auth,
  permit('student'),
  [
    body('textContent').optional().trim(),
    body('attachments').optional().isArray()
  ],
  async (req, res) => {
    try {
      const { textContent, attachments } = req.body;

      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      if (assignment.status !== 'published') {
        return res.status(400).json({ message: 'Assignment not yet published' });
      }

      // Check if already submitted
      let submission = await Submission.findOne({
        assignment: req.params.id,
        student: req.user.id
      });

      const isLate = new Date() > assignment.dueDate;

      if (!assignment.allowLateSubmission && isLate) {
        return res.status(400).json({ message: 'Late submissions not allowed' });
      }

      if (submission) {
        // Save previous version
        if (!submission.previousVersions) {
          submission.previousVersions = [];
        }
        submission.previousVersions.push({
          version: submission.version,
          attachments: submission.attachments,
          textContent: submission.textContent,
          submittedAt: submission.submittedAt
        });

        // Update submission
        submission.version += 1;
        submission.attachments = attachments || [];
        submission.textContent = textContent || '';
        submission.submittedAt = new Date();
        submission.isLate = isLate;
        submission.status = 'submitted';

        await submission.save();
      } else {
        // Create new submission
        submission = await Submission.create({
          assignment: req.params.id,
          student: req.user.id,
          attachments: attachments || [],
          textContent: textContent || '',
          submittedAt: new Date(),
          isLate,
          status: 'submitted',
          version: 1
        });
      }

      await submission.populate('assignment', 'title maxScore');

      res.status(201).json(submission);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/assignments/:id/submissions
 * @desc    Get all submissions for an assignment
 * @access  Private (Teacher/Admin)
 */
router.get('/:id/submissions', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { status, graded } = req.query;

    const query = { assignment: req.params.id };
    if (status) query.status = status;
    if (graded === 'true') query.grade = { $ne: null };
    if (graded === 'false') query.grade = null;

    const submissions = await Submission.find(query)
      .populate('student', 'name email rollNumber avatar')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/assignments/:id/grade
 * @desc    Grade a submission
 * @access  Private (Teacher/Admin)
 */
router.put(
  '/:assignmentId/grade/:submissionId',
  auth,
  permit('teacher', 'admin'),
  [
    body('grade').isNumeric().withMessage('Grade must be a number'),
    body('feedback').optional().trim()
  ],
  async (req, res) => {
    try {
      const { grade, feedback } = req.body;

      const submission = await Submission.findById(req.params.submissionId)
        .populate('assignment')
        .populate('student', 'name email');

      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      if (grade > submission.assignment.maxScore) {
        return res.status(400).json({
          message: `Grade cannot exceed max score of ${submission.assignment.maxScore}`
        });
      }

      submission.grade = grade;
      submission.feedback = feedback || '';
      submission.gradedBy = req.user.id;
      submission.status = 'graded';

      await submission.save();

      // Notify student
      await notificationService.createNotification({
        recipient: submission.student._id,
        type: 'grade',
        title: 'Assignment Graded',
        message: `Your submission for "${submission.assignment.title}" has been graded. Score: ${grade}/${submission.assignment.maxScore}`,
        link: `/assignments/${submission.assignment._id}`,
        priority: 'medium',
        metadata: { assignmentId: submission.assignment._id, grade }
      });

      res.json(submission);
    } catch (error) {
      console.error('Error grading submission:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/assignments/:assignmentId/submissions/:submissionId
 * @desc    Get single submission details
 * @access  Private
 */
router.get('/:assignmentId/submissions/:submissionId', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId)
      .populate('assignment')
      .populate('student', 'name email rollNumber avatar')
      .populate('gradedBy', 'name email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check access
    if (
      req.user.role === 'student' &&
      submission.student._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
