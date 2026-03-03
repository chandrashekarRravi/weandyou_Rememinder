import React, { useState } from 'react';
import { format, isSameMonth, isToday } from 'date-fns';
import type { EventType } from '../../hooks/useEvents';
import type { CreativeEntryType } from '../../hooks/useCreativeEntries';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { FaTimes, FaImage, FaVideo, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

interface DayCellProps {
    date: Date;
    currentMonth: Date;
    events: EventType[];
    creativeEntries?: CreativeEntryType[];
    onUpdateCreativeEntry: (id: string, updates: Partial<CreativeEntryType>) => Promise<void>;
    onDeleteCreativeEntry: (id: string) => Promise<void>;
}

const DayCell: React.FC<DayCellProps> = React.memo(({ date, currentMonth, events, creativeEntries = [], onUpdateCreativeEntry, onDeleteCreativeEntry }) => {
    const navigate = useNavigate();
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isDayToday = isToday(date);
    const [selectedEvent, setSelectedEvent] = useState<EventType | CreativeEntryType | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { user } = useAuth();

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
                    "h-22 min-h-22 p-1.5 border-b border-r border-gray-100 transition-colors cursor-pointer hover:bg-gray-50 flex flex-col",
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
                                    className={clsx(
                                        "text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium border-l-2 shadow-sm cursor-pointer hover:opacity-80 flex items-center gap-1",
                                        (entry.category === 'Special Day') && "bg-orange-50 text-orange-700 border-orange-400",
                                        (entry.category === 'Engagement') && "bg-stone-100 text-stone-600 border-stone-400",
                                        (entry.category === 'Ideation') && "bg-green-50 text-green-700 border-green-400",
                                        (entry.category === 'Other' || !entry.category) && "bg-blue-50 text-blue-700 border-blue-400",
                                    )}
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

            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
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

                        <div className="p-6 space-y-4 overflow-y-auto flex-1 h-full min-h-[400px]">
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column: Media & Caption */}
                                        <div className="space-y-4">
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-2 flex flex-col items-center justify-center bg-black/5 relative aspect-square w-full font-mono overflow-hidden">
                                                {selectedEvent.mediaId.startsWith('vid') || selectedEvent.filePath.match(/\.(mp4|webm|ogg)$/i) ? (
                                                    <video src={selectedEvent.filePath} controls className="max-h-full max-w-full rounded-lg" />
                                                ) : (
                                                    <img
                                                        src={selectedEvent.filePath}
                                                        alt="Preview"
                                                        className="max-h-full max-w-full rounded-lg object-contain cursor-pointer transition-transform hover:scale-[1.02]"
                                                        onClick={() => setSelectedImage(selectedEvent.filePath)}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase">Caption</label>
                                                <p className="text-gray-700 italic border-l-2 border-gray-200 pl-3 py-1">"{selectedEvent.caption}"</p>
                                            </div>
                                        </div>

                                        {/* Right Column: Details & Actions */}
                                        <div className="space-y-4">
                                            <div className=" p-4 rounded-xl border border-gray-100 space-y-3">
                                                <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-2">Entry Details</h3>

                                                <div className="flex justify-between items-center">
                                                    <label className="text-xs font-semibold text-gray-400 uppercase">Status</label>
                                                    <div className="flex items-center gap-2">
                                                        {user?.role === 'Team' ? (
                                                            <span className={clsx(
                                                                "px-2 py-1 rounded-md text-xs font-semibold border",
                                                                selectedEvent.status === 'Approved' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                    selectedEvent.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                            )}>
                                                                {selectedEvent.status || 'Pending'}
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <select
                                                                    value={selectedEvent.status || 'Pending'}
                                                                    onChange={(e) => {
                                                                        const newStatus = e.target.value as any;
                                                                        setSelectedEvent({ ...selectedEvent, status: newStatus });
                                                                    }}
                                                                    className={clsx(
                                                                        "px-2 py-1 rounded-md text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500",
                                                                        selectedEvent.status === 'Approved' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                            selectedEvent.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                                'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                                    )}
                                                                >
                                                                    <option value="Pending">Pending</option>
                                                                    <option value="Approved">Approved</option>
                                                                    <option value="Rejected">Rejected</option>
                                                                </select>
                                                                <button
                                                                    onClick={async () => {
                                                                        await onUpdateCreativeEntry(selectedEvent._id, { status: selectedEvent.status });
                                                                        alert('Status Saved!');
                                                                    }}
                                                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold underline"
                                                                >
                                                                    Save
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-semibold text-gray-400 uppercase">Media ID</label>
                                                    <p className="text-gray-800 font-mono text-sm">{selectedEvent.mediaId}</p>
                                                </div>

                                                {selectedEvent.clientName && (
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-400 uppercase">Client</label>
                                                        <p className="text-gray-800 font-medium">{selectedEvent.clientName}</p>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="text-xs font-semibold text-gray-400 uppercase">Category</label>
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded text-[10px] font-medium border",
                                                        (selectedEvent.category === 'Special Day') && "bg-orange-50 text-orange-700 border-orange-200",
                                                        (selectedEvent.category === 'Engagement') && "bg-stone-50 text-stone-600 border-stone-200",
                                                        (selectedEvent.category === 'Ideation') && "bg-green-50 text-green-700 border-green-200",
                                                        (selectedEvent.category === 'Other' || !selectedEvent.category) && "bg-blue-50 text-blue-700 border-blue-200",
                                                    )}>
                                                        {selectedEvent.category || 'Other'}
                                                    </span>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-semibold text-gray-400 uppercase">Posted Date</label>
                                                    <p className="text-gray-800">{format(new Date(selectedEvent.date), 'MMM d, yyyy')}</p>
                                                </div>

                                                <div className="pt-2 border-t border-indigo-100">
                                                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Uploaded By</label>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs text-gray-600">{selectedEvent.username}</p>
                                                        <p className="text-[10px] text-gray-400">{new Date(selectedEvent.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {user?.role !== 'Team' && (
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to delete this Creative Entry?')) {
                                                            await onDeleteCreativeEntry(selectedEvent._id);
                                                            setSelectedEvent(null);
                                                        }
                                                    }}
                                                    className="w-full py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                                >
                                                    <FaTrash className="text-xs" />
                                                    Delete Entry
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            src={selectedImage}
                            alt="Fullscreen Creative"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
});

export default DayCell;
