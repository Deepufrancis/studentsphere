const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  requestedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Registration', registrationSchema);
