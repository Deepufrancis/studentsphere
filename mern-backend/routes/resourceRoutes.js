const express = require("express");
const multer = require("multer");
const path = require("path");
const File = require("../models/resource");
const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

// Upload file
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");
    const newFile = new File({
      filename: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
    });
    await newFile.save();
    res.json({ message: "File uploaded", fileId: newFile._id });
  } catch (error) {
    res.status(500).send("Upload failed");
  }
});

// List files
router.get("/files", async (req, res) => {
  try {
    const files = await File.find({});
    res.json(files);
  } catch (error) {
    res.status(500).send("Could not list files");
  }
});

// Download file
router.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).send("File not found");
    res.download(path.resolve(file.path), file.filename);
  } catch (error) {
    res.status(500).send("Download failed");
  }
});

module.exports = router;
