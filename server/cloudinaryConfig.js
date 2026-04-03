import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avaio_calendar',
    resource_type: 'auto', // Important for both images and videos
    format: async (req, file) => {
        // Only convert images to webp
        if (file.mimetype.startsWith('image/')) {
            return 'webp';
        }
        return undefined; // keep original format for videos
    },
  },
});

export { cloudinary, storage };
