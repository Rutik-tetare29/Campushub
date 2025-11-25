const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Teacher for this schedule
  dayOfWeek: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String },
  semester: { type: String },
  department: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Admin who created it
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
