const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// POST: Add a new course
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const newCourse = new Course({ name, description });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update a course
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { name, description },
      { new: true, runValidators: true }  // Return updated document & validate
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Remove a course
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
