const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  console.log('Generating token for userId:', userId);
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('Generated token:', token.substring(0, 20) + '...');
  return token;
};

// Check Username Availability
router.get('/check-username', async (req, res) => {
  const { username } = req.query;
  if (!username || username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters long', exists: true });
  }

  try {
    const existingUser = await User.findOne({ username });
    res.json({ exists: !!existingUser });
  } catch (error) {
    res.status(500).json({ message: 'Error checking username', exists: true });
  }
});

// User Registration (Sign Up)
router.post('/signUp', async (req, res) => {
  try {
    const { username, password, role, email } = req.body;

    // Validate required fields
    if (!username || !password || !role || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Create user (storing plain-text password)
    const newUser = new User({ username, password, role, email });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    console.log('========== Login Request ==========');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { username, password, role } = req.body;
    console.log('Extracted credentials:', {
      username,
      passwordLength: password ? password.length : 0,
      role
    });
    
    const user = await User.findOne({ username, role });
    console.log('Database query result:', {
      userFound: !!user,
      userId: user ? user._id : null,
      userRole: user ? user.role : null
    });

    if (!user || user.password !== password) {
      console.log('Authentication failed:', {
        userExists: !!user,
        passwordMatch: user ? user.password === password : false
      });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id);
    console.log('Authentication successful');
    console.log('========== End Login Request ==========');

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
