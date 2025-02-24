const express = require("express");
const Course = require("../../models/course.model"); 
const router = express.Router();

// Get all courses for students
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find(); // Fetch all courses
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses", error });
  }
});

module.exports = router;
