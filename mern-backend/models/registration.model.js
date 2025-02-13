const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  studentId: { type: String, required: true }, // Store logged-in student's ID
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

const Registration = mongoose.model('Registration', registrationSchema);
module.exports = Registration;
