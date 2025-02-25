const express = require("express");
const Registration = require("../../models/registration.model");
const router = express.Router();

// Register a student for a course
router.post("/register/:courseId", async (req, res) => {
  try {
    const { studentId } = req.body; // Ensure studentId is sent in the request
    const { courseId } = req.params;

    if (!studentId) return res.status(400).json({ message: "Student ID is required" });

    const existingRegistration = await Registration.findOne({ student: studentId, course: courseId });
    if (existingRegistration) return res.status(400).json({ message: "Already registered" });

    const newRegistration = new Registration({ student: studentId, course: courseId });
    await newRegistration.save();

    res.status(201).json({ message: "Registration request sent successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Unregister a student from a course
router.post("/unregister/:courseId", async (req, res) => {
  try {
    const { studentId } = req.body;
    const { courseId } = req.params;

    if (!studentId) return res.status(400).json({ message: "Student ID is required" });

    const deleted = await Registration.findOneAndDelete({ student: studentId, course: courseId });
    if (!deleted) return res.status(400).json({ message: "Not registered for this course" });

    res.status(200).json({ message: "Unregistered successfully" });
  } catch (error) {
    console.error("Unregistration Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
