const express = require("express");
const Notification = require("../models/notification");

const router = express.Router();

// Get notifications for a student
router.get("/:studentId", async (req, res) => {
  try {
    const notifications = await Notification.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new notification
router.post("/", async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
