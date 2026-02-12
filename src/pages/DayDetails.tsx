import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvents, type EventType } from '../hooks/useEvents';
import EventCard from '../components/Event/EventCard';
import EventModal from '../components/Event/EventModal';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import { format, parseISO, isSameDay } from 'date-fns';
import { useCalendarContext } from '../context/CalendarContext';

const DayDetails: React.FC = () => {
    const { date } = useParams<{ date: string }>();
    const navigate = useNavigate();
    const { activeFilter } = useCalendarContext();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);

    const dateObj = React.useMemo(() => {
        return date ? parseISO(date) : new Date();
    }, [date]);

    // Reuse the hook - it fetches the whole month. 
    // Optimization: passing dateObj works because it's within the month.
    const { events, loading, refreshEvents } = useEvents(dateObj);

    const dayEvents = events.filter(e => {
        // 1. Filter by day
        if (!isSameDay(parseISO(e.date), dateObj)) return false;

        // 2. Apply Sidebar Filter
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Pending' || activeFilter === 'Ongoing' || activeFilter === 'Completed') {
            return e.status === activeFilter;
        }
        return e.category === activeFilter;
    });

    const handleAddEvent = () => {
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleEditEvent = (event: EventType) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        refreshEvents();
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            <header className="flex items-center justify-between mb-8 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-xl text-gray-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all"
                        title="Back to Calendar"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            {date && format(dateObj, 'MMMM d, yyyy')}
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">
                            {dayEvents.length} Events • Filter: <span className="text-indigo-600">{activeFilter}</span>
                        </p>
                    </div>
                </div>

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
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid gap-4 pb-10">
                        {dayEvents.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                                <p className="text-gray-400 font-medium">No events found for {activeFilter}.</p>
                                <button onClick={handleAddEvent} className="mt-4 text-indigo-600 font-semibold text-sm hover:underline">
                                    Create one?
                                </button>
                            </div>
                        ) : (
                            dayEvents.map(event => (
                                <EventCard
                                    key={event._id}
                                    event={event}
                                    onEdit={() => handleEditEvent(event)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialDate={dateObj}
                eventToEdit={selectedEvent}
            />
        </div>
    );
};

export default DayDetails;
