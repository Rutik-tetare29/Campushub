const express = require('express');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { content, room, attachments } = req.body;
    const message = new Message({ 
      sender: req.user._id, 
      content, 
      room: room || 'general',
      attachments: attachments || []
    });
    await message.save();
    const populated = await Message.findById(message._id).populate('sender', 'name email role');
    // emit via socket to room
    req.io.to(room || 'general').emit('new_message', populated);
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a room
router.get('/', auth, async (req, res) => {
  try {
    const room = req.query.room || 'general';
    const messages = await Message.find({ room })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
