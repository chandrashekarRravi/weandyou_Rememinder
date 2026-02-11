import express from 'express';
import Event from '../models/Event.js';

const router = express.Router();

// Get all events (optional filter by date range)
router.get('/', async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = {};
        if (start && end) {
            query.date = { $gte: new Date(start), $lte: new Date(end) };
        }
        const events = await Event.find(query).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create event
router.post('/', async (req, res) => {
    const event = new Event(req.body);
    try {
        const newEvent = await event.save();
        // Emit real-time update
        req.io.emit('eventCreated', newEvent);
        res.status(201).json(newEvent);
    } catch (err) {
        console.error("Error creating event:", err.message);
        res.status(400).json({ message: err.message });
    }
});

// Update event
router.put('/:id', async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        // Emit real-time update
        req.io.emit('eventUpdated', updatedEvent);
        res.json(updatedEvent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete event
router.delete('/:id', async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        req.io.emit('eventDeleted', req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
