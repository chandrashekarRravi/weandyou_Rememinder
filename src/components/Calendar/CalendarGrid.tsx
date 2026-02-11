import React from 'react';
import DayCell from './DayCell';
import { useEvents } from '../../hooks/useEvents';
import { isSameDay } from 'date-fns';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import clsx from 'clsx';
import { useCalendarContext } from '../../context/CalendarContext';

interface CalendarGridProps {
    currentDate: Date; // The month we are viewing
    days: Date[]; // All days in the month view (including padding)
    filter: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentDate, days, filter }) => {
    const { events } = useEvents(currentDate);
    // Use global week index from context so it persists
    const { currentWeekIndex, setCurrentWeekIndex } = useCalendarContext();

    // Split days into weeks (chunks of 7)
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const currentWeekDays = weeks[currentWeekIndex] || [];

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
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                {WEEKDAYS.map(day => (
                    <div key={day} className="py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Current Week Days Grid */}
            <div className="grid grid-cols-3 flex-1 auto-rows-fr transition-all duration-300 ease-in-out">
                {currentWeekDays.map((day) => (
                    <DayCell
                        key={day.toISOString()}
                        date={day}
                        currentMonth={currentDate}
                        events={getEventsForDay(day)}
                    />
                ))}
            </div>

            {/* Week Pagination */}
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
            </div>
        </div>
    );
};

export default CalendarGrid;
