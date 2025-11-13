const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  dayOfWeek: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String },
  semester: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
