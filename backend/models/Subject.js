const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  credits: { type: Number, default: 3 }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
