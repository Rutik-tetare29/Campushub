const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  room: { type: String, default: 'general' },
  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  type: { type: String, enum: ['text', 'file', 'image', 'video', 'system'], default: 'text' },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: Date
  }]
}, { timestamps: true });

// Index for efficient queries
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
