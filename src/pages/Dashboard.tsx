import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useEvents } from '../hooks/useEvents';
import { useCalendarContext } from '../context/CalendarContext';
import CreativeEntryModal from '../components/CreativeEntryModal';

const Dashboard: React.FC = () => {
    const { currentDate } = useCalendarContext();
    const { events, loading } = useEvents(currentDate);

    const total = events.length;
    const pending = events.filter(e => e.status === 'Pending').length;
    const ongoing = events.filter(e => e.status === 'Ongoing').length;
    const completed = events.filter(e => e.status === 'Completed').length;

    const recent = events.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

    // --- New UI state for Dashboard (Legacy/Feedback) ---
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [approved, setApproved] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');

    // --- New Creative Entry Modal State ---
    const [isCreativeModalOpen, setIsCreativeModalOpen] = useState(false);

    useEffect(() => {
        if (!imageFile) {
            setImagePreview(null);
            return;
        }
        const url = URL.createObjectURL(imageFile);
        setImagePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files && e.target.files[0];
        if (f) setImageFile(f);
    };

    const handleFeedbackToggle = (checked: boolean) => {
        // open modal when toggling on; uncheck when cancelled
        if (checked) {
            setShowFeedbackModal(true);
        } else {
            setFeedbackText('');
        }
    };

    const handleSaveFeedback = async () => {
        try {
            // Upload image first if present
            let imageUrl: string | null = null;
            if (imageFile) {
                const fd = new FormData();
                fd.append('file', imageFile);
                const res = await axios.post('/api/feedbacks/upload', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = res.data.url;
            }

            const payload = {
                imageUrl,
                caption,
                approved,
                deleted,
                feedback: feedbackText
            };

            await axios.post('/api/feedbacks', payload);

            setShowFeedbackModal(false);
            setFeedbackText('');
        } catch (err) {
            console.error('Error saving feedback:', err);
            setShowFeedbackModal(false);
        }
    };

    const handleCancelFeedback = () => {
        setShowFeedbackModal(false);
        setFeedbackText('');
    };

    // Keyboard accessibility for modal: Esc to cancel, Enter to submit (Enter in textarea requires Ctrl/Cmd)
    useEffect(() => {
        if (!showFeedbackModal) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCancelFeedback();
            }
            if (e.key === 'Enter') {
                const active = document.activeElement as HTMLElement | null;
                if (active && active.tagName === 'TEXTAREA') {
                    // require Ctrl/Cmd+Enter when typing in textarea
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleSaveFeedback();
                    }
                } else {
                    // Enter outside textarea -> submit
                    e.preventDefault();
                    handleSaveFeedback();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [showFeedbackModal, feedbackText, imageFile, caption, approved, deleted]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Dashboard</h2>
                <button
                    onClick={() => setIsCreativeModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    New +
                </button>
            </div>

            <CreativeEntryModal
                isOpen={isCreativeModalOpen}
                onClose={() => setIsCreativeModalOpen(false)}
                onSuccess={() => {
                    // Optional: refresh logic
                }}
            />

            {loading ? (
                <div className="text-gray-400">Loading...</div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-gray-500 text-sm">Total Events</h3>
                            <p className="text-2xl font-bold">{total}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                            <h3 className="text-gray-500 text-sm">Pending</h3>
                            <p className="text-2xl font-bold">{pending}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                            <h3 className="text-gray-500 text-sm">Ongoing</h3>
                            <p className="text-2xl font-bold">{ongoing}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                            <h3 className="text-gray-500 text-sm">Completed</h3>
                            <p className="text-2xl font-bold">{completed}</p>
                        </div>
                    </div>

                    {/* Quick Actions / Upload */}
                    <div className="bg-white p-6 rounded-lg shadow space-y-4">
                        <h3 className="text-lg font-medium">Quick Actions</h3>
                        <div className="flex gap-4">
                            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                Upload Image
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                            <button
                                onClick={() => handleFeedbackToggle(true)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                            >
                                Give Feedback
                            </button>
                        </div>
                        {imagePreview && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-500 mb-2">Preview:</p>
                                <img src={imagePreview} alt="Preview" className="h-32 w-auto object-cover rounded" />
                            </div>
                        )}
                    </div>

                    {/* Recent Events */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium">Recent Events</h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {recent.map(event => (
                                <li key={event._id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-900">{event.title}</p>
                                            <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${event.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            event.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {event.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                            {recent.length === 0 && (
                                <li className="px-6 py-4 text-center text-gray-500">No recent events</li>
                            )}
                        </ul>
                    </div>

                    {/* Feedback Modal */}
                    {showFeedbackModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
                                <h3 className="text-xl font-bold">Provide Feedback</h3>

                                {imagePreview && (
                                    <div className="mb-4">
                                        <img src={imagePreview} alt="To Upload" className="w-full h-48 object-contain rounded bg-gray-50" />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Caption</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border rounded p-2"
                                        value={caption}
                                        onChange={e => setCaption(e.target.value)}
                                        placeholder="Add a caption..."
                                    />
                                </div>

                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={approved}
                                            onChange={e => setApproved(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>Mark Approved</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-red-600">
                                        <input
                                            type="checkbox"
                                            checked={deleted}
                                            onChange={e => setDeleted(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>Mark for Deletion</span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Feedback Details</label>
                                    <textarea
                                        className="mt-1 block w-full border rounded p-2 h-24"
                                        value={feedbackText}
                                        onChange={e => setFeedbackText(e.target.value)}
                                        placeholder="Type your feedback here..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={handleCancelFeedback}
                                        className="px-4 py-2 border rounded hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveFeedback}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Save Feedback
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
