import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const creativeEntrySchema = new mongoose.Schema({
    mediaId: String,
    filePath: String,
    caption: String,
    category: String,
    date: Date,
    username: String,
    createdAt: Date
});

const CreativeEntry = mongoose.model('CreativeEntry', creativeEntrySchema);

async function checkEntries() {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const count = await CreativeEntry.countDocuments();
        console.log(`Total Creative Entries: ${count}`);

        const entries = await CreativeEntry.find().sort({ createdAt: -1 }).limit(10);
        console.log('Last 10 entries:');
        entries.forEach(e => {
            console.log({
                id: e._id,
                mediaId: e.mediaId,
                date: e.date,
                createdAt: e.createdAt,
                category: e.category
            });
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkEntries();
