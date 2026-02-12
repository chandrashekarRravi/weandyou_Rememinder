import React from 'react';
import DayCell from './DayCell';
import { useEvents } from '../../hooks/useEvents';
import { isSameDay } from 'date-fns';
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
            if (filter === 'Pending' || filter === 'Ongoing' || filter === 'Completed') {
                return event.status === filter;
            }
            return event.category === filter;
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
            <div className="flex items-center justify-end gap-3 p-3 border-b border-gray-100 bg-white">
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
            {/* Transposed month grid: left column = weekday labels, top row = week numbers */}
            <div className="flex-1 overflow-auto">
                <div
                    className="inline-grid w-full"
                    style={{ gridTemplateColumns: `120px repeat(${weeks.length}, minmax(0, 1fr))` }}
                >
                    {/* Top-left header */}
                    <div className="p-2 border-b border-r border-gray-100 bg-gray-50/50 flex items-center justify-center font-bold text-sm">WEEK</div>

                    {/* Week number headers */}
                    {weeks.map((_, widx) => (
                        <div key={widx} className="p-2 border-b border-r border-gray-100 bg-gray-50/50 text-center text-sm font-semibold">
                            {widx + 1}
                        </div>
                    ))}

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
