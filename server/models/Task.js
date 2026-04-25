import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    description: { type: String, required: true },
    fileUrls: [{ type: String }],
    fileNames: [{ type: String }],
    assignedTo: { type: String, required: true }, // username of the team member
    createdBy: { type: String, required: true }, // username of Admin/Bhuvan
    status: { type: String, default: 'Pending', enum: ['Pending', 'Completed'] },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Task', taskSchema);
