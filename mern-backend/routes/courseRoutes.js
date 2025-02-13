const express = require('express');
const Course = require('../models/course.model');
const router = express.Router();

// Add Course
router.post('/', async (req, res) => {
  try {
    const { courseName, description, teacher } = req.body;

    if (!courseName || !teacher) {
      return res.status(400).json({ message: "Course name and teacher are required" });
    }

    const newCourse = new Course({ courseName, description, teacher });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: "Error adding course", error });
  }
});

// Get Courses (Filtered by Teacher)
router.get('/', async (req, res) => {
  try {
    const { teacher } = req.query; // Get teacher from query params

    const filter = teacher ? { teacher } : {}; // Filter courses if teacher exists
    const courses = await Course.find(filter);

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses", error });
  }
});

// Update Course
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

// Delete Course
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id.trim();

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


module.exports = router;

