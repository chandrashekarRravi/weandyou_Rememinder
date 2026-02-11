import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true, index: true }, // Index for faster queries provided by range
    startTime: String, // HH:mm format
    endTime: String,
    clientName: String,
    clientBrand: String,
    category: {
        type: String,
        enum: ['Special Day', 'Engagement', 'Ideation', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['Pending', 'Ongoing', 'Completed'],
        default: 'Pending'
    },
    poster: String, // URL
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Event', eventSchema);
