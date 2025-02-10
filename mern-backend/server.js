const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors=require('cors');
const courseRoutes = require(path.join(__dirname, 'routes', 'courseRoutes'));
const authRoutes = require('./routes/authRoutes');



const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json()); 


mongoose.connect('mongodb://localhost:27017/student-sphere', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));


app.use('/api/courses', courseRoutes); 
app.use('/api', authRoutes);


app.get('/', (req, res) => {
  res.send('Server is working!');
});


app.listen(5000, () => console.log('Server running on port 5000'));