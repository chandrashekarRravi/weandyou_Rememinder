import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import fs from 'fs';

dotenv.config({ path: '../.env' });

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Make io available in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

import eventRoutes from './routes/events.js';
app.use('/api/events', eventRoutes);

import feedbackRoutes from './routes/feedbacks.js';
app.use('/api/feedbacks', feedbackRoutes);

import creativeEntryRoutes from './routes/creativeEntries.js';
app.use('/api/creative-entries', creativeEntryRoutes);

import iterationFeedbackRoutes from './routes/iterationFeedbacks.js';
app.use('/api/iteration-feedbacks', iterationFeedbackRoutes);

import clientRoutes from './routes/clients.js';
app.use('/api/clients', clientRoutes);
// Fallback route
app.get('/', (req, res) => {
    res.send('Calendar API is running');
});
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
