const express = require('express');
const Subject = require('../models/Subject');
const { auth, permit } = require('../middleware/auth');

const router = express.Router();

// Create subject (teacher/admin)
router.post('/', auth, permit('teacher','admin'), async (req, res) => {
  try {
    const { name, code, description, credits } = req.body;
    const subject = new Subject({ name, code, description, teacher: req.user._id, credits });
    await subject.save();
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.code === 11000 ? 'Subject code already exists' : 'Server error' });
  }
});

// Get all subjects
router.get('/', auth, async (req, res) => {
  try {
    const subjects = await Subject.find().populate('teacher', 'name email');
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update subject (teacher/admin)
router.put('/:id', auth, permit('teacher','admin'), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete subject (admin)
router.delete('/:id', auth, permit('admin'), async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
