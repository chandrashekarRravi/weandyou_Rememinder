import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['success', 'error', 'info', 'warning', 'action'],
        default: 'info'
    },
    read: {
        type: Boolean,
        default: false
    },
    actionLink: {
        type: String, // Optional URL to navigate to when clicked
        default: null
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
