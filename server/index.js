import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        origin: process.env.CLIENT_URL || "http://localhost:5173", // Vite default port or Prod URL
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
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
// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback route for React Router
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
