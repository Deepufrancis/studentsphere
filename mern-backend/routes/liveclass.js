const express = require("express");
const router = express.Router();
const LiveClass = require("../models/liveClass");

// Create a new live class session
router.post("/", async (req, res) => {
  try {
    const { courseId, teacher, liveClassLink, scheduledTime } = req.body;
    const newClass = new LiveClass({ courseId, teacher, liveClassLink, scheduledTime });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: "Error creating live class" });
  }
});

// Get all live classes for a teacher
router.get("/:teacher", async (req, res) => {
  try {
    const { teacher } = req.params;
    const liveClasses = await LiveClass.find({ teacher }).populate("courseId");
    res.json(liveClasses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching live classes" });
  }
});

// Edit a live class
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { liveClassLink, scheduledTime } = req.body;
    const updatedClass = await LiveClass.findByIdAndUpdate(
      id,
      { liveClassLink, scheduledTime },
      { new: true }
    ).populate("courseId");
    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ message: "Error updating live class" });
  }
});

// Delete a live class
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await LiveClass.findByIdAndDelete(id);
    res.json({ success: true, message: "Live class deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting live class" });
  }
});

module.exports = router;
