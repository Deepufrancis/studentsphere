const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load .env variables

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = { generateToken };
