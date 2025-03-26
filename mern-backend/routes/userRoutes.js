const express = require("express");
const User = require("../models/User"); // Adjust the path if needed

const router = express.Router();

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "username role"); // Fetch only username and role
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

// GET teachers
router.get("/teachers", async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }, "username role");
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teachers", error });
  }
});

// GET students
router.get("/students", async (req, res) => {
  try {
    const students = await User.find({ role: "student" }, "username role");
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error });
  }
});

module.exports = router;
