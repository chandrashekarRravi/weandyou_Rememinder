import React from 'react';
import type { EventType } from '../../hooks/useEvents';
import { FaClock, FaUser, FaTag, FaEdit, FaTrash } from 'react-icons/fa';
import clsx from 'clsx';
import api from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

interface EventCardProps {
    event: EventType;
    onEdit: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {
    const { user } = useAuth();

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        try {
            await api.put(`/api/events/${event._id}`, { status: newStatus });
            // Socket will handle the update propagation
        } catch (err) {
            console.error('Failed to update status', err);
            alert('Failed to update status');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await api.delete(`/api/events/${event._id}`);
                // Socket will handle the removal
            } catch (err) {
                console.error('Failed to delete event', err);
                alert('Failed to delete event');
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'Ongoing': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200'; // Pending/Review
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            {/* Status Stripe */}
            <div className={clsx(
                "absolute left-0 top-0 bottom-0 w-1.5",
                event.status === 'Completed' ? "bg-green-500" :
                    event.status === 'Ongoing' ? "bg-blue-500" : "bg-yellow-500"
            )} />

            <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                    <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                        <FaClock className="text-[10px]" />
                        <span>{event.startTime || 'All Day'}</span>
                        {event.endTime && <span>- {event.endTime}</span>}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 leading-tight">{event.title}</h3>
                </div>

                {/* Status Dropdown */}
                <div className="relative">
                    {user?.role === 'Team' ? (
                        <div
                            className={clsx(
                                "px-3 py-1 rounded-lg text-xs font-semibold border text-center inline-block",
                                getStatusColor(event.status)
                            )}
                        >
                            {event.status === 'Pending' ? 'Review' : event.status === 'Ongoing' ? 'Approved' : 'Completed'}
                        </div>
                    ) : (
                        <select
                            value={event.status}
                            onChange={handleStatusChange}
                            className={clsx(
                                "appearance-none px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors",
                                getStatusColor(event.status)
                            )}
                            style={{ paddingRight: '1rem', textAlignLast: 'center' }}
                        >
                            <option value="Pending">Review</option>
                            <option value="Ongoing">Approved</option>
                            <option value="Completed">Completed</option>
                        </select>
                    )}
                </div>
            </div>

            <p className="text-gray-600 text-sm mb-6 pl-2 leading-relaxed">
                {event.description || "No description provided."}
            </p>

            <div className="flex items-center space-x-6 pl-2 mb-6">
                {event.clientName && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <FaUser className="text-gray-300" />
                        <span>{event.clientName} {event.clientBrand && <span className="opacity-60">({event.clientBrand})</span>}</span>
                    </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <FaTag className="text-gray-300" />
                    <span>{event.category}</span>
                </div>
            </div>

            {user?.role !== 'Team' && (
                <div className="flex space-x-3 pl-2 transition-opacity">
                    <button
                        onClick={onEdit}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
                    >
                        <FaEdit className="text-xs" />
                        <span>Edit</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
                    >
                        <FaTrash className="text-xs" />
                        <span>Delete</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default EventCard;
