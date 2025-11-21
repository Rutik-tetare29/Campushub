const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  semester: { type: String, required: true },
  academicYear: { type: String, required: true },
  
  // Component grades
  assignments: { type: Number, default: 0 }, // Out of 100
  midterm: { type: Number, default: 0 },
  final: { type: Number, default: 0 },
  attendance: { type: Number, default: 0 },
  participation: { type: Number, default: 0 },
  
  // Weightages
  weights: {
    assignments: { type: Number, default: 30 },
    midterm: { type: Number, default: 25 },
    final: { type: Number, default: 30 },
    attendance: { type: Number, default: 10 },
    participation: { type: Number, default: 5 }
  },
  
  // Calculated fields
  totalScore: { type: Number, default: 0 },
  letterGrade: { type: String, enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'I', 'W'], default: 'I' },
  gpa: { type: Number, default: 0 },
  
  remarks: { type: String },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Calculate total score before saving
gradeSchema.pre('save', function(next) {
  const { assignments, midterm, final, attendance, participation } = this;
  const { weights } = this;
  
  this.totalScore = (
    (assignments * weights.assignments / 100) +
    (midterm * weights.midterm / 100) +
    (final * weights.final / 100) +
    (attendance * weights.attendance / 100) +
    (participation * weights.participation / 100)
  );
  
  // Calculate letter grade
  if (this.totalScore >= 95) this.letterGrade = 'A+';
  else if (this.totalScore >= 90) this.letterGrade = 'A';
  else if (this.totalScore >= 85) this.letterGrade = 'A-';
  else if (this.totalScore >= 80) this.letterGrade = 'B+';
  else if (this.totalScore >= 75) this.letterGrade = 'B';
  else if (this.totalScore >= 70) this.letterGrade = 'B-';
  else if (this.totalScore >= 65) this.letterGrade = 'C+';
  else if (this.totalScore >= 60) this.letterGrade = 'C';
  else if (this.totalScore >= 55) this.letterGrade = 'C-';
  else if (this.totalScore >= 50) this.letterGrade = 'D';
  else this.letterGrade = 'F';
  
  // Calculate GPA
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D': 1.0, 'F': 0.0, 'I': 0.0, 'W': 0.0
  };
  this.gpa = gradePoints[this.letterGrade] || 0;
  
  next();
});

// Compound index for unique constraint
gradeSchema.index({ student: 1, subject: 1, semester: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
