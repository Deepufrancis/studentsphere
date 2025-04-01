const mongoose = require("mongoose");

const LiveClassSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  teacher: { type: String, required: true }, // Username of the teacher
  liveClassLink: { type: String, required: true },
  scheduledTime: { type: Date, required: true }, // Date & time of the session
});

module.exports = mongoose.model("LiveClass", LiveClassSchema);
