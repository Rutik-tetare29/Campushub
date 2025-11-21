const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

/**
 * @route   GET /api/search
 * @desc    Global search across users, subjects, notices, uploads
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { q, type, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = q.trim();
    const searchLimit = Math.min(parseInt(limit), 50); // Max 50 results

    const User = require('../models/User');
    const Subject = require('../models/Subject');
    const Notice = require('../models/Notice');
    const Upload = require('../models/Upload');
    const Assignment = require('../models/Assignment');

    const results = {
      users: [],
      subjects: [],
      notices: [],
      uploads: [],
      assignments: []
    };

    // Search users
    if (!type || type === 'users') {
      results.users = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { studentId: { $regex: searchQuery, $options: 'i' } },
          { employeeId: { $regex: searchQuery, $options: 'i' } }
        ]
      })
        .select('name email role department studentId employeeId avatar')
        .limit(searchLimit);
    }

    // Search subjects
    if (!type || type === 'subjects') {
      results.subjects = await Subject.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { code: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ]
      })
        .populate('teacher', 'name email')
        .limit(searchLimit);
    }

    // Search notices
    if (!type || type === 'notices') {
      results.notices = await Notice.find({
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { content: { $regex: searchQuery, $options: 'i' } }
        ]
      })
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 })
        .limit(searchLimit);
    }

    // Search uploads
    if (!type || type === 'uploads') {
      results.uploads = await Upload.find({
        $or: [
          { fileName: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ]
      })
        .populate('uploadedBy', 'name role')
        .populate('subject', 'name')
        .sort({ uploadedAt: -1 })
        .limit(searchLimit);
    }

    // Search assignments
    if (!type || type === 'assignments') {
      results.assignments = await Assignment.find({
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ]
      })
        .populate('subject', 'name code')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(searchLimit);
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    res.json({
      query: searchQuery,
      totalResults,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

/**
 * @route   GET /api/search/advanced
 * @desc    Advanced search with filters
 * @access  Private
 */
router.get('/advanced', auth, async (req, res) => {
  try {
    const {
      q,
      type,
      role,
      department,
      semester,
      subjectId,
      startDate,
      endDate,
      sort = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = q.trim();
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    let Model;
    let query = {};
    let searchFields = [];

    // Determine model and search fields based on type
    switch (type) {
      case 'users':
        Model = require('../models/User');
        searchFields = [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { studentId: { $regex: searchQuery, $options: 'i' } },
          { employeeId: { $regex: searchQuery, $options: 'i' } }
        ];
        if (role) query.role = role;
        if (department) query.department = { $regex: department, $options: 'i' };
        if (semester) query.semester = parseInt(semester);
        break;

      case 'subjects':
        Model = require('../models/Subject');
        searchFields = [
          { name: { $regex: searchQuery, $options: 'i' } },
          { code: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ];
        if (department) query.department = { $regex: department, $options: 'i' };
        if (semester) query.semester = parseInt(semester);
        break;

      case 'notices':
        Model = require('../models/Notice');
        searchFields = [
          { title: { $regex: searchQuery, $options: 'i' } },
          { content: { $regex: searchQuery, $options: 'i' } }
        ];
        if (startDate) query.createdAt = { $gte: new Date(startDate) };
        if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
        break;

      case 'uploads':
        Model = require('../models/Upload');
        searchFields = [
          { fileName: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ];
        if (subjectId) query.subject = subjectId;
        if (startDate) query.uploadedAt = { $gte: new Date(startDate) };
        if (endDate) query.uploadedAt = { ...query.uploadedAt, $lte: new Date(endDate) };
        break;

      case 'assignments':
        Model = require('../models/Assignment');
        searchFields = [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ];
        if (subjectId) query.subject = subjectId;
        if (startDate) query.createdAt = { $gte: new Date(startDate) };
        if (endDate) query.dueDate = { $lte: new Date(endDate) };
        break;

      default:
        return res.status(400).json({ message: 'Invalid search type' });
    }

    // Combine search fields with other filters
    query.$or = searchFields;

    // Execute search with pagination
    const [results, total] = await Promise.all([
      Model.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate(type === 'subjects' ? 'teacher' : type === 'uploads' || type === 'assignments' ? 'subject uploadedBy' : ''),
      Model.countDocuments(query)
    ]);

    res.json({
      query: searchQuery,
      type,
      filters: { role, department, semester, subjectId, startDate, endDate },
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      results
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ message: 'Server error during advanced search' });
  }
});

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions/autocomplete
 * @access  Private
 */
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { q, type = 'all', limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchQuery = q.trim();
    const searchLimit = Math.min(parseInt(limit), 10);

    const User = require('../models/User');
    const Subject = require('../models/Subject');
    const Assignment = require('../models/Assignment');

    const suggestions = [];

    // User suggestions
    if (type === 'all' || type === 'users') {
      const users = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ]
      })
        .select('name email role')
        .limit(searchLimit);

      suggestions.push(...users.map(u => ({
        type: 'user',
        label: `${u.name} (${u.email})`,
        value: u._id,
        icon: 'person'
      })));
    }

    // Subject suggestions
    if (type === 'all' || type === 'subjects') {
      const subjects = await Subject.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { code: { $regex: searchQuery, $options: 'i' } }
        ]
      })
        .select('name code')
        .limit(searchLimit);

      suggestions.push(...subjects.map(s => ({
        type: 'subject',
        label: `${s.name} (${s.code})`,
        value: s._id,
        icon: 'book'
      })));
    }

    // Assignment suggestions
    if (type === 'all' || type === 'assignments') {
      const assignments = await Assignment.find({
        title: { $regex: searchQuery, $options: 'i' }
      })
        .select('title')
        .limit(searchLimit);

      suggestions.push(...assignments.map(a => ({
        type: 'assignment',
        label: a.title,
        value: a._id,
        icon: 'assignment'
      })));
    }

    res.json({ suggestions: suggestions.slice(0, searchLimit) });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
