import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import EventCard from '../components/Event/EventCard';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import { format, parseISO, isSameDay } from 'date-fns';
import axios from 'axios';

const DayDetails: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();

    const dateObj = React.useMemo(() => {
        return date ? parseISO(date) : new Date();
    }, [date]);

    // Reuse the hook - it fetches the whole month. 
    // Optimization: passing dateObj works because it's within the month.
    const { events, loading } = useEvents(dateObj);

    const dayEvents = events.filter(e => isSameDay(parseISO(e.date), dateObj));

    // Placeholder handler for adding event - ideally opens a modal
    const handleAddEvent = async () => {
        const title = prompt("Enter Event Title:");
        if (!title) return;

        try {
            await axios.post('/api/events', {
                title,
                date: dateObj,
                description: "New event",
                status: "Pending",
                category: "Other"
            });
        } catch (e) {
            alert("Failed to create event");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <FaArrowLeft />
                        <span className="font-medium">Back to Calendar</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {date && format(dateObj, 'MMMM d, yyyy')}
                    </h1>
                    <button
                        onClick={handleAddEvent}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <FaPlus />
                        <span>Add Event</span>
                    </button>
                </header>

                {loading ? (
                    <div className="text-center py-20 text-gray-400">Loading events...</div>
                ) : (
                    <div className="grid gap-6">
                        {dayEvents.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                                <p className="text-gray-400 font-medium">No events planned for this day.</p>
                                <button onClick={handleAddEvent} className="mt-4 text-indigo-600 font-semibold text-sm hover:underline">
                                    Create your first event
                                </button>
                            </div>
                        ) : (
                            dayEvents.map(event => (
                                <EventCard key={event._id} event={event} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DayDetails;
