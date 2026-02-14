import mongoose from 'mongoose';

const creativeEntrySchema = new mongoose.Schema({
    mediaId: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /^img|^vid/.test(v);
            },
            message: props => `${props.value} is not a valid Media ID! Must start with 'img' or 'vid'.`
        }
    },
    filePath: { type: String, required: true },
    caption: String,
    category: {
        type: String,
        enum: ['Special Day', 'Engagement', 'Ideation', 'Other'],
        default: 'Other'
    },
    date: { type: Date, required: true, default: Date.now, index: true },
    username: String,
    createdAt: { type: Date, default: Date.now, index: true } // Index for date-range queries
});

export default mongoose.model('CreativeEntry', creativeEntrySchema);
