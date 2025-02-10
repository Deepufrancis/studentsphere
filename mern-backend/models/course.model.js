const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  description: { type: String, required: true },
  teacher: { type: String, required: true }, // Store the teacher's username
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
