const mongoose = require("mongoose");

const ToDoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  username: { type: String, ref: "User", required: true }, // Changed from userId to username
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ToDo", ToDoSchema);
