const express = require('express');
const router = express.Router();
const { auth, permit } = require('../middleware/auth');
const User = require('../models/User');
const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const csvParser = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/csv/' });

/**
 * @route   POST /api/bulk/users/import
 * @desc    Bulk import users from CSV
 * @access  Admin only
 */
router.post('/users/import', auth, permit('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const users = [];
    const errors = [];
    let lineNumber = 0;

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (row) => {
          lineNumber++;
          try {
            // Validate required fields
            if (!row.name || !row.email || !row.role) {
              errors.push({ line: lineNumber, error: 'Missing required fields (name, email, role)' });
              return;
            }

            // Validate role
            if (!['student', 'teacher', 'admin'].includes(row.role)) {
              errors.push({ line: lineNumber, error: 'Invalid role' });
              return;
            }

            users.push({
              name: row.name,
              email: row.email,
              password: row.password || 'defaultPassword123', // Will be hashed
              role: row.role,
              phone: row.phone || '',
              department: row.department || '',
              studentId: row.studentId || undefined,
              employeeId: row.employeeId || undefined,
              semester: row.semester ? parseInt(row.semester) : undefined,
              enrollmentYear: row.enrollmentYear ? parseInt(row.enrollmentYear) : undefined,
              designation: row.designation || undefined,
              specialization: row.specialization || undefined
            });
          } catch (error) {
            errors.push({ line: lineNumber, error: error.message });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Delete uploaded file
    fs.unlinkSync(req.file.path);

    if (users.length === 0) {
      return res.status(400).json({ 
        message: 'No valid users found in CSV', 
        errors 
      });
    }

    // Bulk insert users (pre-save hooks will hash passwords)
    const insertedUsers = [];
    const insertErrors = [];

    for (const userData of users) {
      try {
        const user = new User(userData);
        await user.save();
        insertedUsers.push(user);
      } catch (error) {
        insertErrors.push({ 
          email: userData.email, 
          error: error.message 
        });
      }
    }

    res.json({
      message: 'Bulk import completed',
      imported: insertedUsers.length,
      failed: insertErrors.length,
      errors: [...errors, ...insertErrors]
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Server error during bulk import' });
  }
});

/**
 * @route   POST /api/bulk/students
 * @desc    Batch create students
 * @access  Admin only
 */
router.post('/students', auth, permit('admin'), async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Students array is required' });
    }

    const createdStudents = [];
    const errors = [];

    for (const studentData of students) {
      try {
        const student = new User({
          ...studentData,
          role: 'student',
          password: studentData.password || 'student123'
        });
        await student.save();
        createdStudents.push(student);
      } catch (error) {
        errors.push({
          email: studentData.email,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Batch student creation completed',
      created: createdStudents.length,
      failed: errors.length,
      errors
    });
  } catch (error) {
    console.error('Batch create students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/bulk/grades/import
 * @desc    Bulk import grades from CSV
 * @access  Teacher, Admin
 */
router.post('/grades/import', auth, permit('teacher', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const grades = [];
    const errors = [];
    let lineNumber = 0;

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (row) => {
          lineNumber++;
          try {
            // Validate required fields
            if (!row.studentId || !row.subjectId) {
              errors.push({ line: lineNumber, error: 'Missing studentId or subjectId' });
              return;
            }

            grades.push({
              student: row.studentId,
              subject: row.subjectId,
              assignments: parseFloat(row.assignments) || 0,
              midterm: parseFloat(row.midterm) || 0,
              final: parseFloat(row.final) || 0,
              semester: parseInt(row.semester) || 1,
              academicYear: row.academicYear || new Date().getFullYear().toString()
            });
          } catch (error) {
            errors.push({ line: lineNumber, error: error.message });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Delete uploaded file
    fs.unlinkSync(req.file.path);

    if (grades.length === 0) {
      return res.status(400).json({ 
        message: 'No valid grades found in CSV', 
        errors 
      });
    }

    // Bulk insert or update grades
    const insertedGrades = [];
    const insertErrors = [];

    for (const gradeData of grades) {
      try {
        // Check if grade already exists
        const existingGrade = await Grade.findOne({
          student: gradeData.student,
          subject: gradeData.subject,
          semester: gradeData.semester,
          academicYear: gradeData.academicYear
        });

        if (existingGrade) {
          // Update existing grade
          Object.assign(existingGrade, gradeData);
          await existingGrade.save();
          insertedGrades.push(existingGrade);
        } else {
          // Create new grade
          const grade = new Grade(gradeData);
          await grade.save();
          insertedGrades.push(grade);
        }
      } catch (error) {
        insertErrors.push({ 
          studentId: gradeData.student, 
          subjectId: gradeData.subject,
          error: error.message 
        });
      }
    }

    res.json({
      message: 'Bulk grade import completed',
      imported: insertedGrades.length,
      failed: insertErrors.length,
      errors: [...errors, ...insertErrors]
    });
  } catch (error) {
    console.error('Bulk grade import error:', error);
    res.status(500).json({ message: 'Server error during grade import' });
  }
});

/**
 * @route   GET /api/bulk/users/export
 * @desc    Export all users to CSV
 * @access  Admin only
 */
router.get('/users/export', auth, permit('admin'), async (req, res) => {
  try {
    const { role } = req.query;

    const query = role ? { role } : {};
    const users = await User.find(query).select('-password');

    // Create CSV file
    const fileName = `users_export_${Date.now()}.csv`;
    const filePath = path.join('uploads', 'exports', fileName);

    // Ensure exports directory exists
    if (!fs.existsSync(path.join('uploads', 'exports'))) {
      fs.mkdirSync(path.join('uploads', 'exports'), { recursive: true });
    }

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'role', title: 'Role' },
        { id: 'phone', title: 'Phone' },
        { id: 'department', title: 'Department' },
        { id: 'studentId', title: 'Student ID' },
        { id: 'employeeId', title: 'Employee ID' },
        { id: 'semester', title: 'Semester' },
        { id: 'enrollmentYear', title: 'Enrollment Year' },
        { id: 'designation', title: 'Designation' },
        { id: 'specialization', title: 'Specialization' }
      ]
    });

    await csvWriter.writeRecords(users);

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Delete file after download
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ message: 'Server error during export' });
  }
});

/**
 * @route   GET /api/bulk/grades/export
 * @desc    Export grades to CSV
 * @access  Teacher, Admin
 */
router.get('/grades/export', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const { subjectId, semester, academicYear } = req.query;

    const query = {};
    if (subjectId) query.subject = subjectId;
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;

    // If teacher, only export their subjects
    if (req.user.role === 'teacher') {
      const subjects = await Subject.find({ teacher: req.user._id });
      const subjectIds = subjects.map(s => s._id);
      query.subject = { $in: subjectIds };
    }

    const grades = await Grade.find(query)
      .populate('student', 'name email studentId')
      .populate('subject', 'name code');

    // Create CSV file
    const fileName = `grades_export_${Date.now()}.csv`;
    const filePath = path.join('uploads', 'exports', fileName);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'studentName', title: 'Student Name' },
        { id: 'studentEmail', title: 'Student Email' },
        { id: 'studentId', title: 'Student ID' },
        { id: 'subjectName', title: 'Subject' },
        { id: 'subjectCode', title: 'Subject Code' },
        { id: 'assignments', title: 'Assignments' },
        { id: 'midterm', title: 'Midterm' },
        { id: 'final', title: 'Final' },
        { id: 'totalScore', title: 'Total' },
        { id: 'letterGrade', title: 'Grade' },
        { id: 'gpa', title: 'GPA' },
        { id: 'semester', title: 'Semester' },
        { id: 'academicYear', title: 'Academic Year' }
      ]
    });

    const records = grades.map(grade => ({
      studentName: grade.student?.name || '',
      studentEmail: grade.student?.email || '',
      studentId: grade.student?.studentId || '',
      subjectName: grade.subject?.name || '',
      subjectCode: grade.subject?.code || '',
      assignments: grade.assignments,
      midterm: grade.midterm,
      final: grade.final,
      totalScore: grade.totalScore,
      letterGrade: grade.letterGrade,
      gpa: grade.gpa,
      semester: grade.semester,
      academicYear: grade.academicYear
    }));

    await csvWriter.writeRecords(records);

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Delete file after download
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Export grades error:', error);
    res.status(500).json({ message: 'Server error during export' });
  }
});

/**
 * @route   DELETE /api/bulk/users
 * @desc    Bulk delete users
 * @access  Admin only
 */
router.delete('/users', auth, permit('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    // Prevent deleting yourself
    if (userIds.includes(req.user._id.toString())) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.json({
      message: 'Bulk delete completed',
      deleted: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
