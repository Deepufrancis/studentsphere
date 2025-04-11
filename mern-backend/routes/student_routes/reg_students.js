const mongoose = require("mongoose");
const express = require("express");
const registrationModel = require("../../models/registration.model");

const router = express.Router();

router.get("/:courseId/students", async (req, res) => {
    try {
        const { courseId } = req.params;
        const objectId = new mongoose.Types.ObjectId(courseId);

        const registrations = await registrationModel.find(
            { course: objectId, status: "approved" },
            'username email name course' // Select specific fields
        );

        if (!registrations.length) {
            return res.status(404).json({ message: "No students registered for this course" });
        }

        const students = registrations.map((reg) => ({
            studentId: reg._id,
            username: reg.username,
            email: reg.email,
            name: reg.name
        }));

        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
