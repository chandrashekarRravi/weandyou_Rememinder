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

import { notifyAdmin, notifyClientByUsername, notifyUserByUsername } from '../services/notificationService.js';

// Create Creative Entry record
router.post('/', protect, async (req, res) => {
    try {
        const entry = new CreativeEntry(req.body);
        const saved = await entry.save();

        // Emit socket event if needed for real-time updates (optional for now)
        if (req.io) {
            req.io.emit('creativeEntryCreated', saved);
        }

        // Notify Admin that a new entry was created (For Internal Review)
        setImmediate(async () => {
            const dateStr = new Date(saved.date).toISOString().split('T')[0];
            const submitter = req.user?.username || 'Team Member';
            await notifyAdmin(
                `Internal Review Requested`, 
                `For internal review is requested by ${submitter}.`,
                `/day/${dateStr}`
            );
        });

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
        const oldEntry = await CreativeEntry.findById(id);
        const updatedEntry = await CreativeEntry.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedEntry) {
            return res.status(404).json({ message: 'Creative Entry not found' });
        }

        if (req.io) {
            req.io.emit('creativeEntryUpdated', updatedEntry);
        }

        // Notify if status has changed
        if (oldEntry && oldEntry.status !== updatedEntry.status) {
            setImmediate(async () => {
                const dateStr = new Date(updatedEntry.date).toISOString().split('T')[0];
                const link = `/day/${dateStr}`;
                const status = updatedEntry.status;

                const actionUser = req.user?.username || 'Someone';

                if (status === 'Pending') {
                    // It's sent to the client by the Admin
                    await notifyClientByUsername(
                        updatedEntry.clientName,
                        'Entry Needs Review',
                        `${actionUser} sent a creative entry for your approval.`,
                        link
                    );
                    if (updatedEntry.username) {
                        await notifyUserByUsername(
                            updatedEntry.username,
                            'Internally Approved',
                            `Internal is accepted, wait for the client approval and we will notify you.`,
                            link
                        );
                    }
                } else if (status === 'Rejected') {
                    await notifyAdmin(
                        'Entry Rejected',
                        `${actionUser} rejected the entry for ${updatedEntry.clientName}.`,
                        link
                    );
                    if (updatedEntry.username) {
                        await notifyUserByUsername(
                            updatedEntry.username,
                            'Entry Rejected',
                            `${actionUser} rejected your entry.`,
                            link
                        );
                    }
                } else if (status === 'Approved' || status === 'Client Approved') {
                    await notifyAdmin(
                        'Entry Approved',
                        `${actionUser} approved the entry for ${updatedEntry.clientName}.`,
                        link
                    );
                    if (updatedEntry.username) {
                        await notifyUserByUsername(
                            updatedEntry.username,
                            'Entry Approved',
                            `${actionUser} approved your entry.`,
                            link
                        );
                    }
                } else if (status === 'Internal Review') {
                    await notifyAdmin(
                        'Internal Review Requested',
                        `${actionUser} updated the entry for ${updatedEntry.clientName} and it needs review.`,
                        link
                    );
                    if (updatedEntry.username) {
                        await notifyUserByUsername(
                            updatedEntry.username,
                            'Internal Review Requested',
                            `${actionUser} sent your entry for internal review by Admin.`,
                            link
                        );
                    }
                }
            });
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

        // Collect all file paths
        const pathsToDelete = [];
        if (deletedEntry.filePath) pathsToDelete.push(deletedEntry.filePath);
        if (deletedEntry.filePaths && deletedEntry.filePaths.length > 0) {
            deletedEntry.filePaths.forEach(p => {
                if (!pathsToDelete.includes(p)) pathsToDelete.push(p);
            });
        }

        // Extract public_id from Cloudinary URLs and delete them
        for (const filePath of pathsToDelete) {
            if (filePath && filePath.includes('cloudinary')) {
                const urlParts = filePath.split('/');
                const filenameParts = urlParts[urlParts.length - 1].split('.');
                // the folder is 'avaio_calendar' based on cloudinaryConfig
                const publicId = `avaio_calendar/${filenameParts[0]}`;
                // detect resource_type based on URL
                const resourceType = filePath.includes('/video/upload/') ? 'video' : 'image';
                try {
                    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
                    console.log(`Deleted ${publicId} from Cloudinary`);
                } catch (cloudErr) {
                    console.error('Error deleting from Cloudinary:', cloudErr);
                }
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
