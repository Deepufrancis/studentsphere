const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Assignment = require('../models/assignment.model');
const Submission = require('../models/submission.model'); // Import the new model
const fs = require('fs');

// Setup multer storage configuration
const uploadDir = 'uploads/submissions';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.zip', '.rar'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only document, archive and text files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB file size limit
});

// Upload a submission for an assignment
router.post('/:assignmentId', upload.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { userId } = req.body;
    
    // Validate required fields
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Create file URL
    const fileUrl = `/uploads/submissions/${req.file.filename}`;
    
    // Check if submission already exists for this user and assignment
    let submission = await Submission.findOne({ 
      assignmentId: assignmentId,
      userId: userId
    });
    
    if (submission) {
      // Update existing submission
      const oldFileUrl = submission.fileUrl;
      
      submission.fileUrl = fileUrl;
      submission.fileName = req.file.originalname;
      submission.submittedAt = new Date();
      submission.status = 'submitted';
      
      await submission.save();
      
      // Delete the old file if it exists
      const oldFilePath = path.join(__dirname, '..', oldFileUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      
      res.status(200).json({
        message: 'Submission updated successfully',
        submission
      });
    } else {
      // Create new submission
      submission = new Submission({
        assignmentId: assignmentId,
        userId: userId,
        fileUrl: fileUrl,
        fileName: req.file.originalname
      });
      
      await submission.save();
      
      res.status(201).json({
        message: 'Submission created successfully',
        submission
      });
    }
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to process submission', details: error.message });
  }
});

// Get all submissions for an assignment
router.get('/assignment/:assignmentId', async (req, res) => {
  try {
    const submissions = await Submission.find({ assignmentId: req.params.assignmentId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get submissions by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.params.userId });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get a specific submission
router.get('/:submissionId', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Delete a submission
router.delete('/:submissionId', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Delete the file
    const filePath = path.join(__dirname, '..', submission.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete the submission record
    await Submission.findByIdAndDelete(req.params.submissionId);
    
    res.status(200).json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// Grade a submission
router.put('/:submissionId/grade', async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    
    if (grade === undefined) {
      return res.status(400).json({ error: 'Grade is required' });
    }
    
    const submission = await Submission.findByIdAndUpdate(
      req.params.submissionId,
      { 
        grade, 
        feedback, 
        status: 'graded' 
      },
      { new: true }
    );
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.status(200).json({
      message: 'Submission graded successfully',
      submission
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

module.exports = router;