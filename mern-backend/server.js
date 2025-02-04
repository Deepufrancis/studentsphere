const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());  // Enable cross-origin requests from the frontend
app.use(express.json());  // Parse JSON data in request body

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/student_sphere', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Sample route to test connection
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
