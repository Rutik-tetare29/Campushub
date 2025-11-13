const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, permit } = require('../middleware/auth');
const Upload = require('../models/Upload');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all uploads
router.get('/', auth, async (req, res) => {
  try {
    const uploads = await Upload.find()
      .populate('uploadedBy', 'name email role')
      .sort({ uploadedAt: -1 });
    res.json(uploads);
  } catch (err) {
    console.error('Get uploads error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// upload file (students & teachers)
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Save upload info to database
    const uploadDoc = new Upload({
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: fileUrl,
      uploadedBy: req.user._id,
      size: req.file.size,
      mimeType: req.file.mimetype
    });
    await uploadDoc.save();
    
    // emit a socket notification
    req.io.emit('file_uploaded', { 
      filename: req.file.originalname, 
      url: fileUrl, 
      uploadedBy: req.user.name 
    });
    
    res.json({ 
      filename: req.file.filename, 
      originalName: req.file.originalname,
      url: fileUrl,
      id: uploadDoc._id
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete uploaded file (admin only)
router.delete('/:id', auth, permit('admin'), async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    
    if (!upload) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Delete file from disk
    const filePath = path.join(uploadsDir, upload.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    await Upload.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
