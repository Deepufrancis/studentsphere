const mongoose = require('mongoose');

const assignmentUploadSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'graded'],
    default: 'pending'
  }
});

// Compound index for quick lookup of user's submission for an assignment.
assignmentUploadSchema.index({ userId: 1, assignmentId: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentUpload', assignmentUploadSchema);
