const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const router = express.Router();

// Configure Nodemailer for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password
  },
});

// ✅ **Generate and send OTP**
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email }); // Changed from username to email
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
});

// ✅ **Verify OTP**
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email }); // Changed from username to email
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    
    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

// ✅ **Reset password**
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email }); // Changed from username to email
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = undefined; // Clear OTP after reset
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;
