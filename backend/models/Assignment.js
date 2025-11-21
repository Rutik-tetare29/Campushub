const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  maxScore: { type: Number, default: 100 },
  attachments: [{
    filename: String,
    url: String,
    size: Number
  }],
  instructions: { type: String },
  allowLateSubmission: { type: Boolean, default: false },
  lateSubmissionPenalty: { type: Number, default: 0 }, // percentage
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
