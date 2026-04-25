import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendNotification } from '../services/notificationService.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Setup Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'task-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new task (with optional file upload)
router.post('/', upload.array('files', 5), async (req, res) => {
    try {
        const { description, assignedTo, createdBy } = req.body;
        
        let fileUrls = [];
        let fileNames = [];
        
        if (req.files && req.files.length > 0) {
            fileUrls = req.files.map(file => `/uploads/${file.filename}`);
            fileNames = req.files.map(file => file.originalname);
        }

        const task = new Task({
            description,
            assignedTo,
            createdBy,
            fileUrls,
            fileNames
        });

        const savedTask = await task.save();

        // Emit to all users so the Tasks board updates instantly
        req.io.emit('new_task', savedTask);

        // Notify the assigned team member
        // Find the user by username to get their ID for notification
        const assignedUser = await User.findOne({ username: assignedTo });
        if (assignedUser) {
            sendNotification(
                assignedUser._id.toString(),
                'New Task Assigned',
                `${createdBy} assigned you a new task.`,
                'info',
                '/tasks'
            );
        }

        res.status(201).json(savedTask);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
});

// Update task status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        
        // Emit update to all clients
        req.io.emit('task_updated', task);

        // If completed, notify the creator
        if (status === 'Completed') {
            const creatorUser = await User.findOne({ username: task.createdBy });
            if (creatorUser) {
                sendNotification(
                    creatorUser._id.toString(),
                    'Task Completed',
                    `${task.assignedTo} completed a task you assigned.`,
                    'success',
                    '/tasks'
                );
            }
        }
        
        res.json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        
        req.io.emit('task_deleted', req.params.id);
        
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
