const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  teacherUsername: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  className: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  students: [
    {
      name: String,
      email: String,
      rollNumber: String,
    },
  ],
  courses: [
    {
      name: String,
      description: String,
      schedule: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Classroom', classroomSchema);
