const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');
const { permit } = require('../middleware/permission');
const { body, validationResult } = require('express-validator');

/**
 * @route   GET /api/chatrooms
 * @desc    Get all chat rooms (both member and available to join)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { type, subject } = req.query;

    const query = {};
    if (type) query.type = type;
    if (subject) query.subject = subject;

    // Get all rooms except private ones user is not a member of
    const rooms = await ChatRoom.find({
      ...query,
      $or: [
        { type: { $ne: 'private' } }, // All non-private rooms
        { members: req.user.id } // Or rooms user is already a member of
      ]
    })
      .populate('subject', 'name code')
      .populate('createdBy', 'name avatar')
      .populate('members.user', 'name avatar role')
      .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/chatrooms/:id
 * @desc    Get chat room by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name avatar email')
      .populate('members', 'name avatar role email')
      .populate('admins', 'name avatar');

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is a member
    if (!room.members.find(m => m._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this chat room' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching chat room:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/chatrooms
 * @desc    Create new chat room
 * @access  Private
 */
router.post(
  '/',
  auth,
  [
    body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
    body('type').isIn(['general', 'subject', 'private', 'announcement']).withMessage('Invalid room type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        type,
        subject,
        description,
        avatar,
        members,
        settings
      } = req.body;

      // Teachers/admins can create any room, students can only create private rooms
      if (req.user.role === 'student' && type !== 'private') {
        return res.status(403).json({ message: 'Students can only create private rooms' });
      }

      const memberIds = members || [req.user.id];
      if (!memberIds.includes(req.user.id)) {
        memberIds.push(req.user.id);
      }

      const room = await ChatRoom.create({
        name,
        type,
        subject: subject || null,
        description: description || '',
        avatar: avatar || '',
        createdBy: req.user.id,
        members: memberIds,
        admins: [req.user.id],
        settings: settings || {}
      });

      await room.populate('subject', 'name code');
      await room.populate('createdBy', 'name avatar');
      await room.populate('members', 'name avatar role');

      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating chat room:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/chatrooms/:id
 * @desc    Update chat room
 * @access  Private (Admin of room)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is admin of room
    if (!room.admins.includes(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, description, avatar, settings } = req.body;

    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (avatar !== undefined) room.avatar = avatar;
    if (settings) room.settings = { ...room.settings, ...settings };

    await room.save();

    await room.populate('members', 'name avatar role');

    res.json(room);
  } catch (error) {
    console.error('Error updating chat room:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/chatrooms/:id
 * @desc    Delete chat room
 * @access  Private (Creator/Admin)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is creator or admin
    if (
      room.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete all messages in the room
    await Message.deleteMany({ chatRoom: req.params.id });

    await room.deleteOne();

    res.json({ message: 'Chat room deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/chatrooms/:id/join
 * @desc    Join chat room
 * @access  Private
 */
router.post('/:id/join', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if room allows joining
    if (!room.settings.allowJoin && req.user.role === 'student') {
      return res.status(403).json({ message: 'Room does not allow new members' });
    }

    // Check if already a member
    if (room.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    // Check max members limit
    if (room.settings.maxMembers && room.members.length >= room.settings.maxMembers) {
      return res.status(400).json({ message: 'Room is full' });
    }

    room.members.push(req.user.id);
    await room.save();

    await room.populate('members', 'name avatar role');

    res.json({ message: 'Joined chat room successfully', room });
  } catch (error) {
    console.error('Error joining chat room:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/chatrooms/:id/leave
 * @desc    Leave chat room
 * @access  Private
 */
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if member
    if (!room.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Not a member of this room' });
    }

    // Remove from members
    room.members = room.members.filter(m => m.toString() !== req.user.id);

    // Remove from admins if admin
    room.admins = room.admins.filter(a => a.toString() !== req.user.id);

    await room.save();

    res.json({ message: 'Left chat room successfully' });
  } catch (error) {
    console.error('Error leaving chat room:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/chatrooms/:id/members
 * @desc    Add members to chat room
 * @access  Private (Admin of room)
 */
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: 'Member IDs array is required' });
    }

    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is admin of room
    if (!room.admins.includes(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add new members
    memberIds.forEach(memberId => {
      if (!room.members.includes(memberId)) {
        room.members.push(memberId);
      }
    });

    await room.save();
    await room.populate('members', 'name avatar role');

    res.json({ message: 'Members added successfully', room });
  } catch (error) {
    console.error('Error adding members:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/chatrooms/:id/members/:memberId
 * @desc    Remove member from chat room
 * @access  Private (Admin of room)
 */
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is admin of room
    if (!room.admins.includes(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove member
    room.members = room.members.filter(m => m.toString() !== req.params.memberId);
    room.admins = room.admins.filter(a => a.toString() !== req.params.memberId);

    await room.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/chatrooms/:id/admins/:memberId
 * @desc    Promote member to admin
 * @access  Private (Admin of room)
 */
router.post('/:id/admins/:memberId', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is admin of room
    if (!room.admins.includes(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if member exists in room
    if (!room.members.includes(req.params.memberId)) {
      return res.status(400).json({ message: 'User is not a member of this room' });
    }

    // Add to admins if not already
    if (!room.admins.includes(req.params.memberId)) {
      room.admins.push(req.params.memberId);
      await room.save();
    }

    res.json({ message: 'Member promoted to admin successfully' });
  } catch (error) {
    console.error('Error promoting member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/chatrooms/:id/messages
 * @desc    Get messages from chat room
 * @access  Private
 */
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, before } = req.query;

    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is a member
    if (!room.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this chat room' });
    }

    const query = { chatRoom: req.params.id, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name avatar role')
      .populate('replyTo', 'message sender')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: total > page * limit
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/chatrooms/:id/messages
 * @desc    Send message to chat room
 * @access  Private
 */
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is a member
    if (!room.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this chat room' });
    }

    const newMessage = await Message.create({
      sender: req.user.id,
      chatRoom: req.params.id,
      message: message.trim(),
      room: req.params.id
    });

    await newMessage.populate('sender', 'name avatar role');

    // Update room last message time
    room.lastMessageAt = new Date();
    await room.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
