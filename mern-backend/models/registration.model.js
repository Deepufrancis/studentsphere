const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Registration", RegistrationSchema);
