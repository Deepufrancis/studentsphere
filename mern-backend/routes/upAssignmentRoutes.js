const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AssignmentUpload = require('../models/assignmentUploads');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/assignments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `assignment-${req.params.assignmentId}-${req.body.userId}-${uniqueSuffix}${fileExtension}`);
  }
});

// File filter to restrict file types
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

// POST /api/uploads/:assignmentId - Submit a new assignment
router.post('/:assignmentId', upload.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { userId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!userId) {
      // Delete the uploaded file if userId is missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if a submission already exists
    const existingSubmission = await AssignmentUpload.findOne({ 
      assignmentId, 
      userId 
    });

    if (existingSubmission) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(409).json({ 
        error: 'You have already submitted this assignment',
        existingSubmission
      });
    }

    
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/assignments/${req.file.filename}`;
    
    // Create new submission record
    const submission = new AssignmentUpload({
      userId,
      assignmentId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileUrl
    });

    await submission.save();
    
    res.status(201).json({
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/uploads/:assignmentId/replace - Replace an existing submission
router.put('/:assignmentId/replace', upload.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { userId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!userId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find the existing submission
    const existingSubmission = await AssignmentUpload.findOne({ 
      assignmentId, 
      userId 
    });

    if (!existingSubmission) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'No existing submission found to replace' });
    }

    // Delete the old file if it exists
    try {
      if (fs.existsSync(existingSubmission.filePath)) {
        fs.unlinkSync(existingSubmission.filePath);
      }
    } catch (err) {
      console.error('Error deleting previous file:', err);
      // Continue anyway - we'll update the database record
    }

    // Create file URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/assignments/${req.file.filename}`;
    
    // Update submission record
    existingSubmission.fileName = req.file.originalname;
    existingSubmission.filePath = req.file.path;
    existingSubmission.fileUrl = fileUrl;
    existingSubmission.lastUpdated = new Date();
    
    await existingSubmission.save();
    
    res.status(200).json({
      message: 'Assignment submission replaced successfully',
      submission: existingSubmission
    });
  } catch (error) {
    console.error('File replacement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/uploads/assignments/:assignmentId/user/:userId - Check if user has uploaded for an assignment
router.get('/assignments/:assignmentId/user/:userId', async (req, res) => {
  try {
    const { assignmentId, userId } = req.params;
    
    const submission = await AssignmentUpload.findOne({ assignmentId, userId });
    
    if (submission) {
      res.status(200).json({
        uploaded: true,
        submittedAt: submission.submittedAt,
        fileName: submission.fileName,
        fileUrl: submission.fileUrl,
        grade: submission.grade,
        feedback: submission.feedback,
        status: submission.status || 'pending'
      });
    } else {
      res.status(200).json({ uploaded: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/uploads/assignments/:assignmentId - Get all submissions for an assignment
router.get('/assignments/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const submissions = await AssignmentUpload.find({ assignmentId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/uploads/:submissionId - Delete a submission (admin only)
router.delete('/:submissionId', async (req, res) => {
  try {
    const submission = await AssignmentUpload.findById(req.params.submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Delete the file if it exists
    try {
      if (fs.existsSync(submission.filePath)) {
        fs.unlinkSync(submission.filePath);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
    
    await AssignmentUpload.findByIdAndDelete(req.params.submissionId);
    
    res.status(200).json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/uploads/:submissionId - Update grade and feedback for a submission
router.patch('/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback, status } = req.body;
    
    // Validate grade if provided
    if (grade !== undefined) {
      const numericGrade = parseFloat(grade);
      if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
        return res.status(400).json({ error: 'Invalid grade. Must be between 0 and 100.' });
      }
    }
    
    const submission = await AssignmentUpload.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Update fields if they are provided
    if (grade !== undefined) submission.grade = grade;
    if (feedback !== undefined) submission.feedback = feedback;
    if (status !== undefined) submission.status = status;
    
    await submission.save();
    
    res.status(200).json({ 
      message: 'Submission updated successfully',
      submission 
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
