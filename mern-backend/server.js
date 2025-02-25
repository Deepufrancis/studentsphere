const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const studentRoutes = require("./routes/student_routes/s_courseRoutes");

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/student-sphere", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Routes
console.log("Loading routes...");

app.use("/api/courses", courseRoutes);
app.use("/api", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/students", studentRoutes); // ✅ Ensure student routes are properly loaded

console.log("Routes loaded.");

app.get("/", (req, res) => {
  res.send("Server is working!");
});

app.listen(5000, () => console.log("Server running on port 5000"));
