import React from 'react';
import { useCalendarContext } from '../../context/CalendarContext';
import { format } from 'date-fns';

const MONTH_NAMES = [
    'January','February','March','April','May','June','July','August','September','October','November','December'
];

const Sidebar: React.FC = () => {
    const { currentDate, setMonth } = useCalendarContext();

    const currentMonth = currentDate.getMonth();
    
    return (
        <aside className="w-64 bg-white border-r border-gray-100 p-6 flex flex-col space-y-6 h-full">
            <div className="flex items-center space-x-2 px-2">
                <span className="font-bold text-xl text-gray-800 tracking-tight">AVAIO</span>
            </div>

            <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Select Month</h3>
                <div className="grid grid- gap-2 px-2">
                    {MONTH_NAMES.map((m, idx) => (
                        <button
                            key={m}
                            onClick={() => setMonth?.(idx)}
                            className={`px-3 py-2 text-sm rounded-lg text-left ${idx === currentMonth ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>
{/*<div className="mt-auto px-2">
                <div className="text-xs text-gray-400 mt-2">Today: {format(currentDate, 'MMMM d, yyyy')}</div>
            </div>
 */}
                    </aside>
    );
};

export default Sidebar;
