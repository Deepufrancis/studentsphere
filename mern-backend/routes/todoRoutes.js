const express = require("express");
const router = express.Router();
const ToDo = require("../models/todo");

// Create a new to-do
router.post("/", async (req, res) => {
  try {
    const { title, description, dueDate, userId } = req.body;
    const newToDo = new ToDo({ title, description, dueDate, userId });
    await newToDo.save();
    res.status(201).json(newToDo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all to-dos for a user
router.get("/:userId", async (req, res) => {
  try {
    const toDos = await ToDo.find({ userId: req.params.userId });
    res.json(toDos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark a to-do as completed
router.put("/:id", async (req, res) => {
  try {
    const updatedToDo = await ToDo.findByIdAndUpdate(req.params.id, { completed: true }, { new: true });
    res.json(updatedToDo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a to-do
router.delete("/:id", async (req, res) => {
  try {
    await ToDo.findByIdAndDelete(req.params.id);
    res.json({ message: "To-do deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
