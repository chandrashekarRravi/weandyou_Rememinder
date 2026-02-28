import express from 'express';
import Client from '../models/Client.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all clients
router.get('/', protect, async (req, res) => {
    try {
        const clients = await Client.find().sort({ clientName: 1 });
        res.json(clients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new client
router.post('/', protect, authorize('Admin'), async (req, res) => {
    try {
        const client = new Client(req.body);
        const saved = await client.save();

        if (req.io) {
            req.io.emit('clientCreated', saved);
        }
        res.status(201).json(saved);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Client name already exists!' });
        }
        res.status(400).json({ message: err.message });
    }
});

// Delete client
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Client.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Client not found' });
        }

        if (req.io) {
            req.io.emit('clientDeleted', id);
        }
        res.json({ message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
