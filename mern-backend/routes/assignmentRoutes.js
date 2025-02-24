const express = require('express');
const Assignment = require('../models/assignment.model');

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { title, description, dueDate, courseId } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ error: 'Title and courseId are required' });
    }

    const newAssignment = new Assignment({ title, description, dueDate, courseId });
    await newAssignment.save();

    res.status(201).json({ message: 'Assignment created successfully', assignment: newAssignment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Get all assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await Assignment.find();
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get assignments by course ID
router.get('/course/:courseId', async (req, res) => {
  try {
    const assignments = await Assignment.find({ courseId: req.params.courseId });

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'No assignments found for this course' });
    }

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get a single assignment by ID
router.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// UpdaTE ASSIGNMENT
router.put('/update/:id', async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { title, description, dueDate },
      { new: true }
    );

    if (!updatedAssignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.status(200).json({ message: 'Assignment updated successfully', assignment: updatedAssignment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment
router.delete('/:id', async (req, res) => {
  try {
    const deletedAssignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!deletedAssignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;
