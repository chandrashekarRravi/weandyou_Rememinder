import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvents, type EventType } from '../hooks/useEvents';
import EventCard from '../components/Event/EventCard';
import EventModal from '../components/Event/EventModal';
import { useCreativeEntries } from '../hooks/useCreativeEntries.ts';
import { FaArrowLeft, FaPlus, FaImage, FaVideo } from 'react-icons/fa';
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
    const { creativeEntries, loading: creativeLoading } = useCreativeEntries(dateObj);

    const dayEvents = events.filter(e => {
        // 1. Filter by day
        if (!isSameDay(parseISO(e.date), dateObj)) return false;

        // 2. Apply Sidebar / Calendar filter
        if (activeFilter === 'All') return true;

        // Status filters
        if (activeFilter === 'Pending' || activeFilter === 'Ongoing' || activeFilter === 'Completed') {
            return e.status === activeFilter;
        }

        // Client filter (format: "client:Client Name")
        if (typeof activeFilter === 'string' && activeFilter.startsWith('client:')) {
            const clientName = activeFilter.replace(/^client:/, '');
            return (e.clientName?.trim() || 'No Client') === clientName;
        }

        // Category fallback
        return e.category === activeFilter;
    });

    const dayCreativeEntries = creativeEntries.filter(e => {
        // 1. Filter by day (using Posting Date 'date' or fallback to createdAt)
        const dateStr = e.date || e.createdAt;
        if (!dateStr) return false;

        if (!isSameDay(parseISO(dateStr), dateObj)) return false;

        // 2. Filter logic
        if (activeFilter === 'All') return true;

        // Hide on Status/Client filters
        if (['Pending', 'Ongoing', 'Completed'].includes(activeFilter) || activeFilter.startsWith('client:')) {
            return false;
        }

        // Category match
        const cat = e.category || 'Other';
        return cat === activeFilter;
    });

    const groupedByClient = React.useMemo(() => {
        const map = new Map<string, EventType[]>();
        dayEvents.forEach(ev => {
            const key = ev.clientName?.trim() || 'No Client';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(ev);
        });

        // Convert to sorted array [clientName, events[]]
        const entries = Array.from(map.entries());

        // Sort events within each client: Pending first
        entries.forEach(([, events]) => {
            events.sort((a, b) => {
                if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                return 0;
            });
        });

        return entries.sort((a, b) => {
            // Optional: Sort clients with Pending events first?
            // For now, keep alphabetical client sort as primary, but events inside are sorted.
            return a[0].localeCompare(b[0]);
        });
    }, [dayEvents]);

    const displayFilterLabel = React.useMemo(() => {
        if (activeFilter === 'All') return 'All';
        if (typeof activeFilter === 'string' && activeFilter.startsWith('client:')) {
            const clientName = activeFilter.replace(/^client:/, '');
            const ev = events.find(e => (e.clientName?.trim() || 'No Client') === clientName);
            return ev ? `${clientName}${ev.clientBrand ? ` (${ev.clientBrand})` : ''}` : clientName;
        }
        return activeFilter;
    }, [activeFilter, events]);

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

    const isLoading = loading || creativeLoading;

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            <header className="flex items-center justify-between mb-8 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/reminder')}
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
                            {dayEvents.length + dayCreativeEntries.length} Items • Filter: <span className="text-indigo-600">{displayFilterLabel}</span>
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

            {isLoading ? (
                <div className="text-center py-20 text-gray-400">Loading details...</div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid gap-4 pb-10">
                        {dayEvents.length === 0 && dayCreativeEntries.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                                <p className="text-gray-400 font-medium">No items found for {activeFilter}.</p>
                                <button onClick={handleAddEvent} className="mt-4 text-indigo-600 font-semibold text-sm hover:underline">
                                    Create one?
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Creative Entries Section */}
                                {dayCreativeEntries.length > 0 && (
                                    <section className="space-y-3">
                                        <div className="px-2">
                                            <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                                                <span>Creative Entries</span>
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{dayCreativeEntries.length}</span>
                                            </h4>
                                        </div>
                                        <div className="grid gap-4">
                                            {dayCreativeEntries.map(entry => (
                                                <div key={entry._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                                                    {/* Preview */}
                                                    <div className="w-32 h-24 bg-gray-100 rounded-lgflex-shrink-0 overflow-hidden relative group cursor-pointer" onClick={() => window.open(entry.filePath, '_blank')}>
                                                        {entry.mediaId.startsWith('vid') || entry.filePath.match(/\.(mp4|webm|ogg)$/i) ? (
                                                            <video src={entry.filePath} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <img src={entry.filePath} alt="Preview" className="w-full h-full object-cover" />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/opacity-0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                            {entry.mediaId.startsWith('vid') ? <FaVideo className="text-white drop-shadow-md" /> : <FaImage className="text-white drop-shadow-md" />}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <h5 className="font-bold text-gray-800 text-sm truncate">{entry.mediaId}</h5>
                                                            <div className="text-right">
                                                                <span className="text-xs text-gray-400 block">{format(parseISO(entry.createdAt), 'h:mm a')}</span>
                                                                <span className="text-[10px] text-gray-300">by {entry.username}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{entry.caption || 'No caption'}</p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100 font-medium">
                                                                {entry.category || 'Other'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Ordinary Events */}
                                {groupedByClient.map(([clientName, eventsForClient]) => (
                                    <section key={clientName} className="space-y-3">
                                        <div className="px-2">
                                            <h4 className="text-sm font-semibold text-gray-600">
                                                {clientName === 'No Client' ? 'No Client' : clientName}
                                                {eventsForClient[0]?.clientBrand && (
                                                    <span className="text-xs text-gray-400 font-normal ml-2">({eventsForClient[0].clientBrand})</span>
                                                )}
                                            </h4>
                                        </div>
                                        <div className="grid gap-4">
                                            {eventsForClient.map(event => (
                                                <EventCard
                                                    key={event._id}
                                                    event={event}
                                                    onEdit={() => handleEditEvent(event)}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </>
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
