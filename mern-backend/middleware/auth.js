const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(403).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

//to check whether user is teacher or not
const teacherAuth = (req, res, next) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Only teachers allowed.' });
    }
    next();
  };
  

module.exports = { verifyToken };
