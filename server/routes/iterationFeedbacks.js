import express from 'express';
import IterationFeedback from '../models/IterationFeedback.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all feedbacks for a specific Creative Entry
router.get('/:creativeEntryId', protect, async (req, res) => {
    try {
        const { creativeEntryId } = req.params;
        const feedbacks = await IterationFeedback.find({ creativeEntryId }).sort({ createdAt: 1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new feedback
router.post('/', protect, async (req, res) => {
    try {
        const { creativeEntryId, text } = req.body;

        if (!creativeEntryId || !text) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newFeedback = new IterationFeedback({
            creativeEntryId,
            userId: req.user._id,
            username: req.user.username,
            role: req.user.role,
            text
        });

        const savedFeedback = await newFeedback.save();

        if (req.io) {
            req.io.emit('newIterationFeedback', savedFeedback);
        }

        res.status(201).json(savedFeedback);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete feedback
router.delete('/:id', protect, async (req, res) => {
    try {
        const feedback = await IterationFeedback.findById(req.params.id);
        
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Only allow the user who created it or an Admin to delete it
        if (feedback.userId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to delete this feedback' });
        }

        await feedback.deleteOne();

        if (req.io) {
            req.io.emit('deleteIterationFeedback', req.params.id);
        }

        res.json({ message: 'Feedback removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
