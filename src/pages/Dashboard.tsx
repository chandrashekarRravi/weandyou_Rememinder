import React, { useState } from 'react';
import MonthGrid from '../components/Calendar/MonthGrid';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Calendar/Header';
import { useCalendar } from '../hooks/useCalendar';

const Dashboard: React.FC = () => {
    const {
        currentDate,
        daysRequired,
        monthLabel,
        nextMonth,
        prevMonth
    } = useCalendar();

    const [activeFilter, setActiveFilter] = useState<string>('All');

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    monthLabel={monthLabel}
                    onNextMonth={nextMonth}
                    onPrevMonth={prevMonth}
                />

                <main className="flex-1 overflow-y-auto p-6">
                    <MonthGrid
                        currentDate={currentDate}
                        days={daysRequired}
                        filter={activeFilter}
                    />
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
