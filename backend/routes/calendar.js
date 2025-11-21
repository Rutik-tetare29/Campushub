const express = require('express');
const router = express.Router();
const CalendarEvent = require('../models/CalendarEvent');
const { auth } = require('../middleware/auth');
const { permit } = require('../middleware/permission');
const calendarService = require('../services/calendarService');
const notificationService = require('../services/notificationService');
const { body, validationResult } = require('express-validator');

/**
 * @route   GET /api/calendar/events
 * @desc    Get calendar events
 * @access  Private
 */
router.get('/events', auth, async (req, res) => {
  try {
    const { startDate, endDate, type, subject } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const filters = {};
    if (type) filters.type = type;
    if (subject) filters.subject = subject;

    const events = await calendarService.getUserEvents(
      req.user.id,
      start,
      end,
      filters
    );

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/calendar/events/:id
 * @desc    Get event by ID
 * @access  Private
 */
router.get('/events/:id', auth, async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('participants', 'name email avatar');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is a participant
    if (!event.participants.find(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this event' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/calendar/events
 * @desc    Create new event
 * @access  Private
 */
router.post(
  '/events',
  auth,
  [
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('type').isIn(['class', 'exam', 'assignment', 'holiday', 'event', 'meeting']).withMessage('Invalid event type'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        description,
        type,
        startDate,
        endDate,
        allDay,
        location,
        subject,
        participants,
        color,
        reminders,
        recurrence,
        syncWithGoogle
      } = req.body;

      // Check for conflicts
      const participantIds = participants || [req.user.id];
      const conflicts = await calendarService.checkConflicts(
        req.user.id,
        new Date(startDate),
        new Date(endDate)
      );

      if (conflicts.length > 0) {
        return res.status(400).json({
          message: 'Time conflict detected',
          conflicts
        });
      }

      // Get user tokens for Google sync
      let userTokens = null;
      if (syncWithGoogle) {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        userTokens = user.googleCalendarToken;
      }

      // Create event
      const event = await calendarService.createEvent({
        title,
        description: description || '',
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay: allDay || false,
        location: location || '',
        subject: subject || null,
        participants: participantIds,
        color: color || '#667eea',
        reminders: reminders || [],
        recurrence: recurrence || null
      }, userTokens);

      await event.populate('subject', 'name code');
      await event.populate('participants', 'name email avatar');

      // Notify participants
      if (participantIds.length > 1) {
        const otherParticipants = participantIds.filter(p => p !== req.user.id);
        await notificationService.sendBulkNotifications(otherParticipants, {
          type: 'schedule',
          title: 'New Event',
          message: `You've been added to "${title}" on ${new Date(startDate).toLocaleDateString()}`,
          link: `/calendar`,
          priority: 'medium',
          metadata: { eventId: event._id }
        });
      }

      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @route   PUT /api/calendar/events/:id
 * @desc    Update event
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is participant
    if (!event.participants.includes(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get user tokens for Google sync
    let userTokens = null;
    if (req.body.syncWithGoogle) {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      userTokens = user.googleCalendarToken;
    }

    const updatedEvent = await calendarService.updateEvent(
      req.params.id,
      req.body,
      userTokens
    );

    await updatedEvent.populate('subject', 'name code');
    await updatedEvent.populate('participants', 'name email avatar');

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/calendar/events/:id
 * @desc    Delete event
 * @access  Private
 */
router.delete('/events/:id', auth, async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only participants or admin can delete
    if (!event.participants.includes(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get user tokens for Google sync
    let userTokens = null;
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    userTokens = user.googleCalendarToken;

    await calendarService.deleteEvent(req.params.id, userTokens);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/calendar/upcoming
 * @desc    Get upcoming events
 * @access  Private
 */
router.get('/upcoming', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const events = await calendarService.getUpcomingEvents(
      req.user.id,
      parseInt(limit)
    );

    res.json(events);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/calendar/google/auth-url
 * @desc    Get Google Calendar authorization URL
 * @access  Private
 */
router.get('/google/auth-url', auth, (req, res) => {
  try {
    const authUrl = calendarService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/calendar/google/callback
 * @desc    Handle Google Calendar OAuth callback
 * @access  Private
 */
router.post('/google/callback', auth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code required' });
    }

    const tokens = await calendarService.getTokensFromCode(code);

    // Save tokens to user
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      googleCalendarToken: tokens
    });

    res.json({ message: 'Google Calendar connected successfully' });
  } catch (error) {
    console.error('Error handling callback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/calendar/google/sync
 * @desc    Sync events with Google Calendar
 * @access  Private
 */
router.post('/google/sync', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    if (!user.googleCalendarToken) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const googleEvents = await calendarService.importFromGoogleCalendar(
      user.googleCalendarToken,
      start,
      end
    );

    res.json({
      message: 'Sync completed',
      imported: googleEvents.length,
      events: googleEvents
    });
  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   DELETE /api/calendar/google/disconnect
 * @desc    Disconnect Google Calendar
 * @access  Private
 */
router.delete('/google/disconnect', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { googleCalendarToken: 1 }
    });

    res.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
