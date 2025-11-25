const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('Registration attempt:', email, 'as', role || 'student');
    
    if (!name || !email || !password) {
      console.log('Missing fields in registration');
      return res.status(400).json({ message: 'Missing fields' });
    }
    
    let user = await User.findOne({ email });
    if (user) {
      console.log('Email already exists:', email);
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashed, role: role || 'student' });
    await user.save();
    console.log('User registered successfully:', email);
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        profileCompleted: user.profileCompleted || false,
        department: user.department,
        semester: user.semester,
        rollNumber: user.rollNumber
      } 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found, checking password...');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('Login successful:', email);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        profileCompleted: user.profileCompleted || false,
        department: user.department,
        semester: user.semester,
        rollNumber: user.rollNumber
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
