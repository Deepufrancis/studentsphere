const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String }, // If user provides a URL
  filePath: { type: String }, // If user uploads a file
  fileType: { type: String }, // File type (e.g., PDF, Image)
  username: { type: String, required: true }, // Uploader username
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Resource", ResourceSchema);
//