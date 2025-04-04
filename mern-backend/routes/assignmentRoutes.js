const express = require('express');
const Assignment = require('../models/assignment.model');
const Comment=require('../models/Comment');
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
router.put("/:id", async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { title, description, dueDate },
      { new: true }
    );

    if (!updatedAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(updatedAssignment);
  } catch (error) {
    res.status(500).json({ message: "Error updating assignment", error });
  }
});
// Delete assignment
router.delete("/:id", async (req, res) => {
  try {
    const deletedAssignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!deletedAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting assignment", error });
  }
});


// Fetch comments for a specific assignment
router.get("/:assignmentId/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ assignmentId: req.params.assignmentId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Add a new comment to an assignment
router.post("/:assignmentId/comments", async (req, res) => {
  const { user, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    // Ensure the assignment exists
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const newComment = new Comment({
      assignmentId: req.params.assignmentId,
      user,
      text,
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//fetch comments
router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ assignmentId: req.params.id }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});




//delete comment api
router.delete("/:assignmentId/comments/:commentId", async (req, res) => {
  const { commentId } = req.params;

  try {
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});




module.exports = router;
