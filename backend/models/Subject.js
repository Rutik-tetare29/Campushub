const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  department: { type: String, required: true }, // Which department this subject belongs to
  semester: { type: String, required: true }, // Which semester (1, 2, 3, etc.)
  credits: { type: Number, default: 3 },
  assignedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Teacher assigned by admin
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Legacy field for compatibility
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Admin who created it
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
