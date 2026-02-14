import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  imageUrl: { type: String },
  caption: { type: String },
  approved: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Feedback', FeedbackSchema);
