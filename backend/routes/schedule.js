const express = require('express');
const Schedule = require('../models/Schedule');
const Subject = require('../models/Subject');
const { auth, permit } = require('../middleware/auth');

const router = express.Router();

// Create schedule (admin only)
router.post('/', auth, permit('admin'), async (req, res) => {
  try {
    const { subject, dayOfWeek, startTime, endTime, room, semester, department, teacher } = req.body;
    
    // Get subject details to auto-fill teacher, department, and semester if not provided
    let assignedTeacher = teacher;
    let scheduleDepartment = department;
    let scheduleSemester = semester;
    
    if (subject) {
      const subjectDoc = await Subject.findById(subject);
      if (subjectDoc) {
        if (!assignedTeacher) assignedTeacher = subjectDoc.assignedTeacher;
        if (!scheduleDepartment) scheduleDepartment = subjectDoc.department;
        if (!scheduleSemester) scheduleSemester = subjectDoc.semester;
      }
    }
    
    const schedule = new Schedule({ 
      subject, 
      dayOfWeek, 
      startTime, 
      endTime, 
      room, 
      semester: scheduleSemester,
      department: scheduleDepartment,
      teacher: assignedTeacher,
      createdBy: req.user._id
    });
    
    await schedule.save();
    req.io.emit('schedule_updated', { message: 'Schedule updated' });
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all schedules (filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Students: filter by their department and semester
    if (req.user.role === 'student') {
      if (!req.user.department || !req.user.semester) {
        return res.json([]); // Return empty if profile not completed
      }
      query = {
        department: req.user.department,
        semester: req.user.semester
      };
      console.log('Student schedule query:', query);
      console.log('User:', { department: req.user.department, semester: req.user.semester, role: req.user.role });
    }
    
    // Teachers: filter by schedules assigned to them
    if (req.user.role === 'teacher') {
      query = { teacher: req.user._id };
    }
    
    // Admin: see all schedules
    
    const schedules = await Schedule.find(query)
      .populate({ 
        path: 'subject', 
        populate: { 
          path: 'assignedTeacher', 
          select: 'name email' 
        } 
      })
      .populate('teacher', 'name email')
      .sort({ dayOfWeek: 1, startTime: 1 });
    
    console.log('Found schedules:', schedules.length);
    if (schedules.length > 0) {
      console.log('First schedule dept/sem:', { 
        department: schedules[0].department, 
        semester: schedules[0].semester,
        subject: schedules[0].subject?.name 
      });
    }
    
    // Filter out schedules with null/deleted subjects (orphaned schedules)
    const validSchedules = schedules.filter(schedule => schedule.subject !== null);
    
    // If any orphaned schedules found, clean them up in background
    const orphanedSchedules = schedules.filter(schedule => schedule.subject === null);
    if (orphanedSchedules.length > 0) {
      console.log(`Found ${orphanedSchedules.length} orphaned schedules, cleaning up...`);
      const orphanedIds = orphanedSchedules.map(s => s._id);
      Schedule.deleteMany({ _id: { $in: orphanedIds } }).catch(err => 
        console.error('Error cleaning orphaned schedules:', err)
      );
    }
    
    res.json(validSchedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update schedule (admin only)
router.put('/:id', auth, permit('admin'), async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.io.emit('schedule_updated', { message: 'Schedule updated' });
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete schedule (admin only)
router.delete('/:id', auth, permit('admin'), async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clean up orphaned schedules (admin only)
router.post('/cleanup-orphaned', auth, permit('admin'), async (req, res) => {
  try {
    // Find all schedules
    const allSchedules = await Schedule.find().populate('subject');
    
    // Find orphaned ones (where subject is null)
    const orphanedIds = allSchedules
      .filter(schedule => schedule.subject === null)
      .map(schedule => schedule._id);
    
    if (orphanedIds.length === 0) {
      return res.json({ message: 'No orphaned schedules found', deletedCount: 0 });
    }
    
    // Delete orphaned schedules
    const result = await Schedule.deleteMany({ _id: { $in: orphanedIds } });
    
    console.log(`Cleaned up ${result.deletedCount} orphaned schedules`);
    res.json({ 
      message: 'Orphaned schedules cleaned up successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
