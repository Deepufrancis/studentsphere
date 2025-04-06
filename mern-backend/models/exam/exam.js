const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  duration: Number,
  courseId: mongoose.Schema.Types.ObjectId,
  teacherUsername: String,
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
});

module.exports = mongoose.model('Exam', examSchema);
