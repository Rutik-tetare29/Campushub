const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  size: { type: Number },
  mimeType: { type: String },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  type: { type: String, enum: ['assignment', 'note', 'resource', 'submission', 'other'], default: 'other' },
  description: { type: String },
  tags: [String],
  isPublic: { type: Boolean, default: true },
  downloads: { type: Number, default: 0 },
  currentVersion: { type: Number, default: 1 },
  hasVersions: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  thumbnail: { type: String }
});

module.exports = mongoose.model('Upload', uploadSchema);
