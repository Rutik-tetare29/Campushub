const mongoose = require('mongoose');

const fileVersionSchema = new mongoose.Schema({
  file: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload', required: true },
  version: { type: Number, required: true },
  filename: { type: String, required: true },
  originalName: { type: String },
  size: { type: Number },
  mimetype: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  changes: { type: String }, // Description of changes
  isCurrentVersion: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index for versioning
fileVersionSchema.index({ file: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('FileVersion', fileVersionSchema);
