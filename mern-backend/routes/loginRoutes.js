const express = require('express');
const router = express.Router();

// Dummy user data (replace with MongoDB or any other database)
const users = [
  { username: 'teacher1', password: 'password1', role: 'teacher' },
  { username: 'student1', password: 'password1', role: 'student' },
];

// Login route to authenticate user based on role
router.post('/', (req, res) => {
  const { username, password, role } = req.body;

  // Find user matching credentials and role
  const user = users.find(
    (user) => user.username === username && user.password === password && user.role === role
  );

  if (user) {
    res.status(200).json({ message: 'Login successful', user });
  } else {
    res.status(401).json({ message: 'Invalid credentials or role' });
  }
});

module.exports = router;
