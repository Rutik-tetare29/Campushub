const express = require('express');
const Notice = require('../models/Notice');
const { auth, permit } = require('../middleware/auth');

const router = express.Router();

// Create notice (teacher/admin)
router.post('/', auth, permit('teacher','admin'), async (req, res) => {
  try {
    const { title, content, attachments } = req.body;
    const notice = new Notice({ title, content, attachments: attachments || [], createdBy: req.user._id });
    await notice.save();
    // emit via socket
    req.io.emit('new_notice', { id: notice._id, title: notice.title, content: notice.content });
    res.json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all notices
router.get('/', auth, async (req, res) => {
  try {
    const notices = await Notice.find().populate('createdBy', 'name email role').sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notice (admin)
router.delete('/:id', auth, permit('admin'), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    console.error('Delete notice error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
