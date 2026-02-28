import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    contactEmail: {
        type: String,
        trim: true
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Client', clientSchema);
