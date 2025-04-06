const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const chatSchema = new mongoose.Schema({
  participants: {
    type: [String], // e.g., ['student1', 'teacher1']
    required: true,
    validate: arr => arr.length === 2,
  },
  messages: [messageSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add middleware to update the updatedAt field when messages are added
chatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.updatedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Chat', chatSchema);
