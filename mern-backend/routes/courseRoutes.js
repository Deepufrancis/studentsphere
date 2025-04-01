const express = require('express');
const mongoose=require('mongoose')
const Course = require('../models/course.model');
const router = express.Router();


/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private
 * @params  {courseName, description, teacher} - Request body
 * @returns Created course object
 */
router.post('/',async (req, res) => {
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

/**
 * @route   GET /api/courses
 * @desc    Get all courses or filter by teacher
 * @access  Public
 * @query   {teacher} - Optional query parameter to filter by teacher
 * @returns Array of course objects
 */
router.get('/', async (req, res) => {
  try {
    const { teacher } = req.query;

    const filter = teacher ? { teacher } : {}; 
    const courses = await Course.find(filter);

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses", error });
  }
});

/**
 * @route   PUT /api/courses/:id
 * @desc    Update a course by ID
 * @access  Private
 * @params  {id} - Course ID
 * @body    {courseName, description} - Fields to update
 * @returns Updated course object
 */
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

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course by ID
 * @access  Private
 * @params  {id} - Course ID
 * @returns Success message
 */
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

/**
 * @route   GET /api/courses/:id
 * @desc    Get a single course by ID
 * @access  Public
 * @params  {id} - Course ID
 * @returns Course object
 */
router.get("/:id", async (req, res) => {
  const courseId = req.params.id;
  

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ error: "Invalid Course ID" });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports=router;

