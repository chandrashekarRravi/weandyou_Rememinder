import mongoose from 'mongoose';

const iterationFeedbackSchema = new mongoose.Schema({
    creativeEntryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CreativeEntry',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: false
    },
    audioUrl: {
        type: String,
        required: false
    },
    expireAt: {
        type: Date,
        index: { expires: '0' }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('IterationFeedback', iterationFeedbackSchema);
