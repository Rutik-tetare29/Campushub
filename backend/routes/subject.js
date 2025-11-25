const express = require('express');
const Subject = require('../models/Subject');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { auth, permit } = require('../middleware/auth');

const router = express.Router();

// Create subject (admin only)
router.post('/', auth, permit('admin'), async (req, res) => {
  try {
    const { name, code, description, credits, department, semester, assignedTeacher } = req.body;
    
    // Validate required fields
    if (!department || !semester) {
      return res.status(400).json({ message: 'Department and semester are required' });
    }
    
    // If teacher is assigned, verify they exist and are a teacher
    if (assignedTeacher) {
      const teacher = await User.findById(assignedTeacher);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid teacher assignment' });
      }
    }
    
    const subject = new Subject({ 
      name, 
      code, 
      description, 
      credits,
      department,
      semester,
      assignedTeacher,
      teacher: assignedTeacher, // Keep for compatibility
      createdBy: req.user._id 
    });
    
    await subject.save();
    await subject.populate('assignedTeacher', 'name email');
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.code === 11000 ? 'Subject code already exists' : 'Server error' });
  }
});

// Get all subjects (filtered based on role)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Students: only see subjects for their department and semester
    if (req.user.role === 'student') {
      if (!req.user.department || !req.user.semester) {
        return res.json([]); // Return empty if profile not completed
      }
      query = { 
        department: req.user.department, 
        semester: req.user.semester 
      };
    }
    
    // Teachers: only see subjects assigned to them
    if (req.user.role === 'teacher') {
      query = { assignedTeacher: req.user._id };
    }
    
    // Admin: see all subjects
    
    const subjects = await Subject.find(query)
      .populate('assignedTeacher', 'name email')
      .populate('createdBy', 'name');
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teachers (for admin to assign)
router.get('/teachers', auth, permit('admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('name email department');
    res.json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign teacher to subject (admin only)
router.put('/:id/assign-teacher', auth, permit('admin'), async (req, res) => {
  try {
    const { teacherId } = req.body;
    
    if (teacherId) {
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid teacher' });
      }
    }
    
    const subject = await Subject.findByIdAndUpdate(
      req.params.id, 
      { 
        assignedTeacher: teacherId,
        teacher: teacherId // Keep for compatibility
      }, 
      { new: true }
    ).populate('assignedTeacher', 'name email');
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update subject (admin only)
router.put('/:id', auth, permit('admin'), async (req, res) => {
  try {
    const { name, code, description, credits, department, semester, assignedTeacher } = req.body;
    
    const updateData = { name, code, description, credits, department, semester };
    
    if (assignedTeacher) {
      const teacher = await User.findById(assignedTeacher);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid teacher assignment' });
      }
      updateData.assignedTeacher = assignedTeacher;
      updateData.teacher = assignedTeacher; // Keep for compatibility
    }
    
    const subject = await Subject.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).populate('assignedTeacher', 'name email');
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete subject (admin only)
router.delete('/:id', auth, permit('admin'), async (req, res) => {
  try {
    const subjectId = req.params.id;
    
    // First, check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Delete all schedules associated with this subject
    const deletedSchedules = await Schedule.deleteMany({ subject: subjectId });
    console.log(`Deleted ${deletedSchedules.deletedCount} schedules associated with subject ${subject.name}`);
    
    // Delete the subject
    await Subject.findByIdAndDelete(subjectId);
    
    res.json({ 
      message: 'Subject deleted successfully',
      deletedSchedules: deletedSchedules.deletedCount
    });
  } catch (err) {
    console.error('Delete subject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
