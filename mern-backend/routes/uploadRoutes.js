// routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const Upload = require('../models/upload');
const fs = require('fs');

const router = express.Router();

// Ensure 'uploads/' folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'), false);
    }
  }
});

// POST /api/upload
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const newUpload = new Upload({
      filename: req.file.filename,
      filepath: req.file.path
    });
    await newUpload.save();
    res.status(200).json({ message: 'File uploaded successfully', file: newUpload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload - Get all uploads
router.get('/', async (req, res) => {
  try {
    const uploads = await Upload.find().sort({ uploadedAt: -1 });
    res.status(200).json(uploads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/:id - Get a specific file
router.get('/:id', async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.sendFile(path.resolve(upload.filepath));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
