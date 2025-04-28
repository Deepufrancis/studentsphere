const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;  // secret key access








const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const studentRoutes = require("./routes/student_routes/s_courseRoutes");
const registrationRoutes=require("./routes/registrationRoutes");
const reg_students=require("./routes/student_routes/reg_students");
const notificationRoutes=require("./routes/notificationRoutes");
const attendanceRoutes=require("./routes/attendanceRoutes");
const userRoutes = require("./routes/userRoutes"); 
const toDoRoutes = require("./routes/todoRoutes");
const resourceRoutes = require("./routes/resourceRoute");
const forgotRoute = require("./routes/forgotRoute");
const liveClassRoutes=require("./routes/liveclass");
const examRoutes=require("./routes/examRoutes");
const chatRoutes = require('./routes/chatRoutes');
const uploadRoutes=require('./routes/uploadRoutes');
const upAssignmentRoutes=require('./routes/upAssignmentRoutes');
const classroomRoutes=require('./routes/classroomRoutes');


const app = express();
const server = http.createServer(app);



app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
  origin: 'http://localhost:8081',
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  credentials:true,
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));

mongoose
  .connect(process.env.MONGODB_URL, )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/courses", courseRoutes);
app.use("/api", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/registrations",registrationRoutes);
app.use("/api/reg_students",reg_students);
app.use("/api/notifications", notificationRoutes);
app.use("/api/attendance",attendanceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/todos", toDoRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/forgot", forgotRoute);
app.use("/api/liveclass",liveClassRoutes);
app.use("/api/exams",examRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/testupload',uploadRoutes);
app.use('/api/uploads', upAssignmentRoutes);  
app.use('/api/classroom',classroomRoutes);

app.get("/", (req, res) => {
  res.send("Server is working!");
});



server.listen(5000, () => console.log("Server running on port 5000"));
