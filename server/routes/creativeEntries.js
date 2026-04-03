import express from 'express';
import multer from 'multer';
import path from 'path';
import CreativeEntry from '../models/CreativeEntry.js';
import { protect, authorize } from '../middleware/auth.js';
import { storage, cloudinary } from '../cloudinaryConfig.js';

const router = express.Router();
const upload = multer({ storage });

// Upload endpoint: returns Cloudinary URL
router.post('/upload', protect, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = req.file.path; // Cloudinary URL
    res.json({ url });
});

// Create Creative Entry record
router.post('/', protect, async (req, res) => {
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
router.get('/', protect, async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = {};

        if (start && end) {
            query.$or = [
                { date: { $gte: new Date(start), $lte: new Date(end) } },
                { createdAt: { $gte: new Date(start), $lte: new Date(end) } }
            ];
        }

        // If user is a Client, ONLY show them their own creative entries
        if (req.user && req.user.role === 'Client') {
            query.clientName = req.user.username;
        }

        const items = await CreativeEntry.find(query).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Creative Entry (Status, Caption, etc.)
router.put('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedEntry = await CreativeEntry.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedEntry) {
            return res.status(404).json({ message: 'Creative Entry not found' });
        }

        if (req.io) {
            req.io.emit('creativeEntryUpdated', updatedEntry);
        }

        res.json(updatedEntry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Creative Entry
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEntry = await CreativeEntry.findByIdAndDelete(id);

        if (!deletedEntry) {
            return res.status(404).json({ message: 'Creative Entry not found' });
        }

        // Extract public_id from Cloudinary URL and delete it
        if (deletedEntry.filePath && deletedEntry.filePath.includes('cloudinary')) {
            const urlParts = deletedEntry.filePath.split('/');
            const filenameParts = urlParts[urlParts.length - 1].split('.');
            // the folder is 'avaio_calendar' based on cloudinaryConfig
            const publicId = `avaio_calendar/${filenameParts[0]}`;
            // detect resource_type based on mediaId or URL
            const resourceType = deletedEntry.mediaId?.startsWith('vid') ? 'video' : 'image';
            try {
                await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            } catch (cloudErr) {
                console.error('Error deleting from Cloudinary:', cloudErr);
            }
        }

        if (req.io) {
            req.io.emit('creativeEntryDeleted', id);
        }

        res.json({ message: 'Creative Entry deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
