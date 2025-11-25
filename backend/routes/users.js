const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { permit } = require('../middleware/permission');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Complete student profile (required fields)
router.post('/complete-profile', auth, async (req, res) => {
  try {
    const { department, rollNumber, semester } = req.body;
    
    // Only students need to complete profile
    if (req.user.role !== 'student') {
      return res.status(400).json({ message: 'This endpoint is for students only' });
    }
    
    // Validate required fields
    if (!department || !rollNumber || !semester) {
      return res.status(400).json({ message: 'Department, roll number, and semester are required' });
    }
    
    // Check if roll number is already taken
    const existingStudent = await User.findOne({ 
      rollNumber, 
      _id: { $ne: req.user._id } 
    });
    
    if (existingStudent) {
      return res.status(400).json({ message: 'Roll number already exists' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        department,
        rollNumber,
        semester,
        profileCompleted: true
      },
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Complete profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all students (for teachers and admins)
router.get('/students', auth, permit('teacher', 'admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email rollNumber department studentId enrollmentYear semester avatar qrCode qrData qrGeneratedAt qrExpiresAt')
      .sort({ rollNumber: 1, name: 1 });
    
    res.json(students);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Users can only view their own profile unless they're admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile/:id', auth, async (req, res) => {
  try {
    // Users can only update their own profile unless they're admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const {
      name,
      email,
      phone,
      dateOfBirth,
      address,
      bio,
      // Student fields
      studentId,
      enrollmentYear,
      department,
      semester,
      // Teacher fields
      employeeId,
      designation,
      specialization,
      // Admin fields
      adminId
    } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    const updateData = {
      name,
      email,
      phone,
      dateOfBirth,
      address,
      bio
    };
    
    // Add role-specific fields
    const user = await User.findById(req.params.id);
    
    if (user.role === 'student') {
      updateData.studentId = studentId;
      updateData.enrollmentYear = enrollmentYear;
      updateData.department = department;
      updateData.semester = semester;
    } else if (user.role === 'teacher') {
      updateData.employeeId = employeeId;
      updateData.department = department;
      updateData.designation = designation;
      updateData.specialization = specialization;
    } else if (user.role === 'admin') {
      updateData.adminId = adminId;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/password/:id', auth, async (req, res) => {
  try {
    // Users can only change their own password unless they're admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
