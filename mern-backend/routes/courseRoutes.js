const express = require('express');
const Course = require('../models/course.model');
const router = express.Router();

// Add Course
router.post('/', async (req, res) => {
  const newCourse = new Course(req.body);
  await newCourse.save();
  res.status(201).json(newCourse);
});

// Get All Courses
router.get('/', async (req, res) => {
  const courses = await Course.find();
  res.status(200).json(courses);
});

// Delete Course (Newly Added)
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id.trim(); // ✅ Remove spaces and newlines

    // ✅ Check if the ID is a valid MongoDB ObjectId (24 characters, hex)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const { courseName, description } = req.body;
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { courseName, description },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


module.exports = router;
