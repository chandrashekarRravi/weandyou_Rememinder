import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { FaTimes, FaCloudUploadAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useClients } from '../hooks/useClients';

interface CreativeEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: {
        _id?: string;
        mediaId?: string;
        clientName?: string;
        category?: string;
        caption?: string;
        filePath?: string;
        filePaths?: string[];
        ratio?: string;
        date?: string;
    };
}

const CreativeEntryModal: React.FC<CreativeEntryModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const [entryId, setEntryId] = useState('');
    const [mediaId, setMediaId] = useState('');
    const [clientName, setClientName] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [caption, setCaption] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [ratio, setRatio] = useState('1:1');
    const RATIO_OPTIONS = ['1:1', '4:5', '9:16', '16:9'];
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setEntryId(initialData?._id || '');
            setMediaId(initialData?.mediaId || '');
            setClientName(initialData?.clientName === 'Drafts' ? '' : (initialData?.clientName || ''));
            setCategory(initialData?.category || '');
            setCaption(initialData?.caption || '');
            setRatio(initialData?.ratio || '1:1');
            
            const initialPaths = initialData?.filePaths?.length 
                ? initialData.filePaths 
                : (initialData?.filePath ? [initialData.filePath] : []);
            setPreviews(initialPaths);
            setCurrentPreviewIndex(0);
            setFiles([]);
            
            setDate(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setError('');
        }
    }, [isOpen, initialData]);

    const { user } = useAuth();
    const { clients } = useClients();
    // Auto-captured details
    const username = user?.username || "UnknownUser";
    const isChinmai = user?.username?.toLowerCase() === 'chinmai@team';

    if (!isOpen) return null;

    const autoSelectRatio = (r: number) => {
        const diffs = [
            { ratio: '1:1', val: 1 },
            { ratio: '4:5', val: 0.8 },
            { ratio: '9:16', val: 0.5625 },
            { ratio: '16:9', val: 1.7777 }
        ];
        let closest = diffs[0];
        let minDiff = Math.abs(r - diffs[0].val);
        for (let i = 1; i < diffs.length; i++) {
            const diff = Math.abs(r - diffs[i].val);
            if (diff < minDiff) {
                minDiff = diff;
                closest = diffs[i];
            }
        }
        setRatio(closest.ratio);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            setFiles(selectedFiles);
            const objectUrls = selectedFiles.map(f => URL.createObjectURL(f));
            setPreviews(objectUrls);
            setCurrentPreviewIndex(0);

            // Auto select ratio from first file
            const f = selectedFiles[0];
            if (f.type.startsWith('image/')) {
                const img = new Image();
                img.onload = () => autoSelectRatio(img.naturalWidth / img.naturalHeight);
                img.src = objectUrls[0];
            } else if (f.type.startsWith('video/')) {
                const vid = document.createElement('video');
                vid.onloadedmetadata = () => autoSelectRatio(vid.videoWidth / vid.videoHeight);
                vid.src = objectUrls[0];
            }
        }
    };

    const validateMediaId = (id: string) => {
        return /^img|^vid/i.test(id);
    };

    const handleSubmit = async () => {
        setError('');
        setUploadProgress(0);

        if (!validateMediaId(mediaId)) {
            setError('Media ID must start with "img" or "vid"');
            return;
        }
        if (files.length === 0 && previews.length === 0) {
            setError('Please upload at least one file');
            return;
        }

        if (!isChinmai && !clientName) {
            setError('Please select a client');
            return;
        }

        if (!isChinmai && !category) {
            setError('Please select a category');
            return;
        }

        setUploading(true);
        try {
            let actualFilePaths = [...previews];
            // 1. Upload Files if new ones are selected
            if (files.length > 0) {
                actualFilePaths = [];
                for (let i = 0; i < files.length; i++) {
                    const fd = new FormData();
                    fd.append('file', files[i]);
                    const uploadRes = await api.post('/api/creative-entries/upload', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        onUploadProgress: (progressEvent) => {
                            if (progressEvent.total) {
                                const fileProgress = (progressEvent.loaded / progressEvent.total) * 100;
                                const overallProgress = Math.round(((i * 100) + fileProgress) / files.length);
                                setUploadProgress(overallProgress);
                            }
                        }
                    });
                    actualFilePaths.push(uploadRes.data.url);
                }
            }

            // 2. Save or Update Entry
            const payload: any = {
                mediaId,
                clientName: isChinmai ? 'Drafts' : clientName,
                filePath: actualFilePaths[0],
                filePaths: actualFilePaths,
                caption: isChinmai ? '' : caption,
                category: isChinmai ? 'Other' : category,
                date: isChinmai ? new Date().toISOString() : date,
                username: entryId ? undefined : username, // don't override username if editing
                ratio,
            };

            if (!entryId) {
                // Temporarily forcing all newly created entries into Internal Review
                // so you can test the Bhuvan verify button easily!
                payload.status = 'Internal Review';
            }

            console.log('Submitting Creative Entry Payload:', payload, 'User:', user);

            if (entryId) {
                await api.put(`/api/creative-entries/${entryId}`, payload);
            } else {
                await api.post('/api/creative-entries', payload);
            }

            onSuccess();
            onClose();
            // Reset form
            setEntryId('');
            setMediaId('');
            setClientName('');
            setFiles([]);
            setPreviews([]);
            setCurrentPreviewIndex(0);
            setCaption('');
            setCategory('Other');
            setRatio('1:1');
            setDate(new Date().toISOString().split('T')[0]);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error saving entry');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{entryId ? 'Edit Creative Entry' : 'New Creative Entry'}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FaTimes />
                    </button>
                </div>

                {/* Body - 2 Column Layout */}
                <div className="overflow-y-auto flex-1 min-h-0">
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">

                        {/* Left Column: Media & Caption */}
                        <div className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 md:col-span-2">
                                {error}
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                    Media ID <span className="text-red-500">*</span>
                                </label>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={mediaId}
                                        onChange={(e) => setMediaId(e.target.value)}
                                        placeholder="e.g. img001 or vid001"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Must start with 'img' or 'vid'</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Image Box Size</label>
                            <div className="flex gap-2 mb-4">
                                {RATIO_OPTIONS.map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRatio(r)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                            ratio === r
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File(s) <span className="text-red-500">*</span></label>
                            <div className={`border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:bg-gray-50 transition-colors relative w-full ${previews.length === 0 ? 'aspect-square p-6' : 'overflow-hidden mx-auto'}`}
                                 style={previews.length > 0 ? { aspectRatio: ratio.replace(':', '/'), maxHeight: '45vh', maxWidth: '100%' } : {}}>
                                
                                {uploading && files.length > 0 && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50 transition-opacity">
                                        <div className="w-16 h-16 border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                        <div className="text-white text-3xl font-bold drop-shadow-md">{uploadProgress}%</div>
                                        <div className="text-gray-300 text-sm mt-2 font-medium">Uploading to Cloudinary...</div>
                                        <div className="w-3/4 max-w-xs bg-gray-700/50 rounded-full h-2 mt-4 overflow-hidden shadow-inner">
                                            <div className="bg-indigo-500 h-2 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                {previews.length === 0 ? (
                                    <>
                                        <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500 text-center">Click to upload image(s) or video(s)</p>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-black relative z-10 group">
                                        {(files[currentPreviewIndex]?.type.startsWith('video') || (previews[currentPreviewIndex] && previews[currentPreviewIndex].match(/\.(mp4|webm|ogg)$/))) ? (
                                            <video src={previews[currentPreviewIndex]} controls className="w-full h-full object-contain block" />
                                        ) : (
                                            <img src={previews[currentPreviewIndex]} alt="Preview" className="w-full h-full object-contain block" />
                                        )}
                                        
                                        {/* Carousel Controls */}
                                        {previews.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); setCurrentPreviewIndex(prev => prev > 0 ? prev - 1 : previews.length - 1); }}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                >
                                                    &larr;
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); setCurrentPreviewIndex(prev => prev < previews.length - 1 ? prev + 1 : 0); }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                >
                                                    &rarr;
                                                </button>
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                                                    {previews.map((_, i) => (
                                                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentPreviewIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        <div className="absolute top-4 right-4 flex gap-2 z-40">
                                            <label className="bg-black/60 text-white text-xs px-2 py-1 rounded select-none cursor-pointer hover:bg-black/80 flex items-center gap-1 transition-colors relative overflow-hidden">
                                                <FaCloudUploadAlt /> Change
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,video/*"
                                                    onChange={handleFileChange}
                                                    disabled={uploading}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}
                                {previews.length === 0 && (
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 disabled:cursor-not-allowed"
                                    />
                                )}
                            </div>
                        </div>

                        {!isChinmai && (
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
                        )}
                    </div>

                    {/* Right Column: Details & Reminders */}
                    {!isChinmai && (
                        <div className="space-y-4">
                            <div className=" p-4 rounded-xl border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Entry Details</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <label className="min-w-[100px] text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
                                    <select
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        required
                                    >
                                        <option value="" disabled>Select a Client</option>
                                        {clients.map(c => (
                                            <option key={c._id} value={c.clientName}>{c.clientName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="min-w-[100px] text-sm font-medium text-gray-700">Posting Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="min-w-[100px] text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="" disabled>Select a Category</option>
                                        <option value="Special Day">Special Day</option>
                                        <option value="Engagement">Engagement</option>
                                        <option value="Ideation">Ideation</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
