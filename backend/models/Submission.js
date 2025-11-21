const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    uploadedAt: Date
  }],
  textContent: { type: String },
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  grade: { type: Number },
  feedback: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: { type: Date },
  status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' },
  version: { type: Number, default: 1 },
  previousVersions: [{
    attachments: Array,
    textContent: String,
    submittedAt: Date
  }]
}, { timestamps: true });

// Compound index to ensure one submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
