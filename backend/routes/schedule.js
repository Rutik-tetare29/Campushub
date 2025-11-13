const express = require('express');
const Schedule = require('../models/Schedule');
const { auth, permit } = require('../middleware/auth');

const router = express.Router();

// Create schedule (teacher/admin)
router.post('/', auth, permit('teacher','admin'), async (req, res) => {
  try {
    const { subject, dayOfWeek, startTime, endTime, room, semester } = req.body;
    const schedule = new Schedule({ subject, dayOfWeek, startTime, endTime, room, semester });
    await schedule.save();
    req.io.emit('schedule_updated', { message: 'Schedule updated' });
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all schedules
router.get('/', auth, async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate({ path: 'subject', populate: { path: 'teacher', select: 'name' } })
      .sort({ dayOfWeek: 1, startTime: 1 });
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update schedule (teacher/admin)
router.put('/:id', auth, permit('teacher','admin'), async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    req.io.emit('schedule_updated', { message: 'Schedule updated' });
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete schedule (admin)
router.delete('/:id', auth, permit('admin'), async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
