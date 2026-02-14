import React, { useState } from 'react';
import axios from 'axios';
import { FaTimes, FaCloudUploadAlt } from 'react-icons/fa';

interface CreativeEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreativeEntryModal: React.FC<CreativeEntryModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [mediaId, setMediaId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [category, setCategory] = useState('Other');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Auto-captured details
    // For now, hardcoded as per instructions to ignore login
    const username = "CreativeTeamUser";
    const timestamp = new Date().toLocaleString();

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const validateMediaId = (id: string) => {
        return /^img|^vid/i.test(id);
    };

    const handleSubmit = async () => {
        setError('');

        if (!validateMediaId(mediaId)) {
            setError('Media ID must start with "img" or "vid"');
            return;
        }
        if (!file) {
            setError('Please upload a file');
            return;
        }

        setUploading(true);
        try {
            // 1. Upload File
            const fd = new FormData();
            fd.append('file', file);
            const uploadRes = await axios.post('/api/creative-entries/upload', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const filePath = uploadRes.data.url;

            // 2. Save Entry
            await axios.post('/api/creative-entries', {
                mediaId,
                filePath,
                caption,
                category,
                date,
                username,
                // createdAt automatically handled by backend or we can send it if we want specific client time, 
                // but usually backend time is safer. Requirement said "Current Timestamp" captured when modal opens.
                // We'll let backend set default createdAt to now, which matches "submit time".
            });

            onSuccess();
            onClose();
            // Reset form
            setMediaId('');
            setFile(null);
            setPreview(null);
            setCaption('');
            setCategory('Other');
            setDate(new Date().toISOString().split('T')[0]);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error saving entry');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">New Creative Entry</h2>
                        <p className="text-xs text-gray-500 mt-1">Logged in as: <span className="font-semibold">{username}</span> • {timestamp}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4">

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Posting Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Media ID <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={mediaId}
                            onChange={(e) => setMediaId(e.target.value)}
                            placeholder="e.g. img001 or vid001"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                        <p className="text-xs text-gray-400 mt-1">Must start with 'img' or 'vid'</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload File <span className="text-red-500">*</span></label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors relative">
                            {!preview ? (
                                <>
                                    <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click to upload image or video</p>
                                </>
                            ) : (
                                <div className="w-full h-48 flex items-center justify-center bg-black rounded-lg overflow-hidden">
                                    {file?.type.startsWith('video') || (preview && preview.match(/\.(mp4|webm|ogg)$/)) ? (
                                        <video src={preview} controls className="max-h-full max-w-full" />
                                    ) : (
                                        <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
                                    )}
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Enter a caption..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="Special Day">Special Day</option>
                            <option value="Engagement">Engagement</option>
                            <option value="Ideation">Ideation</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>


                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={uploading}
                        className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors disabled:opacity-50 flex items-center"
                    >
                        {uploading ? 'Saving...' : 'Save Entry'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CreativeEntryModal;
