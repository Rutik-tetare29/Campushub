const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schedule: { type: mongoose.Schema.Types.Mixed, required: false }, // Allow string or ObjectId, optional
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'excused'], 
    required: true 
  },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  markedAt: { type: Date, default: Date.now },
  method: { 
    type: String, 
    enum: ['manual', 'qr', 'auto'], 
    default: 'manual' 
  },
  notes: { type: String },
  geolocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
}, { timestamps: true });

// Compound index for efficient queries
attendanceSchema.index({ student: 1, subject: 1, date: 1 });
attendanceSchema.index({ schedule: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
