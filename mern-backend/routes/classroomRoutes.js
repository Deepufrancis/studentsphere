const express = require('express');
const router = express.Router();
const Classroom = require('../models/classroom');
const User = require('../models/User');

// Create classroom with student list
router.post('/create', async (req, res) => {
  try {
    const { teacherUsername, className, section, students } = req.body;

    // Find the teacher user first
    const teacher = await User.findOne({ username: teacherUsername, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const newClassroom = new Classroom({
      teacherUsername: teacher._id,
      className,
      section,
      students: students || [],
    });

    const savedClassroom = await newClassroom.save();
    res.status(201).json(savedClassroom);
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all classrooms for a teacher
router.get('/:teacherUsername', async (req, res) => {
  try {
    const { teacherUsername } = req.params;
    const teacher = await User.findOne({ username: teacherUsername, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const classrooms = await Classroom.find({ teacherUsername: teacher._id })
      .populate('teacherUsername', 'username email');
    res.json(classrooms);
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit classroom
router.put('/edit/:id', async (req, res) => {
  try {
    const { className, section, students } = req.body;
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      { className, section, students },
      { new: true }
    ).populate('teacherUsername', 'username email');
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    res.json(classroom);
  } catch (error) {
    console.error('Error updating classroom:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single classroom details
router.get('/details/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('teacherUsername', 'username email');
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    res.json(classroom);
  } catch (error) {
    console.error('Error fetching classroom details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add/Update courses for a classroom
router.put('/courses/:id', async (req, res) => {
  try {
    const { courses } = req.body;
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      { courses },
      { new: true }
    ).populate('teacherUsername', 'username email');
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    res.json(classroom);
  } catch (error) {
    console.error('Error updating courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
