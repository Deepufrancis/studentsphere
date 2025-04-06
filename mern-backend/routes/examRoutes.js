const express = require('express');
const router = express.Router();
const Exam = require('../models/exam/exam');

router.post('/create', async (req, res) => {
  try {
    const exam = new Exam({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      duration: req.body.duration,
      courseId: req.body.courseId,
      teacherUsername: req.body.teacherUsername
    });
    
    const savedExam = await exam.save();
    return res.status(201).json(savedExam);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create exam' });
  }
});

router.get('/teacher/:username', async (req, res) => {
  try {
    const exams = await Exam.find({ 
      teacherUsername: req.params.username 
    }).sort({ date: -1 });
    
    return res.status(200).json(exams);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch exams' });
  }
});

// Route to delete an exam by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedExam = await Exam.findByIdAndDelete(req.params.id);
    
    if (!deletedExam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    return res.status(200).json({ message: 'Exam deleted successfully', deletedExam });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete exam' });
  }
});

// Route to update an exam by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        date: req.body.date,
        duration: req.body.duration,
        courseId: req.body.courseId
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedExam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    return res.status(200).json(updatedExam);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update exam' });
  }
});

module.exports = router;