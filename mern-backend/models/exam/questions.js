const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  questionText: String,
  type: { type: String, enum: ['mcq', 'short'] },
  options: [String],
  correctAnswer: String,
  marks: Number
});

module.exports = mongoose.model('Question', questionSchema);
