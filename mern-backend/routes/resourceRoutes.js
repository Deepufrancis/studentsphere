const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Resource = require("../models/resource");

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload resource (either file or URL)
router.post("/", upload.single("file"), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("File:", req.file);
    
    const { title, description, fileUrl, loggedInUser } = req.body; // Changed from username
    let filePath = req.file ? req.file.path : null;
    let fileType = req.file ? req.file.mimetype : null;

    if (!title || !loggedInUser) { // Changed from username
      return res.status(400).json({ error: "Title and user are required" });
    }
    
    if (!fileUrl && !req.file) {
      return res.status(400).json({ error: "Either a file or URL is required" });
    }

    // Fix path format for cross-platform compatibility
    if (filePath) {
      filePath = filePath.replace(/\\/g, '/');
      if (!filePath.startsWith('uploads/')) {
        // Make path relative to uploads directory
        const parts = filePath.split('uploads/');
        filePath = parts.length > 1 ? `uploads/${parts[1]}` : filePath;
      }
    }

    const newResource = new Resource({ 
      title, 
      description, 
      fileUrl, 
      filePath, 
      fileType, 
      username: loggedInUser // Changed to use loggedInUser
    });
    
    const savedResource = await newResource.save();
    console.log("Resource saved:", savedResource);
    res.status(201).json(savedResource);
  } catch (error) {
    console.error("Resource upload error:", error);
    res.status(500).json({ error: "Error uploading resource: " + error.message });
  }
});

// Get all resources
router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a resource
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const resourceId = req.params.id;
    const { title, description, fileUrl, loggedInUser } = req.body; // Changed from username
    let filePath = req.file ? req.file.path : undefined;
    let fileType = req.file ? req.file.mimetype : undefined;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Find the existing resource
    const existingResource = await Resource.findById(resourceId);
    if (!existingResource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // Process file path if new file is uploaded
    if (filePath) {
      // Delete old file if it exists
      if (existingResource.filePath) {
        const oldFilePath = path.join(__dirname, '..', existingResource.filePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Fix path format
      filePath = filePath.replace(/\\/g, '/');
      if (!filePath.startsWith('uploads/')) {
        const parts = filePath.split('uploads/');
        filePath = parts.length > 1 ? `uploads/${parts[1]}` : filePath;
      }
    }

    // Update resource data
    const updateData = {
      title,
      description,
      username: loggedInUser || existingResource.username, // Changed to use loggedInUser
    };

    // Only update these fields if they're provided or a new file is uploaded
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (filePath !== undefined) {
      updateData.filePath = filePath;
      updateData.fileType = fileType;
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      resourceId,
      updateData,
      { new: true }
    );

    res.json(updatedResource);
  } catch (error) {
    console.error("Resource update error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a resource
router.delete("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    // Delete the physical file if it exists
    if (resource.filePath) {
      const fullPath = path.join(__dirname, '..', resource.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: "Resource deleted" });
  } catch (error) {
    console.error("Resource deletion error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
