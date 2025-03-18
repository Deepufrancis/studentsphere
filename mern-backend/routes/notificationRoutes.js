const express = require("express");
const Notification = require("../models/notification");

const router = express.Router();

router.get("/:studentId", async (req, res) => {
  try {
    const notifications = await Notification.find({ studentId: req.params.studentId });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
