const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");





const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const studentRoutes = require("./routes/student_routes/s_courseRoutes");
const registrationRoutes=require("./routes/registrationRoutes");
const reg_students=require("./routes/student_routes/reg_students");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes=require("./routes/notificationRoutes");
const attendanceRoutes=require("./routes/attendanceRoutes");
const userRoutes = require("./routes/userRoutes"); 
const toDoRoutes = require("./routes/todoRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const otpRoutes = require("./routes/otpRoutes");



const app = express();
const server = http.createServer(app);


const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PU Student Sphere API",
      version: "1.0.0",
      description: "API documentation for the PU Student Sphere project",
    },
    servers: [
      {
        url: "http://localhost:5000", // Change if deployed
      },
    ],
  },
  apis: ["./routes/*.js"], // Match the path where your routes are stored
};

// 🔹 Initialize Swagger
const swaggerSpec = swaggerJsdoc(options);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
  origin: 'http://localhost:8081',
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  credentials:true,
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));

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
app.use("/api/attendance",attendanceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/todos", toDoRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/otp", otpRoutes);



app.get("/", (req, res) => {
  res.send("Server is working!");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

console.log("Swagger Docs available at http://localhost:5000/api-docs");


server.listen(5000, () => console.log("Server running on port 5000"));
