const express = require('express');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Send message
router.post('/', auth, async (req, res) => {
  try {
    console.log('📨 POST /api/messages - User:', req.user.name, 'Role:', req.user.role);
    console.log('📨 Message content:', req.body.content, 'Room:', req.body.room);
    
    const { content, room, attachments } = req.body;
    const message = new Message({ 
      sender: req.user._id, 
      content, 
      room: room || 'general',
      attachments: attachments || []
    });
    await message.save();
    console.log('✅ Message saved:', message._id);
    
    const populated = await Message.findById(message._id).populate('sender', 'name email role');
    // emit via socket to room
    req.io.to(room || 'general').emit('new_message', populated);
    console.log('📢 Message emitted to room:', room || 'general');
    
    res.json(populated);
  } catch (err) {
    console.error('❌ Error sending message:', err);
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
