import mongoose from 'mongoose';

const creativeEntrySchema = new mongoose.Schema({
    mediaId: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^img|^vid/.test(v);
            },
            message: props => `${props.value} is not a valid Media ID! Must start with 'img' or 'vid'.`
        }
    },
    filePath: { type: String, required: false }, // Legacy / Primary image
    filePaths: { type: [String], default: [] }, // Multiple images for carousel
    caption: String,
    category: {
        type: String,
        enum: ['Special Day', 'Engagement', 'Ideation', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['Pending', 'Client Approved', 'Approved', 'Rejected', 'Internal Review'], // Added 'Client Approved' and 'Internal Review'
        default: 'Pending'
    },
    date: { type: Date, required: true, default: Date.now, index: true },
    username: String,
    clientName: String, // Added Client Name
    ratio: { type: String, default: '1:1' },

    createdAt: { type: Date, default: Date.now, index: true } // Index for date-range queries
});

export default mongoose.model('CreativeEntry', creativeEntrySchema);
