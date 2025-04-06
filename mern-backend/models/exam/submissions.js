const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  studentId: String,
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      answer: String,
      obtainedMarks: Number
    }
  ],
  submittedAt: { type: Date, default: Date.now },
  totalMarks: Number,
  graded: { type: Boolean, default: false }
});

module.exports = mongoose.model('Submission', submissionSchema);
