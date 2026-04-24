import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.time('login-total');

        console.time('db-query');
        // 1. Use .lean() to bypass Mongoose document hydration overhead
        const user = await User.findOne({ username }).select('+password +role').lean();
        console.timeEnd('db-query');

        if (!user) {
            console.timeEnd('login-total');
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        console.time('bcrypt-compare');
        // 2. Perform bcrypt comparison securely and asynchronously
        // Note: Using pure bcrypt.compare from bcryptjs instead of the document method
        // speeds up the process because we don't have to instantiate a full Mongoose Document
        const isMatch = await bcrypt.compare(password, user.password);
        console.timeEnd('bcrypt-compare');

        if (isMatch) {
            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
        
        console.timeEnd('login-total');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Log out user / clear cookie or client token
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
    // For Bearer tokens kept in local storage, actual logout is handled client-side
    // This endpoint remains to be functionally complete or if we switch to HTTP-Only cookies
    res.json({ message: 'Logged out successfully' });
});

// @desc    Save FCM Device Token
// @route   POST /api/auth/device-token
// @access  Private
router.post('/device-token', protect, async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ message: 'FCM Token is required' });
        }

        const user = await User.findById(req.user._id);
        if (user) {
            if (!user.fcmTokens) {
                user.fcmTokens = [];
            }
            if (!user.fcmTokens.includes(fcmToken)) {
                user.fcmTokens.push(fcmToken);
                await user.save();
            }
            res.json({ message: 'Device token saved successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Save device token error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// @desc    Register a Team user
// @route   POST /api/auth/team
// @access  Private (Admin only)
router.post('/team', protect, authorize('Admin'), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Team member name is required' });
        }

        const username = `${name}@team`;
        const password = `${name}@12345`;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'A team member with this name already exists.' });
        }

        const user = await User.create({
            username: username,
            password: password,
            role: 'Team'
        });

        res.status(201).json({
            message: 'Team member created successfully',
            user: { _id: user._id, username: user.username, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a Team user
// @route   DELETE /api/auth/team/:id
// @access  Private (Admin only)
router.delete('/team/:id', protect, authorize('Admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'Team') {
            return res.status(404).json({ message: 'Team member not found' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Team member removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all Team users
// @route   GET /api/auth/team
// @access  Private (Admin only)
router.get('/team', protect, authorize('Admin'), async (req, res) => {
    try {
        const teamMembers = await User.find({ role: 'Team' }).select('-password');
        res.json(teamMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Seed temporary mock users
// @route   POST /api/auth/seed
// @access  Public
router.post('/seed', async (req, res) => {
    try {
        const users = await User.find({});
        if (users.length > 0) {
            return res.status(400).json({ message: 'Users already seeded' });
        }

        await User.create([
            { username: 'admin', password: 'admin123', role: 'Admin' },
            { username: 'team', password: 'team123', role: 'Team' },
            { username: 'client', password: 'client123', role: 'Client' }
        ]);

        res.status(201).json({ message: 'Mock users seeded' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

export default router;
