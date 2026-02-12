import React from 'react';
import clsx from 'clsx';
import { FaCalendarAlt, FaCheck, FaHourglassHalf, FaRegClock } from 'react-icons/fa';

interface SidebarProps {
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
}

const FILTERS = [
    { id: 'All', label: 'All Events', color: 'bg-indigo-500', icon: FaCalendarAlt },
    { id: 'Special Day', label: 'Special Days', color: 'bg-orange-500', icon: FaCalendarAlt },
    { id: 'Engagement', label: 'Engagement', color: 'bg-stone-500', icon: FaCalendarAlt },
    { id: 'Ideation', label: 'Ideation', color: 'bg-green-500', icon: FaCalendarAlt },
];

const STATUS_FILTERS = [
    { id: 'Pending', label: 'Review', color: 'bg-gray-400', icon: FaRegClock },
    { id: 'Ongoing', label: 'Approved', color: 'bg-blue-500', icon: FaHourglassHalf },
    { id: 'Completed', label: 'Completed', color: 'bg-green-600', icon: FaCheck },
];

const Sidebar: React.FC<SidebarProps> = ({ activeFilter, setActiveFilter }) => {
    return (
        <aside className="w-64 bg-white border-r border-gray-100 p-6 flex flex-col space-y-8 h-full">
            <div className="flex items-center space-x-2 px-2">
                {/*<div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <FaCalendarAlt className="text-white text-sm" />
                </div> */}

                <span className="font-bold text-xl text-gray-800 tracking-tight">AVAIO</span>
            </div>

            <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Categories</h3>
                <div className="space-y-1">
                    {FILTERS.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={clsx(
                                "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                activeFilter === filter.id
                                    ? "bg-gray-900 text-white shadow-lg shadow-gray-200 scale-105"
                                    : "text-gray-600 hover:bg-gray-50 hover:pl-4"
                            )}
                        >
                            <span className={clsx("w-2 h-2 rounded-full", filter.color)} />
                            <span className="text-sm font-medium">{filter.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Status</h3>
                <div className="space-y-1">
                    {STATUS_FILTERS.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={clsx(
                                "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                activeFilter === filter.id
                                    ? "bg-gray-900 text-white shadow-lg shadow-gray-200 scale-105"
                                    : "text-gray-600 hover:bg-gray-50 hover:pl-4"
                            )}
                        >
                            <filter.icon className={clsx("text-xs opacity-70")} />
                            <span className="text-sm font-medium">{filter.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            {/* Pro Tip
            <div className="mt-auto px-2">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <h4 className="text-indigo-900 font-semibold text-sm mb-1">Pro Tip</h4>
                    <p className="text-indigo-700 text-xs leading-relaxed">
                        Click on any date to manage events.
                    </p>
                </div>
            </div>  */}

        </aside>
    );
};

export default Sidebar;
