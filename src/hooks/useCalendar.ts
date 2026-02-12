import { useState, useMemo } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addWeeks,
    subWeeks
} from 'date-fns';

export const useCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const setMonth = (monthIndex: number) => setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

    const daysRequired = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        return eachDayOfInterval({
            start: startDate,
            end: endDate
        });
    }, [currentDate]);

    const monthLabel = format(currentDate, 'MMMM yyyy');

    return {
        currentDate,
        daysRequired,
        monthLabel,
        nextMonth,
        prevMonth,
        setMonth,
        nextWeek,
        prevWeek,
        isSameMonth,
        isSameDay
    };
};
