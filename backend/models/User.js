const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student','teacher','admin'], default: 'student' },
  
  // Common profile fields
  phone: { type: String },
  dateOfBirth: { type: Date },
  address: { type: String },
  bio: { type: String },
  
  // Student-specific fields
  studentId: { type: String },
  enrollmentYear: { type: String },
  semester: { type: String },
  
  // Teacher-specific fields
  employeeId: { type: String },
  designation: { type: String },
  specialization: { type: String },
  
  // Common academic field
  department: { type: String },
  
  // Admin-specific fields
  adminId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
