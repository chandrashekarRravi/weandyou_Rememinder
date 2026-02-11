import React from 'react';
import { format, isSameMonth, isToday } from 'date-fns';
import type { EventType } from '../../hooks/useEvents';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface DayCellProps {
    date: Date;
    currentMonth: Date;
    events: EventType[];
}

const DayCell: React.FC<DayCellProps> = React.memo(({ date, currentMonth, events }) => {
    const navigate = useNavigate();
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isDayToday = isToday(date);

    const handleClick = () => {
        navigate(`/day/${format(date, 'yyyy-MM-dd')}`);
    };

    const visibleEvents = events.slice(0, 3);
    const overflowCount = events.length - 3;

    return (
        <div
            onClick={handleClick}
            className={clsx(
                "min-h-[120px] p-2 border-b border-r border-gray-100 transition-colors cursor-pointer hover:bg-gray-50",
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
                {events.length > 0 && <span className="text-xs text-gray-400 font-medium">{events.length}</span>}
            </div>

            <div className="space-y-1">
                {visibleEvents.map(event => (
                    <div
                        key={event._id}
                        className={clsx(
                            "text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium border-l-2 shadow-sm",
                            event.category === 'Special Day' && "bg-orange-50 text-orange-700 border-orange-400",
                            event.category === 'Engagement' && "bg-stone-100 text-stone-600 border-stone-400",
                            event.category === 'Ideation' && "bg-green-50 text-green-700 border-green-400",
                            event.category === 'Other' && "bg-blue-50 text-blue-700 border-blue-400",
                        )}
                    >
                        {event.title}
                    </div>
                ))}
                {overflowCount > 0 && (
                    <div className="text-[10px] text-gray-400 pl-1">
                        +{overflowCount} more
                    </div>
                )}
            </div>
        </div>
    );
});

export default DayCell;
