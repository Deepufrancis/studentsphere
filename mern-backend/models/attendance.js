const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },  // Date of attendance
  status: { type: Boolean, required: true }, // true for present, false for absent
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
