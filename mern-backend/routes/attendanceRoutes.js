const express = require("express");
const router = express.Router();
const Attendance = require("../models/attendance");

// POST /api/attendance/mark
router.post("/mark", async (req, res) => {
  const { course, date, records } = req.body;

  if (!course || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "Missing or invalid required fields" });
  }

  // Validate that each record has required fields
  const isValidRecords = records.every(record => 
    record.username && 
    typeof record.status === 'boolean'
  );

  if (!isValidRecords) {
    return res.status(400).json({ 
      error: "Invalid record format. Each record must have username and status" 
    });
  }

  try {
    const existing = await Attendance.findOne({ 
      course, 
      date: new Date(date)
    });

    if (existing) {
      existing.records = records;
      await existing.save();
      return res.json({ message: "Attendance updated successfully" });
    }

    const attendance = new Attendance({ 
      course, 
      date: new Date(date), 
      records 
    });
    await attendance.save();
    res.status(201).json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ 
      error: error.message || "Internal server error" 
    });
  }
});

// GET /api/attendance/course/:courseId?date=YYYY-MM-DD
router.get("/course/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const { date } = req.query;

  try {
    const query = { course: courseId };
    if (date) query.date = new Date(date);

    const result = await Attendance.find(query)
      .populate("records.student", "username name")
      .sort({ date: -1 });

    res.json(result);
  } catch (error) {
    console.error("Error fetching course attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/attendance/student/:studentId
router.get("/student/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
    const records = await Attendance.find({ "records.student": studentId })
      .populate("course", "title")
      .sort({ date: -1 });

    // Filter attendance for this student only
    const attendance = records.map((doc) => {
      const studentRecord = doc.records.find((r) => r.student.toString() === studentId);
      return {
        course: doc.course.title,
        date: doc.date.toISOString().split("T")[0],
        present: studentRecord?.status || false,
      };
    });

    res.json(attendance);
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET route for student attendance
router.get("/student/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const records = await Attendance.find({ "records.username": username })
      .populate("course", "title")
      .sort({ date: -1 });

    const attendance = records.map((doc) => {
      const studentRecord = doc.records.find((r) => r.username === username);
      return {
        course: doc.course.title,
        date: doc.date.toISOString().split("T")[0],
        present: studentRecord?.status || false,
      };
    });

    res.json(attendance);
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/attendance/date/:date
router.get("/date/:date", async (req, res) => {
  const { date } = req.params;
  const { courseId } = req.query;

  try {
    const query = { date: new Date(date) };
    if (courseId) query.course = courseId;

    const attendance = await Attendance.find(query)
      .populate("course", "title")
      .sort({ "course.title": 1 });

    const formattedAttendance = attendance.map(record => ({
      courseId: record.course._id,
      courseName: record.course.title,
      date: record.date.toISOString().split('T')[0],
      students: record.records.map(student => ({
        username: student.username,
        present: student.status
      }))
    }));

    res.json(formattedAttendance);
  } catch (error) {
    console.error("Error fetching attendance by date:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
