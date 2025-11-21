const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { 
    type: String, 
    enum: ['class', 'exam', 'assignment', 'holiday', 'event', 'meeting'], 
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  location: { type: String },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  color: { type: String, default: '#3788d8' },
  reminders: [{
    type: { type: String, enum: ['email', 'notification', 'sms'] },
    minutesBefore: Number
  }],
  isRecurring: { type: Boolean, default: false },
  recurrence: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    interval: Number,
    endDate: Date
  },
  googleEventId: { type: String }, // For Google Calendar sync
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' }
}, { timestamps: true });

// Index for efficient date range queries
calendarEventSchema.index({ startDate: 1, endDate: 1 });
calendarEventSchema.index({ participants: 1, startDate: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
