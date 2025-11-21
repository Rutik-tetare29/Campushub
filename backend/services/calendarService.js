const { google } = require('googleapis');
const CalendarEvent = require('../models/CalendarEvent');

/**
 * Get OAuth2 client for Google Calendar
 * @param {Object} tokens - User's Google tokens
 * @returns {Object} - OAuth2 client
 */
const getOAuth2Client = (tokens) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (tokens) {
    oauth2Client.setCredentials(tokens);
  }

  return oauth2Client;
};

/**
 * Get authorization URL for Google Calendar
 * @returns {string} - Authorization URL
 */
const getAuthUrl = () => {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
};

/**
 * Get tokens from authorization code
 * @param {string} code - Authorization code
 * @returns {Promise<Object>} - Tokens
 */
const getTokensFromCode = async (code) => {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

/**
 * Sync event to Google Calendar
 * @param {Object} event - Calendar event
 * @param {Object} userTokens - User's Google tokens
 * @returns {Promise<Object>} - Google event
 */
const syncToGoogleCalendar = async (event, userTokens) => {
  try {
    if (!userTokens || !process.env.GOOGLE_CLIENT_ID) {
      console.warn('Google Calendar not configured');
      return null;
    }

    const oauth2Client = getOAuth2Client(userTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const googleEvent = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: event.endDate.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      reminders: {
        useDefault: false,
        overrides: event.reminders?.map(r => ({
          method: r.method,
          minutes: r.minutes
        })) || []
      },
      colorId: event.color || '1'
    };

    // Add recurrence if specified
    if (event.recurrence?.frequency) {
      googleEvent.recurrence = [
        `RRULE:FREQ=${event.recurrence.frequency.toUpperCase()};COUNT=${event.recurrence.count || 10}`
      ];
    }

    let result;
    if (event.googleEventId) {
      // Update existing event
      result = await calendar.events.update({
        calendarId: 'primary',
        eventId: event.googleEventId,
        resource: googleEvent
      });
    } else {
      // Create new event
      result = await calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent
      });
    }

    return result.data;
  } catch (error) {
    console.error('Error syncing to Google Calendar:', error);
    throw error;
  }
};

/**
 * Delete event from Google Calendar
 * @param {string} googleEventId - Google event ID
 * @param {Object} userTokens - User's Google tokens
 * @returns {Promise<void>}
 */
const deleteFromGoogleCalendar = async (googleEventId, userTokens) => {
  try {
    if (!userTokens || !googleEventId) {
      return;
    }

    const oauth2Client = getOAuth2Client(userTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId
    });

    console.log('Event deleted from Google Calendar');
  } catch (error) {
    console.error('Error deleting from Google Calendar:', error);
    // Don't throw error, just log it
  }
};

/**
 * Import events from Google Calendar
 * @param {Object} userTokens - User's Google tokens
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Imported events
 */
const importFromGoogleCalendar = async (userTokens, startDate, endDate) => {
  try {
    const oauth2Client = getOAuth2Client(userTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error importing from Google Calendar:', error);
    throw error;
  }
};

/**
 * Create calendar event with optional Google sync
 * @param {Object} eventData - Event data
 * @param {Object} userTokens - User's Google tokens (optional)
 * @returns {Promise<Object>} - Created event
 */
const createEvent = async (eventData, userTokens = null) => {
  try {
    // Create event in database
    const event = await CalendarEvent.create(eventData);

    // Sync to Google Calendar if tokens provided
    if (userTokens) {
      try {
        const googleEvent = await syncToGoogleCalendar(event, userTokens);
        if (googleEvent) {
          event.googleEventId = googleEvent.id;
          await event.save();
        }
      } catch (error) {
        console.error('Failed to sync to Google Calendar:', error);
        // Continue even if Google sync fails
      }
    }

    return event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Update calendar event with optional Google sync
 * @param {string} eventId - Event ID
 * @param {Object} updateData - Update data
 * @param {Object} userTokens - User's Google tokens (optional)
 * @returns {Promise<Object>} - Updated event
 */
const updateEvent = async (eventId, updateData, userTokens = null) => {
  try {
    const event = await CalendarEvent.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true }
    );

    if (!event) {
      throw new Error('Event not found');
    }

    // Sync to Google Calendar if tokens provided
    if (userTokens && event.googleEventId) {
      try {
        await syncToGoogleCalendar(event, userTokens);
      } catch (error) {
        console.error('Failed to sync update to Google Calendar:', error);
      }
    }

    return event;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Delete calendar event with optional Google sync
 * @param {string} eventId - Event ID
 * @param {Object} userTokens - User's Google tokens (optional)
 * @returns {Promise<Object>} - Deleted event
 */
const deleteEvent = async (eventId, userTokens = null) => {
  try {
    const event = await CalendarEvent.findById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    // Delete from Google Calendar if synced
    if (userTokens && event.googleEventId) {
      try {
        await deleteFromGoogleCalendar(event.googleEventId, userTokens);
      } catch (error) {
        console.error('Failed to delete from Google Calendar:', error);
      }
    }

    await event.deleteOne();
    return event;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Get events for a user
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} - Events
 */
const getUserEvents = async (userId, startDate, endDate, filters = {}) => {
  try {
    const query = {
      participants: userId,
      startDate: { $gte: startDate, $lte: endDate }
    };

    if (filters.type) query.type = filters.type;
    if (filters.subject) query.subject = filters.subject;

    const events = await CalendarEvent.find(query)
      .sort({ startDate: 1 })
      .populate('subject', 'name code')
      .populate('participants', 'name email avatar')
      .lean();

    return events;
  } catch (error) {
    console.error('Error getting user events:', error);
    throw error;
  }
};

/**
 * Get upcoming events
 * @param {string} userId - User ID
 * @param {number} limit - Limit
 * @returns {Promise<Array>} - Events
 */
const getUpcomingEvents = async (userId, limit = 10) => {
  try {
    const now = new Date();
    const events = await CalendarEvent.find({
      participants: userId,
      startDate: { $gte: now }
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .populate('subject', 'name code')
      .lean();

    return events;
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    throw error;
  }
};

/**
 * Check for event conflicts
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} excludeEventId - Event ID to exclude
 * @returns {Promise<Array>} - Conflicting events
 */
const checkConflicts = async (userId, startDate, endDate, excludeEventId = null) => {
  try {
    const query = {
      participants: userId,
      $or: [
        {
          startDate: { $lt: endDate },
          endDate: { $gt: startDate }
        }
      ]
    };

    if (excludeEventId) {
      query._id = { $ne: excludeEventId };
    }

    const conflicts = await CalendarEvent.find(query)
      .populate('subject', 'name')
      .lean();

    return conflicts;
  } catch (error) {
    console.error('Error checking conflicts:', error);
    throw error;
  }
};

module.exports = {
  getAuthUrl,
  getTokensFromCode,
  syncToGoogleCalendar,
  deleteFromGoogleCalendar,
  importFromGoogleCalendar,
  createEvent,
  updateEvent,
  deleteEvent,
  getUserEvents,
  getUpcomingEvents,
  checkConflicts
};
