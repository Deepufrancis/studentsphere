const express = require("express");
const User = require("../models/User"); // Adjust the path if needed

const router = express.Router();

// Increase payload limit for this route
router.use(express.json({ limit: '100mb', parameterLimit: 100000 }));
router.use(express.urlencoded({ limit: '100mb', extended: true, parameterLimit: 100000 }));

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

//fetch userdb by username
router.get("/profile", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Username is required" });

    const user = await User.findOne({ username }).populate("courses");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update user details
router.put("/update/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { email, newUsername } = req.body;
    const updateFields = {};

    if (email) updateFields.email = email;
    if (newUsername) {
      // Check if new username already exists
      const existingUser = await User.findOne({ username: newUsername });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      updateFields.username = newUsername;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
});

// PUT update profile picture
router.put("/profile-picture/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image data is required" });
    }

    // Check if the imageUrl is a valid data URI
    if (!imageUrl.startsWith('data:image/')) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    // Size check after data:image/ prefix
    const base64Length = imageUrl.split(',')[1].length;
    if (base64Length > 10000000) {
      return res.status(413).json({ message: "Image size too large. Please choose a smaller image." });
    }

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { $set: { profilePicture: imageUrl } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile picture", error: error.message });
  }
});

// DELETE profile picture
router.delete("/profile-picture/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { $set: { profilePicture: null } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error deleting profile picture", error: error.message });
  }
});

module.exports = router;
