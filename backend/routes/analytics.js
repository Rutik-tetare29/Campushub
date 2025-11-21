const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { permit } = require('../middleware/permission');
const analyticsService = require('../services/analyticsService');

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard overview
 * @access  Private
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const overview = await analyticsService.getDashboardOverview(
      req.user.id,
      req.user.role
    );
    res.json(overview);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/analytics/attendance
 * @desc    Get attendance analytics
 * @access  Private (Teacher/Admin)
 */
router.get('/attendance', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { subjectId, studentId, startDate, endDate } = req.query;

    const analytics = await analyticsService.getAttendanceAnalytics({
      subjectId,
      studentId,
      startDate,
      endDate
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching attendance analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/analytics/grades
 * @desc    Get grade analytics
 * @access  Private (Teacher/Admin)
 */
router.get('/grades', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { subjectId, semester, academicYear } = req.query;

    const analytics = await analyticsService.getGradeAnalytics({
      subjectId,
      semester,
      academicYear
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching grade analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/analytics/assignments
 * @desc    Get assignment analytics
 * @access  Private (Teacher/Admin)
 */
router.get('/assignments', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { subjectId, teacherId } = req.query;

    const analytics = await analyticsService.getAssignmentAnalytics({
      subjectId,
      teacherId: teacherId || (req.user.role === 'teacher' ? req.user.id : undefined)
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching assignment analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/analytics/subject/:subjectId
 * @desc    Get subject performance analytics
 * @access  Private (Teacher/Admin)
 */
router.get('/subject/:subjectId', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const analytics = await analyticsService.getSubjectAnalytics(req.params.subjectId);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching subject analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/analytics/user-activity
 * @desc    Get user activity analytics
 * @access  Private
 */
router.get('/user-activity', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const analytics = await analyticsService.getUserActivityAnalytics(
      req.user.id,
      parseInt(days)
    );
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/analytics/export/:type
 * @desc    Export analytics data
 * @access  Private (Teacher/Admin)
 */
router.get('/export/:type', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { type } = req.params;
    const filters = req.query;

    const data = await analyticsService.exportAnalyticsData(type, filters);

    // Convert to CSV format
    const fields = Object.keys(data[0] || {});
    const csv = [
      fields.join(','),
      ...data.map(row =>
        fields.map(field => {
          const value = row[field];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`${type}-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
