const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resource = require('../models/resource');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/resources');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `resource-${uniqueSuffix}${fileExtension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Office documents, TXT, ZIP and RAR files are allowed.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// POST /api/resources - Upload a new resource
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, description, userId } = req.body;
    
    // Validate required fields
    const errors = [];
    if (!title) errors.push('Title is required');
    if (!description) errors.push('Description is required');
    if (!userId) errors.push('User ID is required');
    if (!req.file) errors.push('File is required');

    if (errors.length > 0) {
      // Clean up uploaded file if it exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/resources/${req.file.filename}`;
    
    const resource = new Resource({
      title,
      description,
      userId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileUrl
    });

    await resource.save();
    
    res.status(201).json({
      message: 'Resource uploaded successfully',
      resource
    });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/resources - Get all resources
router.get('/', async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
