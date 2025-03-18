const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Assignment', 
    required: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['submitted', 'graded', 'late', 'rejected'],
    default: 'submitted' 
  },
  grade: {
    type: Number
  },
  feedback: {
    type: String
  }
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;