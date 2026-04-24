import Notification from '../models/Notification.js';
import User from '../models/User.js';
import admin from 'firebase-admin';

import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin (Only if credentials exist)
try {
    const keyPath = path.resolve('firebase-admin-key.json');
    
    if (fs.existsSync(keyPath)) {
        // Local strategy + some production strategies with mounted secrets
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully from JSON file');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        // Production strategy (e.g. Render, Vercel, Heroku env vars)
        const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized successfully from env var');
    } else {
        console.warn('Firebase Admin not initialized: Missing credentials');
    }
} catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
}

// Global reference for sockets
let ioInstance = null;
export const setIoInstance = (io) => {
    ioInstance = io;
};

/**
 * Send a notification to a specific user
 */
export const sendNotification = async (userId, title, message, type = 'info', actionLink = null) => {
    try {
        // 1. Save to Database
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            actionLink
        });

        // 2. Emit Real-Time using Socket.IO
        if (ioInstance) {
            ioInstance.to(userId.toString()).emit('new_notification', notification);
        }

        // 3. Send via Firebase Cloud Messaging
        if (admin.apps.length > 0) {
            const user = await User.findById(userId);
            if (user && user.fcmTokens && user.fcmTokens.length > 0) {
                const messagePayload = {
                    notification: {
                        title: title,
                        body: message
                    },
                    data: {
                        actionLink: actionLink || '/' // Pass extra data
                    },
                    tokens: user.fcmTokens
                };

                const response = await admin.messaging().sendEachForMulticast(messagePayload);
                if (response.failureCount > 0) {
                    const failedTokens = [];
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            failedTokens.push(user.fcmTokens[idx]);
                        }
                    });
                    // Optional: remove failed tokens from DB if they are expired/invalid
                    if (failedTokens.length > 0) {
                         await User.findByIdAndUpdate(userId, {
                             $pullAll: { fcmTokens: failedTokens }
                         });
                    }
                }
            }
        }
        
        return notification;
    } catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
};

/**
 * Helper: Notify Users by Role or specific target
 */
export const notifyAdmin = async (title, message, actionLink = null) => {
    const adminUser = await User.findOne({ role: 'Admin' });
    if (adminUser) {
        await sendNotification(adminUser._id, title, message, 'info', actionLink);
    }
};

export const notifyClient = async (clientId, title, message, actionLink = null) => {
    await sendNotification(clientId, title, message, 'success', actionLink);
};

export const notifyClientByUsername = async (username, title, message, actionLink = null) => {
    const clientUser = await User.findOne({ username, role: 'Client' });
    if (clientUser) {
        await sendNotification(clientUser._id, title, message, 'info', actionLink);
    }
};

export const notifyUserByUsername = async (username, title, message, actionLink = null) => {
    const user = await User.findOne({ username });
    if (user) {
        // use 'info' by default, or you can map types based on title
        const type = message.toLowerCase().includes('reject') ? 'error' : 
                     message.toLowerCase().includes('approv') ? 'success' : 'info';
        await sendNotification(user._id, title, message, type, actionLink);
    }
};
