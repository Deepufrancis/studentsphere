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

// Add this route before the post route
router.get('/assignments/:assignmentId/user/:userId', async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignmentId: req.params.assignmentId,
      userId: req.params.userId
    });
    
    if (submission) {
      res.json({
        uploaded: true,
        submittedAt: submission.submittedAt,
        fileName: submission.fileName,
        fileUrl: `${process.env.API_BASE_URL}${submission.fileUrl}`
      });
    } else {
      res.json({ uploaded: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to check submission status' });
  }
});

// Upload a submission for an assignment
router.post('/:assignmentId', upload.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { userId } = req.body;
    
    if (!req.file || !userId) {
      return res.status(400).json({ error: 'File and userId are required' });
    }
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Fix: Create relative file URL for database storage
    const fileUrlForDb = `/uploads/submissions/${req.file.filename}`;
    
    let submission = await Submission.findOne({ 
      assignmentId,
      userId
    });
    
    if (submission) {
      // Fix: Get correct old file path
      const oldFilePath = path.join(__dirname, '..', 'uploads', 'submissions', path.basename(submission.fileUrl));
      
      submission.fileUrl = fileUrlForDb;
      submission.fileName = req.file.originalname;
      submission.submittedAt = new Date();
      
      await submission.save();
      
      // Delete old file if exists
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    } else {
      submission = new Submission({
        assignmentId,
        userId,
        fileUrl: fileUrlForDb,
        fileName: req.file.originalname,
        submittedAt: new Date()
      });
      
      await submission.save();
    }
    
    // Return absolute URL in response
    const fullFileUrl = `${process.env.API_BASE_URL}${fileUrlForDb}`;
    
    res.status(submission ? 200 : 201).json({
      message: `Submission ${submission ? 'updated' : 'created'} successfully`,
      submission: {
        ...submission.toObject(),
        fileUrl: fullFileUrl
      }
    });
    
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

// Replace an existing submission
router.put('/:assignmentId/replace', upload.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { userId } = req.body;
    
    if (!req.file || !userId) {
      return res.status(400).json({ error: 'File and userId are required' });
    }

    const existingSubmission = await Submission.findOne({ 
      assignmentId,
      userId
    });

    if (!existingSubmission) {
      return res.status(404).json({ error: 'No existing submission found' });
    }

    // Delete old file
    const oldFilePath = path.join(__dirname, '..', 'uploads', 'submissions', path.basename(existingSubmission.fileUrl));
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    // Update with new file
    const fileUrlForDb = `/uploads/submissions/${req.file.filename}`;
    existingSubmission.fileUrl = fileUrlForDb;
    existingSubmission.fileName = req.file.originalname;
    existingSubmission.submittedAt = new Date();
    
    await existingSubmission.save();

    const fullFileUrl = `${process.env.API_BASE_URL}${fileUrlForDb}`;
    
    res.status(200).json({
      message: 'Submission replaced successfully',
      submission: {
        ...existingSubmission.toObject(),
        fileUrl: fullFileUrl
      }
    });
    
  } catch (error) {
    console.error('Replacement error:', error);
    res.status(500).json({ error: 'Failed to replace submission' });
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
  console.log("download")
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