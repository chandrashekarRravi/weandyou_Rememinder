import express from 'express';
import Client from '../models/Client.js';
import User from '../models/User.js';
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

        // Auto-generate User for the client
        const currentYear = new Date().getFullYear();
        const autoPassword = `${client.clientName}@${currentYear}`;

        // First, check if user exists (to prevent client creation if user exists but client doesn't)
        const existingUser = await User.findOne({ username: client.clientName });
        if (existingUser) {
            return res.status(400).json({ message: 'A user with this client name already exists.' });
        }

        const saved = await client.save();

        // Create the user after client is successfully saved
        try {
            await User.create({
                username: client.clientName,
                password: autoPassword,
                role: 'Client'
            });
        } catch (userErr) {
            // If user creation fails, we should ideally rollback client creation
            await Client.findByIdAndDelete(saved._id);
            return res.status(400).json({ message: 'Failed to create user credentials for client: ' + userErr.message });
        }

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

        // Also delete the associated User account
        await User.findOneAndDelete({ username: deleted.clientName });

        if (req.io) {
            req.io.emit('clientDeleted', id);
        }
        res.json({ message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
