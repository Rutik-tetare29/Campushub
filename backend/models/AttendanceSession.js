const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: Date, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qrCode: { type: String }, // Base64 encoded QR code
  qrData: { type: String, unique: true }, // Unique token for QR code
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  studentsPresent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: {
    latitude: Number,
    longitude: Number,
    radius: { type: Number, default: 100 } // meters
  }
}, { timestamps: true });

// Automatically deactivate expired sessions
attendanceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
