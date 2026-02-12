import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useCalendar as useCalendarHook } from '../hooks/useCalendar';

interface CalendarContextType {
    currentDate: Date;
    daysRequired: Date[];
    monthLabel: string;
    nextMonth: () => void;
    prevMonth: () => void;
    nextWeek: () => void;
    prevWeek: () => void;
    currentWeekIndex: number;
    setCurrentWeekIndex: React.Dispatch<React.SetStateAction<number>>;
    setMonth?: (monthIndex: number) => void;

    activeFilter: string;
    setActiveFilter: (filter: string) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Lift useCalendar state here
    const calendarLogic = useCalendarHook();

    // Lift Filter state here
    const [activeFilter, setActiveFilter] = useState('All');

    // Lift Week Index state here (so it persists or resets appropriately)
    // Actually, typically week index resets when month changes, which useCalendar might not handle directly yet if it was local to Grid.
    // Let's keep week index in the Context so it persists when switching views
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    // Reset week index when month changes (optional, but good UX)
    React.useEffect(() => {
        setCurrentWeekIndex(0);
    }, [calendarLogic.currentDate]);

    const value = {
        ...calendarLogic,
        currentWeekIndex,
        setCurrentWeekIndex,
        activeFilter,
        setActiveFilter
    };

    return (
        <CalendarContext.Provider value={value}>
            {children}
        </CalendarContext.Provider>
    );
};

export const useCalendarContext = () => {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error('useCalendarContext must be used within a CalendarProvider');
    }
    return context;
};
