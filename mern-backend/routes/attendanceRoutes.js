const express = require('express');
const router = express.Router();
const Attendance = require('../models/attendance');

// Route to mark attendance
router.post('/mark', async (req, res) => {
    try {
        const { courseId, studentId, date, status } = req.body;

        // Validate required fields
        if (!courseId || !studentId || !date || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if attendance record already exists for this student and date
        const existingRecord = await Attendance.findOne({
            course: courseId,
            student: studentId,
            date: new Date(date)
        });

        if (existingRecord) {
            // Update existing record
            existingRecord.status = status;
            await existingRecord.save();
            return res.status(200).json({ 
                success: true,
                message: 'Attendance updated successfully',
                record: existingRecord
            });
        }

        // Create new attendance record
        const attendance = new Attendance({
            course: courseId,
            student: studentId,
            date: new Date(date),
            status
        });
        await attendance.save();
        
        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            record: attendance
        });
    } catch (error) {
        console.error('Attendance marking error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to mark attendance'
        });
    }
});

// Route to mark attendance for multiple students at once
router.post('/mark-batch', async (req, res) => {
    try {
        const { course, attendanceRecords } = req.body;
        
        if (!course || !attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const results = await Promise.all(
            attendanceRecords.map(async (record) => {
                if (!record.student || !record.status) {
                    return { success: false, student: record.student, error: 'Missing required fields' };
                }

                try {
                    // Use upsert to update if exists or create if doesn't
                    await Attendance.findOneAndUpdate(
                        { course, student: record.student, date: record.date || new Date() },
                        { status: record.status, remarks: record.remarks },
                        { upsert: true, new: true }
                    );
                    return { success: true, student: record.student };
                } catch (err) {
                    return { success: false, student: record.student, error: err.message };
                }
            })
        );

        res.status(200).json({ message: 'Batch attendance processed', results });
    } catch (error) {
        console.error('Batch attendance error:', error);
        res.status(500).json({ error: 'Failed to process batch attendance' });
    }
});

// Route to fetch attendance records
router.get('/records', async (req, res) => {
    try {
        const { course, date, startDate, endDate } = req.query;

        const query = {};
        if (course) query.course = course;
        
        if (date) {
            const queryDate = new Date(date);
            queryDate.setHours(0, 0, 0, 0);
            const nextDate = new Date(queryDate);
            nextDate.setDate(queryDate.getDate() + 1);
            
            query.date = {
                $gte: queryDate,
                $lt: nextDate
            };
        }

        const records = await Attendance.find(query)
            .populate('student', '_id username') // Include both _id and username
            .sort({ date: -1 });
            
        // Transform the response to include username
        const formattedRecords = records.map(record => ({
            _id: record._id,
            studentId: record.student._id,
            username: record.student.username,
            status: record.status,
            date: record.date
        }));
            
        res.status(200).json(formattedRecords);
    } catch (error) {
        console.error('Fetch attendance error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch attendance records' });
    }
});

// Route to get attendance statistics
router.get('/statistics', async (req, res) => {
    try {
        const { course, student, startDate, endDate } = req.query;
        
        // Build match query for aggregation
        const matchQuery = {};
        if (course) matchQuery.course = mongoose.Types.ObjectId(course);
        if (student) matchQuery.student = mongoose.Types.ObjectId(student);
        
        // Add date range filter if provided
        if (startDate || endDate) {
            matchQuery.date = {};
            if (startDate) matchQuery.date.$gte = new Date(startDate);
            if (endDate) matchQuery.date.$lte = new Date(endDate);
        }
        
        const statistics = await Attendance.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Format the statistics
        const formattedStats = {
            total: statistics.reduce((acc, curr) => acc + curr.count, 0),
            present: statistics.find(s => s._id === 'Present')?.count || 0,
            absent: statistics.find(s => s._id === 'Absent')?.count || 0
        };
        
        formattedStats.presentPercentage = formattedStats.total > 0 
            ? (formattedStats.present / formattedStats.total * 100).toFixed(2) 
            : 0;
            
        res.status(200).json(formattedStats);
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ error: 'Failed to get attendance statistics' });
    }
});

module.exports = router;