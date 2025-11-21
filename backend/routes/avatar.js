const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

/**
 * @route   POST /api/avatar/upload
 * @desc    Upload and update user avatar
 * @access  Private
 */
router.post('/upload', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old avatar if exists
    if (user.avatar && user.avatar !== '') {
      const oldAvatarPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Optimize and resize image using sharp
    const optimizedFileName = 'optimized-' + req.file.filename;
    const optimizedPath = path.join('uploads', 'avatars', optimizedFileName);

    await sharp(req.file.path)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    // Delete original uploaded file
    fs.unlinkSync(req.file.path);

    // Update user avatar path in database
    user.avatar = `/uploads/avatars/${optimizedFileName}`;
    await user.save();

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    
    // Clean up uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      message: error.message || 'Server error during avatar upload' 
    });
  }
});

/**
 * @route   DELETE /api/avatar
 * @desc    Remove user avatar
 * @access  Private
 */
router.delete('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete avatar file if exists
    if (user.avatar && user.avatar !== '') {
      const avatarPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Clear avatar in database
    user.avatar = '';
    await user.save();

    res.json({ message: 'Avatar removed successfully' });
  } catch (error) {
    console.error('Avatar removal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/avatar/:userId
 * @desc    Get user avatar
 * @access  Public
 */
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.avatar || user.avatar === '') {
      return res.status(404).json({ message: 'No avatar found' });
    }

    const avatarPath = path.join(__dirname, '..', user.avatar);

    if (!fs.existsSync(avatarPath)) {
      return res.status(404).json({ message: 'Avatar file not found' });
    }

    res.sendFile(avatarPath);
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
