import React from 'react';
import type { EventType } from '../../hooks/useEvents';
import { FaClock, FaUser, FaTag, FaEdit, FaCheck } from 'react-icons/fa';
import clsx from 'clsx';
import axios from 'axios';

interface EventCardProps {
    event: EventType;
    onEdit: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {

    const handleMarkCompleted = async () => {
        try {
            await axios.put(`/api/events/${event._id}`, { status: 'Completed' });
            // Socket will handle the update propagation
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            {/* Status Stripe */}
            <div className={clsx(
                "absolute left-0 top-0 bottom-0 w-1.5",
                event.status === 'Completed' ? "bg-green-500" :
                    event.status === 'Ongoing' ? "bg-blue-500" : "bg-gray-300"
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
                <span className={clsx(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold",
                    event.status === 'Completed' ? "bg-green-100 text-green-700" :
                        event.status === 'Ongoing' ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                )}>
                    {event.status}
                </span>
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

            <div className="flex space-x-3 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                    <FaEdit className="text-xs" />
                    <span>Edit</span>
                </button>
                {event.status !== 'Completed' && (
                    <button
                        onClick={handleMarkCompleted}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
                    >
                        <FaCheck className="text-xs" />
                        <span>Complete</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default EventCard;
