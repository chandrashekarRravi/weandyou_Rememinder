import React, { useState } from 'react';
import { format, isSameMonth, isToday } from 'date-fns';
import type { EventType } from '../../hooks/useEvents';
import type { CreativeEntryType } from '../../hooks/useCreativeEntries';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { FaTimes, FaImage, FaVideo } from 'react-icons/fa';

interface DayCellProps {
    date: Date;
    currentMonth: Date;
    events: EventType[];
    creativeEntries?: CreativeEntryType[];
}

const DayCell: React.FC<DayCellProps> = React.memo(({ date, currentMonth, events, creativeEntries = [] }) => {
    const navigate = useNavigate();
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isDayToday = isToday(date);
    const [selectedEvent, setSelectedEvent] = useState<EventType | CreativeEntryType | null>(null);

    const handleClick = () => {
        navigate(`/day/${format(date, 'yyyy-MM-dd')}`);
    };

    const handleEventClick = (e: React.MouseEvent, item: EventType | CreativeEntryType) => {
        e.stopPropagation();
        setSelectedEvent(item);
    };

    // Merge and sort by time/creation if possible, for now just concat
    // We treat CreativeEntries as items to display.
    // Let's combine them for the limit check.
    const allItems = [
        ...events.map(e => ({ type: 'event' as const, data: e })),
        ...creativeEntries.map(e => ({ type: 'creative' as const, data: e }))
    ];

    const visibleItems = allItems.slice(0, 3);
    const overflowCount = allItems.length - 3;

    return (
        <>
            <div
                onClick={handleClick}
                className={clsx(
                    "min-height-[120px] p-2 border-b border-r border-gray-100 transition-colors cursor-pointer hover:bg-gray-50",
                    !isCurrentMonth && "bg-gray-50/50 text-gray-400",
                    isCurrentMonth && "bg-white",
                )}
            >
                <div className="flex justify-between items-start mb-2">
                    <span
                        className={clsx(
                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                            isDayToday
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                : "text-gray-700"
                        )}
                    >
                        {format(date, 'd')}
                    </span>
                    {allItems.length > 0 && <span className="text-xs text-gray-400 font-medium">{allItems.length}</span>}
                </div>

                <div className="space-y-1">
                    {visibleItems.map((item) => {
                        if (item.type === 'event') {
                            const event = item.data as EventType;
                            return (
                                <div
                                    key={event._id}
                                    onClick={(e) => handleEventClick(e, event)}
                                    className={clsx(
                                        "text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium border-l-2 shadow-sm cursor-pointer hover:opacity-80",
                                        event.category === 'Special Day' && "bg-orange-50 text-orange-700 border-orange-400",
                                        event.category === 'Engagement' && "bg-stone-100 text-stone-600 border-stone-400",
                                        event.category === 'Ideation' && "bg-green-50 text-green-700 border-green-400",
                                        event.category === 'Other' && "bg-blue-50 text-blue-700 border-blue-400",
                                    )}
                                >
                                    {event.title}
                                </div>
                            );
                        } else {
                            const entry = item.data as CreativeEntryType;
                            return (
                                <div
                                    key={entry._id}
                                    onClick={(e) => handleEventClick(e, entry)}
                                    className="text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium border-l-2 shadow-sm cursor-pointer hover:opacity-80 bg-purple-50 text-purple-700 border-purple-400 flex items-center gap-1"
                                >
                                    {entry.mediaId.startsWith('img') ? <FaImage size={8} /> : <FaVideo size={8} />}
                                    {entry.caption || entry.mediaId}
                                </div>
                            );
                        }
                    })}
                    {overflowCount > 0 && (
                        <div className="text-[10px] text-gray-400 pl-1">
                            +{overflowCount} more
                        </div>
                    )}
                </div>
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            {/* Title based on type */}
                            <h2 className="text-xl font-bold text-gray-800">
                                {'title' in selectedEvent ? selectedEvent.title : 'Creative Entry'}
                            </h2>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto max-h-96">
                            {'title' in selectedEvent ? (
                                // Event Details
                                <>
                                    {selectedEvent.clientName && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase">Client</label>
                                            <p className="text-gray-800">{selectedEvent.clientName}</p>
                                        </div>
                                    )}
                                    {selectedEvent.clientBrand && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase">Brand</label>
                                            <p className="text-gray-800">{selectedEvent.clientBrand}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Category</label>
                                        <p className="text-gray-800">{selectedEvent.category}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Status</label>
                                        <p className="text-gray-800">{selectedEvent.status}</p>
                                    </div>
                                    {selectedEvent.startTime && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase">Time</label>
                                            <p className="text-gray-800">{selectedEvent.startTime} {selectedEvent.endTime && `- ${selectedEvent.endTime}`}</p>
                                        </div>
                                    )}
                                    {selectedEvent.description && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase">Description</label>
                                            <p className="text-gray-700">{selectedEvent.description}</p>
                                        </div>
                                    )}
                                    {selectedEvent.review && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase">Review</label>
                                            <p className="text-gray-700">{selectedEvent.review}</p>
                                        </div>
                                    )}
                                    {selectedEvent.captions && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase">Captions</label>
                                            <p className="text-gray-700">{selectedEvent.captions}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                // Creative Entry Details
                                <>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Media ID</label>
                                        <p className="text-gray-800 font-mono">{selectedEvent.mediaId}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Uploaded By</label>
                                        <p className="text-gray-800">{selectedEvent.username}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Submitted At</label>
                                        <p className="text-gray-800">{new Date(selectedEvent.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Caption</label>
                                        <p className="text-gray-700 italic">"{selectedEvent.caption}"</p>
                                    </div>
                                    <div className="mt-4">
                                        <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Preview</label>
                                        {selectedEvent.mediaId.startsWith('vid') || selectedEvent.filePath.match(/\.(mp4|webm|ogg)$/i) ? (
                                            <video src={selectedEvent.filePath} controls className="w-full rounded-lg bg-black" />
                                        ) : (
                                            <img src={selectedEvent.filePath} alt="Preview" className="w-full rounded-lg bg-gray-50 object-contain" />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

export default DayCell;
