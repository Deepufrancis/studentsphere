const express = require('express');
const mongoose = require('mongoose');
const Attendance = require('../models/attendance');
const Course = require('../models/course.model');
const User = require('../models/User');  // Assuming User model stores both students and teachers
const router = express.Router();

// Route to mark attendance for all students in a specific course on a specific date
router.post('/markAll/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const { date, status } = req.body; // 'present' or 'absent'
  
  if (!date || !status) {
    return res.status(400).json({ message: 'Date and status are required.' });
  }

  try {
    const course = await Course.findById(courseId).populate('students');
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Prepare attendance data for all students
    const attendanceData = course.students.map((student) => ({
      course: courseId,
      student: student._id,
      date: new Date(date),
      status: status === 'present', // If present, true, else false
    }));

    // Insert attendance records for all students
    await Attendance.insertMany(attendanceData);
    return res.status(200).json({ message: 'Attendance marked for all students.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error marking attendance for all students.', error });
  }
});

// Route to mark attendance for a single student on a specific date
router.post('/mark/:courseId/:studentId', async (req, res) => {
  const { courseId, studentId } = req.params;
  const { date, status } = req.body; // 'present' or 'absent'

  if (!date || !status) {
    return res.status(400).json({ message: 'Date and status are required.' });
  }

  try {
    const course = await Course.findById(courseId);
    const student = await User.findById(studentId);
    if (!course || !student) {
      return res.status(404).json({ message: 'Course or Student not found.' });
    }

    // Check if attendance already exists for the given date and student
    const existingAttendance = await Attendance.findOne({ 
      course: courseId,
      student: studentId,
      date: new Date(date),
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance for this date has already been recorded.' });
    }

    // Create attendance entry for the student
    const attendance = new Attendance({
      course: courseId,
      student: studentId,
      date: new Date(date),
      status: status === 'present',
    });

    await attendance.save();
    return res.status(200).json({ message: 'Attendance marked successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error marking attendance.', error });
  }
});

// Route to fetch attendance of a student for a specific course on a specific date
router.get('/:courseId/:studentId', async (req, res) => {
  const { courseId, studentId } = req.params;
  const { date } = req.query;  // Expected format: 'YYYY-MM-DD'

  if (!date) {
    return res.status(400).json({ message: 'Date is required.' });
  }

  try {
    const attendanceDate = new Date(date);

    // Fetch attendance for the student, course, and date
    const attendance = await Attendance.findOne({
      course: courseId,
      student: studentId,
      date: attendanceDate,
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found for the specified date.' });
    }

    return res.status(200).json({
      status: attendance.status ? 'Present' : 'Absent',
      date: attendance.date.toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving attendance.', error });
  }
});

// Route to fetch all attendance for a specific student (for all courses)
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const attendance = await Attendance.find({ student: studentId }).populate('course');
    if (!attendance) {
      return res.status(404).json({ message: 'No attendance records found for this student.' });
    }

    const formattedAttendance = attendance.map((att) => ({
      courseName: att.course.courseName,
      date: att.date.toISOString(),
      status: att.status ? 'Present' : 'Absent',
    }));

    return res.status(200).json(formattedAttendance);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving attendance.', error });
  }
});

// Route to fetch all attendance for a specific course (for all students)
router.get('/course/:courseId', async (req, res) => {
  const { courseId } = req.params;

  try {
    const attendance = await Attendance.find({ course: courseId }).populate('student');
    if (!attendance) {
      return res.status(404).json({ message: 'No attendance records found for this course.' });
    }

    const formattedAttendance = attendance.map((att) => ({
      studentUsername: att.student.username,
      date: att.date.toISOString(),
      status: att.status ? 'Present' : 'Absent',
    }));

    return res.status(200).json(formattedAttendance);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving attendance.', error });
  }
});

module.exports = router;
