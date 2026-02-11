import React from 'react';
import DayCell from './DayCell';
import { useEvents } from '../../hooks/useEvents';
import { isSameDay } from 'date-fns';

interface MonthGridProps {
    currentDate: Date;
    days: Date[];
    filter: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MonthGrid: React.FC<MonthGridProps> = ({ currentDate, days, filter }) => {
    const { events } = useEvents(currentDate);

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
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
                {WEEKDAYS.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {days.map((day) => (
                    <DayCell
                        key={day.toISOString()}
                        date={day}
                        currentMonth={currentDate}
                        events={getEventsForDay(day)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MonthGrid;
