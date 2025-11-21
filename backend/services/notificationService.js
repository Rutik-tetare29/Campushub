const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');
const smsService = require('./smsService');
const webpush = require('web-push');

// Configure Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@campusconnect.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Create and send notification through multiple channels
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} - Created notification
 */
const createNotification = async (notificationData) => {
  try {
    const {
      recipient,
      sender,
      type,
      title,
      message,
      link,
      priority = 'medium',
      metadata = {}
    } = notificationData;

    // Get recipient user with preferences
    const user = await User.findById(recipient);
    if (!user) {
      throw new Error('Recipient not found');
    }

    // Determine which channels to use based on user preferences
    const channels = {
      push: user.notificationPreferences?.[type]?.push !== false,
      email: user.notificationPreferences?.[type]?.email !== false,
      sms: user.notificationPreferences?.[type]?.sms !== false
    };

    // Create notification in database
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      priority,
      channels,
      metadata
    });

    // Send through enabled channels
    const sendPromises = [];

    // Push notification
    if (channels.push && user.pushSubscription) {
      sendPromises.push(sendPushNotification(user.pushSubscription, {
        title,
        body: message,
        icon: '/logo192.png',
        badge: '/badge.png',
        data: { link, notificationId: notification._id }
      }));
    }

    // Email notification
    if (channels.email && user.email) {
      const emailTemplate = getEmailTemplateForType(type);
      if (emailTemplate) {
        sendPromises.push(
          emailService.sendEmail(user.email, emailTemplate, {
            ...metadata,
            title,
            message,
            link: `${process.env.FRONTEND_URL}${link}`,
            userName: user.name
          })
        );
      }
    }

    // SMS notification
    if (channels.sms && user.phoneNumber) {
      sendPromises.push(
        smsService.sendSMS(user.phoneNumber, `${title}: ${message}`)
      );
    }

    // Wait for all notifications to be sent
    await Promise.allSettled(sendPromises);

    // Emit real-time notification via Socket.IO
    if (global.io) {
      global.io.to(recipient.toString()).emit('notification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        priority: notification.priority,
        createdAt: notification.createdAt,
        read: false
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Send push notification
 * @param {Object} subscription - Push subscription
 * @param {Object} payload - Notification payload
 * @returns {Promise<void>}
 */
const sendPushNotification = async (subscription, payload) => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY) {
      console.warn('VAPID keys not configured. Push notification not sent.');
      return;
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
    // If subscription is invalid, we should remove it
    if (error.statusCode === 410) {
      console.log('Push subscription expired, should be removed');
    }
  }
};

/**
 * Send bulk notifications
 * @param {Array<string>} recipients - Array of user IDs
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Array>} - Created notifications
 */
const sendBulkNotifications = async (recipients, notificationData) => {
  try {
    const notifications = await Promise.all(
      recipients.map(recipient =>
        createNotification({ ...notificationData, recipient })
          .catch(error => {
            console.error(`Failed to send notification to ${recipient}:`, error);
            return null;
          })
      )
    );

    return notifications.filter(n => n !== null);
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} - Updated notification
 */
const markAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Update result
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Unread count
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Get user notifications with pagination
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Notifications and metadata
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      isRead,
      priority
    } = options;

    const query = { recipient: userId };
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead;
    if (priority) query.priority = priority;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name avatar role')
      .lean();

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} - Deleted notification
 */
const deleteNotification = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndDelete(notificationId);
    return notification;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Subscribe user to push notifications
 * @param {string} userId - User ID
 * @param {Object} subscription - Push subscription
 * @returns {Promise<Object>} - Updated user
 */
const subscribeToPush = async (userId, subscription) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { pushSubscription: subscription },
      { new: true }
    );
    return user;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    throw error;
  }
};

/**
 * Unsubscribe user from push notifications
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated user
 */
const unsubscribeFromPush = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $unset: { pushSubscription: 1 } },
      { new: true }
    );
    return user;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    throw error;
  }
};

/**
 * Update user notification preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - Notification preferences
 * @returns {Promise<Object>} - Updated user
 */
const updatePreferences = async (userId, preferences) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true }
    );
    return user;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

/**
 * Get email template name for notification type
 * @param {string} type - Notification type
 * @returns {string|null} - Email template name
 */
const getEmailTemplateForType = (type) => {
  const templateMap = {
    assignment: 'assignmentDue',
    grade: 'gradePublished',
    notice: 'newNotice',
    attendance: 'attendanceAlert',
    schedule: 'welcome',
    system: 'welcome'
  };
  return templateMap[type] || null;
};

/**
 * Send notification to all users with specific role
 * @param {string} role - User role
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Array>} - Created notifications
 */
const notifyByRole = async (role, notificationData) => {
  try {
    const users = await User.find({ role, isActive: true }).select('_id');
    const recipients = users.map(u => u._id.toString());
    return await sendBulkNotifications(recipients, notificationData);
  } catch (error) {
    console.error('Error notifying by role:', error);
    throw error;
  }
};

/**
 * Send notification to all students in a subject
 * @param {string} subjectId - Subject ID
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Array>} - Created notifications
 */
const notifySubjectStudents = async (subjectId, notificationData) => {
  try {
    const Schedule = require('../models/Schedule');
    const schedules = await Schedule.find({ subject: subjectId })
      .populate('students')
      .select('students');
    
    const studentIds = new Set();
    schedules.forEach(schedule => {
      schedule.students.forEach(student => {
        studentIds.add(student._id.toString());
      });
    });

    return await sendBulkNotifications(Array.from(studentIds), notificationData);
  } catch (error) {
    console.error('Error notifying subject students:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendBulkNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getUserNotifications,
  deleteNotification,
  subscribeToPush,
  unsubscribeFromPush,
  updatePreferences,
  notifyByRole,
  notifySubjectStudents,
  sendPushNotification
};
