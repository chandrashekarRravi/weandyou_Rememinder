import express from 'express';
import multer from 'multer';
import path from 'path';
import Feedback from '../models/Feedback.js';
import { protect } from '../middleware/auth.js';
import { storage } from '../cloudinaryConfig.js';

const router = express.Router();

const upload = multer({ storage });

// Upload endpoint: returns Cloudinary URL
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = req.file.path; // Cloudinary URL
  res.json({ url });
});

// Create feedback record
router.post('/', protect, async (req, res) => {
  try {
    const fb = new Feedback(req.body);
    const saved = await fb.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// List feedback records
router.get('/', protect, async (req, res) => {
  try {
    const items = await Feedback.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
