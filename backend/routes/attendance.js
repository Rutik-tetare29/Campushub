const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Schedule = require('../models/Schedule');
const { auth } = require('../middleware/auth');
const { permit } = require('../middleware/permission');
const qrService = require('../services/qrService');
const notificationService = require('../services/notificationService');
const { body, validationResult } = require('express-validator');

/**
 * @route   GET /api/attendance
 * @desc    Get attendance records
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { student, subject, schedule, startDate, endDate, status } = req.query;

    const query = {};
    if (student) query.student = student;
    if (subject) query.subject = subject;
    if (schedule) query.schedule = schedule;
    if (status) query.status = status;

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Students can only see their own attendance
    if (req.user.role === 'student') {
      query.student = req.user.id;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber avatar')
      .populate('subject', 'name code')
      .populate('schedule', 'day startTime endTime')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/attendance/student/:studentId
 * @desc    Get attendance for a specific student
 * @access  Private
 */
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    // Students can only access their own attendance
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { subject, startDate, endDate } = req.query;

    const query = { student: req.params.studentId };
    if (subject) query.subject = subject;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('subject', 'name code')
      .populate('schedule', 'day startTime endTime')
      .sort({ date: -1 });

    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const excused = attendance.filter(a => a.status === 'excused').length;

    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    res.json({
      attendance,
      statistics: {
        total,
        present,
        absent,
        late,
        excused,
        percentage: parseFloat(percentage)
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/attendance/subject/:subjectId
 * @desc    Get attendance for a subject
 * @access  Private (Teacher/Admin)
 */
router.get('/subject/:subjectId', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { date } = req.query;

    const query = { subject: req.params.subjectId };
    if (date) query.date = new Date(date);

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber avatar')
      .populate('schedule', 'day startTime endTime')
      .sort({ date: -1, 'student.rollNumber': 1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching subject attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/attendance/session/create
 * @desc    Create QR-based attendance session
 * @access  Private (Teacher/Admin)
 */
router.post(
  '/session/create',
  auth,
  permit('teacher', 'admin'),
  [
    body('schedule').notEmpty().withMessage('Schedule ID is required'),
    body('subject').notEmpty().withMessage('Subject ID is required'),
    body('date').isISO8601().withMessage('Valid date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { schedule, subject, date, location, expiryMinutes = 10 } = req.body;

      // Check if session already exists
      const existing = await AttendanceSession.findOne({
        schedule,
        date: new Date(date),
        isActive: true
      });

      if (existing) {
        return res.status(400).json({ message: 'Active session already exists for this schedule' });
      }

      // Generate QR code
      const qrData = await qrService.generateAttendanceQR({
        scheduleId: schedule,
        subjectId: subject,
        teacherId: req.user.id,
        location: location || {}
      });

      // Create session
      const session = await AttendanceSession.create({
        schedule,
        subject,
        date: new Date(date),
        teacher: req.user.id,
        qrCode: qrData.qrCode,
        qrData: qrData.qrData,
        expiresAt: new Date(Date.now() + expiryMinutes * 60000),
        isActive: true,
        location: location || null
      });

      await session.populate('subject', 'name code');
      await session.populate('schedule', 'day startTime endTime');

      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating attendance session:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   GET /api/attendance/session/:id
 * @desc    Get attendance session details
 * @access  Private
 */
router.get('/session/:id', auth, async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('schedule', 'day startTime endTime')
      .populate('teacher', 'name email')
      .populate('studentsPresent', 'name rollNumber');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance via QR code
 * @access  Private (Student)
 */
router.post(
  '/mark',
  auth,
  permit('student'),
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('qrData').notEmpty().withMessage('QR data is required'),
    body('location').optional().isObject()
  ],
  async (req, res) => {
    try {
      const { sessionId, qrData, location } = req.body;

      const session = await AttendanceSession.findById(sessionId)
        .populate('schedule');

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      if (!session.isActive) {
        return res.status(400).json({ message: 'Session is no longer active' });
      }

      // Validate QR code
      const validation = qrService.validateAttendanceQR(
        qrData,
        session.expiresAt,
        location,
        session.location
      );

      if (!validation.valid) {
        return res.status(400).json({ message: validation.reason });
      }

      // Check if already marked
      const existing = await Attendance.findOne({
        student: req.user.id,
        schedule: session.schedule._id,
        date: session.date
      });

      if (existing) {
        return res.status(400).json({ message: 'Attendance already marked for this session' });
      }

      // Check if student is enrolled in this schedule
      const schedule = await Schedule.findById(session.schedule._id);
      if (!schedule.students.includes(req.user.id)) {
        return res.status(403).json({ message: 'You are not enrolled in this class' });
      }

      // Mark attendance
      const attendance = await Attendance.create({
        student: req.user.id,
        schedule: session.schedule._id,
        subject: session.subject,
        date: session.date,
        status: 'present',
        markedBy: session.teacher,
        method: 'qr',
        geolocation: location || null
      });

      // Add to session's present students
      session.studentsPresent.push(req.user.id);
      await session.save();

      await attendance.populate('subject', 'name code');

      res.status(201).json({
        message: 'Attendance marked successfully',
        attendance
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   POST /api/attendance/manual
 * @desc    Manually mark attendance
 * @access  Private (Teacher/Admin)
 */
router.post(
  '/manual',
  auth,
  permit('teacher', 'admin'),
  [
    body('student').notEmpty().withMessage('Student ID is required'),
    body('schedule').notEmpty().withMessage('Schedule ID is required'),
    body('subject').notEmpty().withMessage('Subject ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { student, schedule, subject, date, status, notes } = req.body;

      // Check if already marked
      let attendance = await Attendance.findOne({
        student,
        schedule,
        date: new Date(date)
      });

      if (attendance) {
        // Update existing
        attendance.status = status;
        attendance.notes = notes || attendance.notes;
        attendance.markedBy = req.user.id;
        await attendance.save();
      } else {
        // Create new
        attendance = await Attendance.create({
          student,
          schedule,
          subject,
          date: new Date(date),
          status,
          markedBy: req.user.id,
          method: 'manual',
          notes: notes || ''
        });
      }

      await attendance.populate('student', 'name rollNumber');
      await attendance.populate('subject', 'name code');

      res.status(201).json(attendance);
    } catch (error) {
      console.error('Error marking attendance manually:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/attendance/:id
 * @desc    Update attendance record
 * @access  Private (Teacher/Admin)
 */
router.put('/:id', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;

    await attendance.save();

    await attendance.populate('student', 'name rollNumber');
    await attendance.populate('subject', 'name code');

    res.json(attendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/attendance/session/:id
 * @desc    End/delete attendance session
 * @access  Private (Teacher/Admin)
 */
router.delete('/session/:id', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check ownership
    if (
      req.user.role !== 'admin' &&
      session.teacher.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    session.isActive = false;
    await session.save();

    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/attendance/analytics/low-attendance
 * @desc    Get students with low attendance
 * @access  Private (Teacher/Admin)
 */
router.get('/analytics/low-attendance', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { subject, threshold = 75 } = req.query;

    const matchQuery = {};
    if (subject) matchQuery.subject = subject;

    const lowAttendance = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          student: '$_id',
          total: 1,
          present: 1,
          percentage: {
            $multiply: [{ $divide: ['$present', '$total'] }, 100]
          }
        }
      },
      { $match: { percentage: { $lt: parseFloat(threshold) } } },
      { $sort: { percentage: 1 } }
    ]);

    // Populate student details
    const User = require('../models/User');
    const populatedData = await User.populate(lowAttendance, {
      path: 'student',
      select: 'name email rollNumber avatar'
    });

    res.json(populatedData);
  } catch (error) {
    console.error('Error fetching low attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/attendance/alert/low-attendance
 * @desc    Send alerts to students with low attendance
 * @access  Private (Teacher/Admin)
 */
router.post('/alert/low-attendance', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { subject, threshold = 75 } = req.body;

    const matchQuery = {};
    if (subject) matchQuery.subject = subject;

    const lowAttendance = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          student: '$_id',
          percentage: {
            $multiply: [{ $divide: ['$present', '$total'] }, 100]
          }
        }
      },
      { $match: { percentage: { $lt: parseFloat(threshold) } } }
    ]);

    // Send notifications
    const notifications = await Promise.all(
      lowAttendance.map(record =>
        notificationService.createNotification({
          recipient: record.student,
          type: 'attendance',
          title: 'Low Attendance Alert',
          message: `Your attendance is below ${threshold}%. Current: ${record.percentage.toFixed(2)}%. Please maintain minimum attendance.`,
          link: '/attendance',
          priority: 'high',
          metadata: { percentage: record.percentage, threshold }
        })
      )
    );

    res.json({
      message: `Alerts sent to ${notifications.length} students`,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error sending alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
