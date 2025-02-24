const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const courseRoutes = require('./routes/courseRoutes');
const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const registrationRoutes = require("./routes/registration.routes");

const studentRoutes = require("./routes/student_routes/s_courseRoutes");




const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect('mongodb://127.0.0.1:27017/student-sphere', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
console.log('Loading routes...');

if (typeof courseRoutes === 'function') {
  app.use('/api/courses', courseRoutes);
} else {
  console.error('Error: courseRoutes is not a valid middleware function.');
}

if (typeof authRoutes === 'function') {
  app.use('/api', authRoutes);
} else {
  console.error('Error: authRoutes is not a valid middleware function.');
}

if (typeof requestRoutes === 'function') {
  app.use('/api/requests', requestRoutes);
} else {
  console.error('Error: requestRoutes is not a valid middleware function.');
}

if (typeof assignmentRoutes === 'function') {
  app.use('/api/assignments', assignmentRoutes);
} else {
  console.error('Error: assignmentRoutes is not a valid middleware function.');
}

console.log('Routes loaded.');

// Test Route
app.get('/', (req, res) => {
  res.send('Server is working!');
});
app.use('/api/students', studentRoutes);
app.use("/api/register", registrationRoutes);





// Start Server
app.listen(5000, () => console.log('Server running on port 5000'));
