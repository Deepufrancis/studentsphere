import express from "express";
import Comment from "../models/Comment.js";

const router = express.Router();

// Get comments for an assignment
router.get("/:assignmentId/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ assignmentId: req.params.assignmentId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Post a comment
router.post("/:assignmentId/comments", async (req, res) => {
  const { user, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
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

export default router;
