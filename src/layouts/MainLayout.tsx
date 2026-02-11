import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Calendar/Header';
import { useCalendarContext } from '../context/CalendarContext';

const MainLayout: React.FC = () => {
    const {
        monthLabel,
        nextMonth,
        prevMonth,
        activeFilter,
        setActiveFilter
    } = useCalendarContext();

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Persistent Sidebar */}
            <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Persistent Header */}
                <Header
                    monthLabel={monthLabel}
                    onNextMonth={nextMonth}
                    onPrevMonth={prevMonth}
                />

                {/* Page Content (Dashboard or DayDetails) */}
                <main className="flex-1 overflow-y-auto p-6 relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
