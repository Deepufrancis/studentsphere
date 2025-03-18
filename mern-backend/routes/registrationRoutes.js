const express = require("express");
const router = express.Router();
const Registration = require("../models/registration.model");
const Course = require("../models/course.model");
const User = require("../models/User");
const Notification = require("../models/notification");

router.post("/", async (req, res) => {
  try {
    const { username, courseId } = req.body;
    if (!username || !courseId) {
      return res.status(400).json({ message: "Username and courseId are required." });
    }

    const existingRegistration = await Registration.findOne({ username, course: courseId });
    if (existingRegistration) {
      return res.status(400).json({ message: "Already registered for this course." });
    }

    const registration = new Registration({ username, course: courseId, status: "pending" });
    await registration.save();

    res.status(201).json({ message: "Course registration request sent." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error });
  }
});

router.get("/status/:username", async (req, res) => {
    try {
      const { username } = req.params;
      console.log("Fetching registration for username:", username); // Debug log

      const registrations = await Registration.find({ username });
      

      let statusMap = {};
      registrations.forEach((reg) => {
        statusMap[reg.course] = reg.status;
      });

      res.json(statusMap);
    } catch (error) {
      
      res.status(500).json({ message: "Server error" });
    }
});

router.get("/pending/:teacher", async (req, res) => {
    try {
      const { teacher } = req.params;
      const pendingRequests = await Registration.find({ status: "pending" }).populate("course");
  
      const filteredRequests = pendingRequests.filter((req) => req.course.teacher === teacher);
  
      res.json(filteredRequests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
router.post("/respond", async (req, res) => {
  const { registrationId, status } = req.body;

  try {
    const registration = await Registration.findById(registrationId).populate('course');
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (status === 'approved') {
      registration.status = 'registered';
    } else if (status === 'rejected') {
      await registration.deleteOne();
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Save if not deleted
    if (status === 'approved') {
      await registration.save();
    }

    // Create notification with error handling
    const student = await User.findOne({ username: registration.username });
    if (student) {
      try {
        const notification = new Notification({
          studentId: student._id,
          message: status === 'approved' 
            ? `Your registration for ${registration.course.title} has been approved.`
            : `Your registration for ${registration.course.title} has been rejected.`,
          type: status === 'approved' ? 'approval' : 'rejection'
        });
        
        const savedNotification = await notification.save();
        console.log('Notification saved:', savedNotification);
      } catch (notificationError) {
        console.error('Error saving notification:', notificationError);
        // Continue execution even if notification fails
      }
    }

    res.json({ 
      message: status === 'approved' ? "Request approved." : "Request rejected." 
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put('/approve', async (req, res) => {
    try {
        const { registrationId } = req.body;
        const registration = await Registration.findByIdAndUpdate(
            registrationId,
            { status: 'approved' }, // Changed from 'registered' to 'approved'
            { new: true, runValidators: true }
        );
        
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }
        
        res.json(registration);
    } catch (error) {
        console.error('Error in registration approval:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete("/reject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findById(id).populate('course');
    if (!registration) {
      return res.status(404).json({ message: "Registration not found." });
    }

    // Find student and create notification before deleting registration
    const student = await User.findOne({ username: registration.username });
    if (student) {
      await new Notification({
        studentId: student._id,
        message: `Your registration for ${registration.course.title} has been rejected.`,
        type: 'rejection'
      }).save();
    }

    await registration.deleteOne();
    res.json({ message: "Request rejected." });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

 //registered courses api
 router.get("/student/:username", async (req, res) => {
  const username = req.params.username;
 

  try {
      // Check if the student exists by username
      const student = await User.findOne({ username });

      if (!student) {
         
          return res.status(404).json({ error: "Student not found" });
      }

      // Fetch all registrations for the student where the status is "approved"
      const approvedRegistrations = await Registration.find({ 
          username: student.username,
          status: "registered" // Only get approved registrations
      });

      if (approvedRegistrations.length === 0) {
          
          return res.status(404).json({ error: "No approved courses found" });
      }

      // Extract course IDs from the approved registrations
      const courseIds = approvedRegistrations.map(reg => reg.course);
      

      // Fetch course details for the approved courses
      const approvedCourses = await Course.find({ _id: { $in: courseIds } });
     

      // Respond with the approved courses
      res.json({
          status: "Approved courses",
          approvedCourses
      });
      
  } catch (error) {
      
      res.status(500).json({ error: "Internal server error" });
  }
});



  
 
  
 


module.exports = router;
