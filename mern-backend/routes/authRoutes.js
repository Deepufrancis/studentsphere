const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Ensure this model exists

// Test Route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.send('Auth Route is working!');
});

// Signup Route
router.post('/signup', async (req, res) => {
  console.log('Signup route hit');
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    const newUser = new User({ username, password, role });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user.', error: error.message });
  }
});

module.exports = router;
