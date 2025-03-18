const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const studentRoutes = require("./routes/student_routes/s_courseRoutes");
const registrationRoutes=require("./routes/registrationRoutes");
const reg_students=require("./routes/student_routes/reg_students");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes=require("./routes/notificationRoutes")

const app = express();


app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect("mongodb://127.0.0.1:27017/student-sphere", )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));


app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/courses", courseRoutes);
app.use("/api", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/registrations",registrationRoutes);
app.use("/api/reg_students",reg_students);
app.use("/api/uploads", uploadRoutes);
app.use('/api/uploads/assignments', uploadRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Server is working!");
});



app.listen(5000, () => console.log("Server running on port 5000"));
