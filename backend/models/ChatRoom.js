const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['general', 'subject', 'private', 'announcement'], 
    default: 'general' 
  },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  description: { type: String },
  avatar: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate: { type: Boolean, default: false },
  settings: {
    allowFileSharing: { type: Boolean, default: true },
    allowMemberInvite: { type: Boolean, default: true },
    maxMembers: { type: Number, default: 100 }
  },
  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
