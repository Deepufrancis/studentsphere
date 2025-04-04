const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Resource = require('../models/resource');

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// POST route for file upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const resource = new Resource({
            title: req.body.title,
            description: req.body.description,
            filePath: req.file.path,
            fileType: path.extname(req.file.originalname).substring(1),
            username: req.body.loggedInUser // Changed to match frontend field name
        });

        const savedResource = await resource.save();
        res.status(201).json({ 
            message: 'Resource uploaded successfully',
            resource: savedResource 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
