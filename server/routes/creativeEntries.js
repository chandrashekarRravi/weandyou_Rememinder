import express from 'express';
import multer from 'multer';
import path from 'path';
import CreativeEntry from '../models/CreativeEntry.js';

const router = express.Router();

// multer storage to uploads/ folder (reusing existing uploads folder)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `creative-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// Upload endpoint: returns URL (similar to feedbacks but distinct if needed)
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
});

// Create Creative Entry record
router.post('/', async (req, res) => {
    try {
        const entry = new CreativeEntry(req.body);
        const saved = await entry.save();

        // Emit socket event if needed for real-time updates (optional for now)
        if (req.io) {
            req.io.emit('creativeEntryCreated', saved);
        }

        res.status(201).json(saved);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Media ID already exists!' });
        }
        res.status(400).json({ message: err.message });
    }
});

// List Creative Entries (supports date range optional)
router.get('/', async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = {};

        if (start && end) {
            query.date = {
                $gte: new Date(start),
                $lte: new Date(end)
            };
        }

        const items = await CreativeEntry.find(query).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
