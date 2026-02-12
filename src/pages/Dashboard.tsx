import React from 'react';
import CalendarGrid from '../components/Calendar/CalendarGrid.tsx';
import { useCalendarContext } from '../context/CalendarContext';

const Dashboard: React.FC = () => {
    const { currentDate, daysRequired, activeFilter } = useCalendarContext();

    return (
        <CalendarGrid
            currentDate={currentDate}
            days={daysRequired}
            filter={activeFilter}
        />
    );
};

export default Dashboard;
