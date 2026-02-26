import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        await mongoose.connection.collection('creativeentries').dropIndex('mediaId_1');
        console.log('Dropped unique index on mediaId successfully.');
    } catch (e) {
        console.log('Error dropping index or index does not exist:', e.message);
    }
    process.exit(0);
});
