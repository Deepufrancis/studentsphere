const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  date: { type: Date, required: true },
  records: [
    {
      username: { type: String, required: true },
      status: { type: Boolean, required: true }, // true = present
    },
  ],
}, { timestamps: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
