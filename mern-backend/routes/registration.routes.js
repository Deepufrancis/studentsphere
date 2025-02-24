const express = require("express");
const Registration = require("../models/registration.model");
const router = express.Router();

// Register for a Course
router.post("/", async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ message: "Student ID and Course ID are required" });
    }

    const existingRegistration = await Registration.findOne({ studentId, courseId });
    if (existingRegistration) {
      return res.status(400).json({ message: "Already registered for this course" });
    }

    const newRegistration = new Registration({ studentId, courseId });
    await newRegistration.save();
    res.status(201).json({ message: "Registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering for course", error });
  }
});

// Cancel Course Registration
router.delete("/:courseId/:studentId", async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const registration = await Registration.findOneAndDelete({ studentId, courseId });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    res.json({ message: "Registration canceled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error canceling registration", error });
  }
});

// Get Student's Registered Courses
router.get("/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const registrations = await Registration.find({ studentId });

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching registrations", error });
  }
});

module.exports = router;
