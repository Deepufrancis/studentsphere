const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["teacher", "student"], required: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  otp: { type: String }, // Stores OTP
  otpExpires: { type: Date }, // OTP expiration time
});

module.exports = mongoose.model("User", UserSchema);
