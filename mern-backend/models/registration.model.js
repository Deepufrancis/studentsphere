const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: false },
    name: { type: String, required: false },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("Registration", registrationSchema);
