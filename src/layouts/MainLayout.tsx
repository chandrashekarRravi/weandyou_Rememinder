import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Calendar/Header';
import { useCalendarContext } from '../context/CalendarContext';

const MainLayout: React.FC = () => {
    const {
        activeFilter,
        setActiveFilter
    } = useCalendarContext();

    const location = useLocation();
    const showSidebar = location.pathname === '/reminder' || location.pathname === '/review';

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Persistent Header */}
            <Header />

            {/* Content Area (Sidebar + Main) */}
            <div className="flex flex-1 overflow-hidden">
                {/* Conditional Sidebar */}
                {showSidebar && <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Page Content (Dashboard or DayDetails) */}
                    <main className="flex-1 overflow-y-auto p-6 relative">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;
