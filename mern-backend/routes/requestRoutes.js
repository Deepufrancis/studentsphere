const express = require('express');
const Registration = require('../models/registration.model');
const Course = require('../models/course.model'); // Ensure you have this model
const router = express.Router();

router.get('/pending/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;

        // Fetch courses created by the teacher
        const teacherCourses = await Course.find({ teacher: teacherId });

        if (!teacherCourses.length) {
            return res.status(404).json({ message: "No courses found for this teacher" });
        }

        const courseIds = teacherCourses.map(course => course._id);

        // Find pending requests for the teacher's courses
        const pendingRequests = await Registration.find({
            courseId: { $in: courseIds },
            status: "pending"
        }).populate("studentId", "username"); // Assuming studentId references User

        res.json(pendingRequests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching requests", error });
    }
});

module.exports = router;
