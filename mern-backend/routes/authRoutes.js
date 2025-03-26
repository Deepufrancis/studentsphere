const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Check Username Route
router.get('/check-username', async (req, res) => {
  console.log('=== Checking Username Availability ===');
  const { username } = req.query;

  if (!username || username.length < 3) {
    return res.status(400).json({
      message: 'Username must be at least 3 characters long',
      exists: true
    });
  }

  try {
    const existingUser = await User.findOne({ username });
    console.log('Username check result:', {
      username,
      exists: !!existingUser
    });
    
    res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ 
      message: 'Error checking username availability',
      exists: true
    });
  }
});

// Sign Up Route
router.post('/signUp', async (req, res) => {
  console.log('=== Starting SignUp Process ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { username, password, role, email } = req.body;
    
    console.log('Received signup request:', { username, role, email });

    // Validate required fields
    const missingFields = [];
    if (!username) missingFields.push('username');
    if (!password) missingFields.push('password');
    if (!role) missingFields.push('role');
    if (!email) missingFields.push('email');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({ 
        message: 'Username must be at least 3 characters long' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ 
          message: 'Email already registered' 
        });
      }
      return res.status(400).json({ 
        message: 'Username already taken' 
      });
    }

    // Log before user creation
    console.log('Creating new user...');
    const newUser = new User({ username, password, role, email });

    console.log('Attempting to save user:', {
      username,
      email,
      role,
      passwordLength: password.length
    });
    
    try {
      await newUser.save();
      console.log('User creation successful:', {
        userId: newUser._id,
        username: newUser.username,
        role: newUser.role
      });
      res.status(201).json({ message: 'User registered successfully' });
    } catch (dbError) {
      console.error('Database Error Details:', {
        code: dbError.code,
        message: dbError.message,
        keyPattern: dbError.keyPattern
      });
      if (dbError.code === 11000) {
        // Duplicate key error
        return res.status(409).json({ 
          message: 'Username or email already exists',
          field: Object.keys(dbError.keyPattern)[0]
        });
      }
      throw dbError; // Re-throw for general error handling
    }
  } catch (error) {
    console.error('SignUp Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Server error occurred during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  console.log('=== Starting Login Process ===');
  console.log('Login attempt for:', {
    username: req.body.username,
    role: req.body.role
  });
  
  try {
    const { username, password, role } = req.body;

    const user = await User.findOne({ username, password, role });
    console.log('Login query result:', user ? 'User found' : 'User not found');
    
    if (!user) {
      console.log('Login failed: Invalid credentials');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Login successful for user:', {
      userId: user._id,
      username: user.username,
      role: user.role
    });
    res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Login Error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
