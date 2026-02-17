import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useCalendar as useCalendarHook } from '../hooks/useCalendar';

export interface FilterState {
    client: string;
    category: string;
    status: string;
}

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

    activeFilter: FilterState;
    setActiveFilter: (filter: Partial<FilterState>) => void;
    resetFilters: () => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Lift useCalendar state here
    const calendarLogic = useCalendarHook();

    // Lift Filter state here
    const [activeFilter, setActiveFilterState] = useState<FilterState>({
        client: 'All',
        category: 'All',
        status: 'All'
    });

    const setActiveFilter = (updates: Partial<FilterState>) => {
        setActiveFilterState(prev => ({ ...prev, ...updates }));
    };

    const resetFilters = () => {
        setActiveFilterState({ client: 'All', category: 'All', status: 'All' });
    };

    // Lift Week Index state here (so it persists or resets appropriately)
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
        setActiveFilter,
        resetFilters
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
