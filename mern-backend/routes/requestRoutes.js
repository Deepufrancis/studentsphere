const express = require('express');
const Registration = require('../models/registration.model');
const router = express.Router();

// 📌 Request a Course
router.post('/request', async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    if (!courseId || !studentId) {
      return res.status(400).json({ message: "Course ID and Student ID are required" });
    }

    // Check if the request already exists
    const existingRequest = await Registration.findOne({ courseId, studentId });
    if (existingRequest) {
      return res.status(400).json({ message: "You have already requested this course" });
    }

    // Save new request
    const newRequest = new Registration({ courseId, studentId });
    await newRequest.save();

    res.status(201).json({ message: "Course request submitted", request: newRequest });
  } catch (error) {
    res.status(500).json({ message: "Error requesting course", error });
  }
});

// 📌 Cancel Request
router.post('/cancel', async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    if (!courseId || !studentId) {
      return res.status(400).json({ message: "Course ID and Student ID are required" });
    }

    const deletedRequest = await Registration.findOneAndDelete({ courseId, studentId });
    if (!deletedRequest) {
      return res.status(404).json({ message: "No request found to cancel" });
    }

    res.json({ message: "Course request cancelled" });
  } catch (error) {
    res.status(500).json({ message: "Error canceling request", error });
  }
});

// 📌 Get Requests for a Teacher's Courses
router.get('/requests/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Find courses by the teacher
    const courses = await Course.find({ teacher: teacherId });
    const courseIds = courses.map(course => course._id);

    // Get requests for those courses
    const requests = await Registration.find({ courseId: { $in: courseIds } }).populate('courseId');

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests", error });
  }
});

module.exports = router;
