import React, { useState, useRef, useEffect } from 'react';
import DayCell from './DayCell';
import { useEvents } from '../../hooks/useEvents';
import { useCreativeEntries } from '../../hooks/useCreativeEntries';
import { isSameDay, parseISO } from 'date-fns';
import { useCalendarContext } from '../../context/CalendarContext';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarGridProps {
    currentDate: Date; // The month we are viewing
    days: Date[]; // All days in the month view (including padding)
    filter: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentDate, days, filter }) => {
    const { events } = useEvents(currentDate);
    const { creativeEntries, updateEntry, deleteEntry } = useCreativeEntries(currentDate);
    // Local state to control client dropdown visibility
    const [clientOpen, setClientOpen] = useState(false);
    const clientRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDocClick = (ev: MouseEvent) => {
            if (clientRef.current && !clientRef.current.contains(ev.target as Node)) {
                setClientOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    // Use global week index from context so it persists
    const { activeFilter, setActiveFilter, monthLabel } = useCalendarContext();

    // Split days into weeks (chunks of 7)
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const getEventsForDay = (date: Date) => {
        return events.filter(event => {
            const isSameDate = isSameDay(new Date(event.date), date);
            if (!isSameDate) return false;

            if (filter === 'All') return true;

            // Status filters
            if (filter === 'Pending' || filter === 'Ongoing' || filter === 'Completed') {
                return event.status === filter;
            }

            // Client filter (format: "client:Client Name")
            if (typeof filter === 'string' && filter.startsWith('client:')) {
                const clientName = filter.replace(/^client:/, '');
                return (event.clientName?.trim() || 'No Client') === clientName;
            }

            // Category fallback
            return event.category === filter;
        });
    };

    const getCreativeEntriesForDay = (date: Date) => {
        return creativeEntries.filter(entry => {
            const entryDateStr = entry.date || entry.createdAt;
            if (!entryDateStr) return false;

            const isSameDate = isSameDay(parseISO(entryDateStr), date);
            if (!isSameDate) return false;

            if (filter === 'All') return true;

            // Creative Entries currently only support Category filtering
            // if (['Pending', 'Ongoing', 'Completed'].includes(filter) || filter.startsWith('client:')) {
            //     return false;
            // }

            // Status Filtering for Creative Entries
            if (filter === 'Pending') return entry.status === 'Pending'; // 'Pending' -> 'Pending' (Review)
            if (filter === 'Ongoing') return entry.status === 'Approved'; // 'Ongoing' -> 'Approved'
            if (filter === 'Completed') return false; // Creative Entries don't have 'Completed' status

            if (filter.startsWith('client:')) return false; // No client for Creative Entries

            // Category match (default to 'Other' if missing)
            const cat = entry.category || 'Other';
            return cat === filter;
        });
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Month label at top */}
            <div className="p-4 border-b border-gray-100 bg-white text-center overflow-hidden relative h-12">
                <AnimatePresence mode='wait'>
                    <motion.h2
                        key={monthLabel}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-lg font-semibold text-gray-800 absolute w-full"
                    >
                        {monthLabel}
                    </motion.h2>
                </AnimatePresence>
            </div>

            {/* Controls above calendar: Category & Status (moved from Sidebar) */}
            <div className="flex items-center justify-between gap-3 p-3 border-b border-gray-100 bg-white">
                <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-500">Client</label>

                    {/* Client Dropdown */}
                    <div className="relative" ref={clientRef}>
                        <button
                            onClick={() => setClientOpen(!clientOpen)}
                            className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-sm w-64 flex justify-between items-center text-gray-700"
                        >
                            <span className="truncate">
                                {activeFilter.startsWith('client:') ? activeFilter.replace(/^client:/, '') : 'All Clients'}
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* dropdown list */}
                        {clientOpen && (
                            <div className="absolute mt-1 w-64 bg-white border border-gray-100 rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-20">
                                <button
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                                    onClick={() => { setActiveFilter('All'); setClientOpen(false); }}
                                >
                                    All Clients
                                </button>

                                {Array.from(new Map(events.map(ev => [
                                    (ev.clientName?.trim() || 'No Client'),
                                    { name: ev.clientName?.trim() || 'No Client', brand: ev.clientBrand }
                                ]))).map(([, c]) => {
                                    return (
                                        <button
                                            key={c.name}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between items-center transition-colors border-t border-gray-50"
                                            onClick={() => { setActiveFilter(`client:${c.name}`); setClientOpen(false); }}
                                        >
                                            <span className="truncate font-medium text-gray-700">{c.name}</span>
                                            {c.brand && <span className="text-xs text-gray-400 ml-2 truncate max-w-[80px]">({c.brand})</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-500">Category</label>
                        <select
                            value={['Special Day', 'Engagement', 'Ideation', 'Other'].includes(activeFilter) ? activeFilter : 'All'}
                            onChange={(e) => setActiveFilter(e.target.value)}
                            className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-sm"
                        >
                            <option value="All">All</option>
                            <option value="Special Day">Special Day</option>
                            <option value="Engagement">Engagement</option>
                            <option value="Ideation">Ideation</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-500">Status</label>
                        <select
                            value={['Pending', 'Ongoing', 'Completed'].includes(activeFilter) ? activeFilter : 'All'}
                            onChange={(e) => setActiveFilter(e.target.value)}
                            className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-sm"
                        >
                            <option value="All">All</option>
                            <option value="Pending">Review</option>
                            <option value="Ongoing">Approved</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>
            </div>
            {/* Transposed month grid: left column = weekday labels, top row = week numbers */}
            <div className="flex-1 overflow-auto">
                <div
                    className="inline-grid w-full"
                    style={{ gridTemplateColumns: `120px repeat(${weeks.length}, minmax(0, 1fr))` }}
                >{/* Top-left header 
                    <div className="p-2 border-b border-r border-gray-100 bg-gray-50/50 flex items-center justify-center font-bold text-sm">WEEK</div>

                    Week number headers 
                    {weeks.map((_, widx) => (
                        <div key={widx} className="p-2 border-b border-r border-gray-100 bg-gray-50/50 text-center text-sm font-semibold">
                            {widx + 1}
                        </div>
                    ))}
 */}

                    {/* Weekday rows */}
                    {WEEKDAYS.map((wd, dayIdx) => (
                        // For each weekday, render label then cells for each week
                        <React.Fragment key={wd}>
                            <div className="p-3 border-b border-r border-gray-100 bg-gray-50/50 flex items-center justify-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {wd}
                            </div>
                            {weeks.map((week, widx) => {
                                const day = week[dayIdx];
                                return (
                                    <div key={String(day?.toISOString()) + widx} className="border-b border-r border-gray-100">
                                        {day ? (
                                            <DayCell
                                                date={day}
                                                currentMonth={currentDate}
                                                events={getEventsForDay(day)}
                                                creativeEntries={getCreativeEntriesForDay(day)}
                                                onUpdateCreativeEntry={updateEntry}
                                                onDeleteCreativeEntry={deleteEntry}
                                            />
                                        ) : (
                                            <div className="p-2 h-full bg-gray-50" />
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Week Pagination
            <div className="py-4 flex items-center justify-center space-x-2 border-t border-gray-100 bg-white">
                <button
                    onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentWeekIndex === 0}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <FaChevronLeft size={14} />
                </button>

                {weeks.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentWeekIndex(idx)}
                        className={clsx(
                            "w-8 h-8 rounded-full text-sm font-medium transition-all duration-200",
                            currentWeekIndex === idx
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-110"
                                : "text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        {idx + 1}
                    </button>
                ))}

                <button
                    onClick={() => setCurrentWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
                    disabled={currentWeekIndex === weeks.length - 1}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <FaChevronRight size={14} />
                </button>
            </div> */}

        </div>
    );
};

export default CalendarGrid;
