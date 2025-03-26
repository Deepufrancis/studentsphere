const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true },
    remarks: { type: String } // Optional field for comments
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
