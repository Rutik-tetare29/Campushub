const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student','teacher','admin'], default: 'student' },
  
  // Profile fields
  avatar: { type: String, default: '' },
  phone: { type: String },
  dateOfBirth: { type: Date },
  address: { type: String },
  bio: { type: String },
  
  // Student-specific fields
  studentId: { type: String },
  enrollmentYear: { type: String },
  semester: { type: String },
  
  // Teacher-specific fields
  employeeId: { type: String },
  designation: { type: String },
  specialization: { type: String },
  
  // Common academic field
  department: { type: String },
  
  // Admin-specific fields
  adminId: { type: String },
  
  // Notification preferences
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    assignments: { type: Boolean, default: true },
    grades: { type: Boolean, default: true },
    attendance: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true }
  },
  
  // Push notification subscription
  pushSubscription: { type: mongoose.Schema.Types.Mixed },
  
  // Google Calendar integration
  googleCalendarToken: { type: mongoose.Schema.Types.Mixed },
  
  // Account status
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
