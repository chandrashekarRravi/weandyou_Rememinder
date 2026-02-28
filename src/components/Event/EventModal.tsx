import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { FaTimes } from 'react-icons/fa';
import type { EventType } from '../../hooks/useEvents';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void; // Trigger refresh
    initialDate: Date;
    eventToEdit?: EventType | null;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, initialDate, eventToEdit }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        review: '',
        captions: '',
        startTime: '',
        endTime: '',
        clientName: '',
        clientBrand: '',
        category: 'Other',
        status: 'Pending'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (eventToEdit) {
            setFormData({
                title: eventToEdit.title,
                description: eventToEdit.description || '',
                startTime: eventToEdit.startTime || '',
                review: eventToEdit.review || '',
                captions: eventToEdit.captions || '',
                endTime: eventToEdit.endTime || '',
                clientName: eventToEdit.clientName || '',
                clientBrand: eventToEdit.clientBrand || '',
                category: eventToEdit.category,
                status: eventToEdit.status
            });
        } else {
            // Reset for new event
            setFormData({
                title: '',
                description: '',
                review: '',
                captions: '',
                startTime: '',
                endTime: '',
                clientName: '',
                clientBrand: '',
                category: 'Other',
                status: 'Pending'
            });
        }
    }, [eventToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                date: (initialDate instanceof Date) ? initialDate.toISOString() : initialDate
            };

            if (eventToEdit) {
                await api.put(`/api/events/${eventToEdit._id}`, payload);
            } else {
                await api.post('/api/events', payload);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to save event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {eventToEdit ? 'Edit Event' : 'New Event'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Title</label>
                        <input
                            type="text"
                            required
                            placeholder="Event Title"
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none font-semibold text-gray-800"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Start Time</label>
                            <input
                                type="time"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-700"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">End Time</label>
                            <input
                                type="time"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-700"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-700 cursor-pointer"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Other">Other</option>
                                <option value="Special Day">Special Day</option>
                                <option value="Engagement">Engagement</option>
                                <option value="Ideation">Ideation</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-700 cursor-pointer"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Pending">Review</option>
                                <option value="Ongoing">Approved</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Client Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Acme Corp"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-700"
                                value={formData.clientName}
                                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Brand</label>
                            <input
                                type="text"
                                placeholder="e.g. Retail"
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-700"
                                value={formData.clientBrand}
                                onChange={e => setFormData({ ...formData, clientBrand: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                        <textarea
                            rows={3}
                            placeholder="Add details..."
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-700 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    {/* review */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Review</label>
                        <textarea
                            rows={3}
                            placeholder="Add details..."
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-700 resize-none"
                            value={formData.review}
                            onChange={e => setFormData({ ...formData, review: e.target.value })}
                        />
                    </div>
                    {/* captions */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Captions</label>
                        <textarea
                            rows={3}
                            placeholder="Add details..."
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-700 resize-none"
                            value={formData.captions}
                            onChange={e => setFormData({ ...formData, captions: e.target.value })}
                        />
                    </div>
                    <div className="pt-4 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? 'Saving...' : eventToEdit ? 'Save Changes' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
