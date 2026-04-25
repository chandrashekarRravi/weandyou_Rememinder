import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav: React.FC = () => {
    const { user } = useAuth();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50 pb-safe">
            <div className="flex justify-around items-center h-16 px-2">
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                        }`
                    }
                >
                    <FaHome className="w-6 h-6" />
                    <span className="text-[10px] font-medium leading-none">Dashboard</span>
                </NavLink>

                <NavLink
                    to="/reminder"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                        }`
                    }
                >
                    <FaCalendarAlt className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium leading-none">Calendar</span>
                </NavLink>

                {(user?.role === 'Admin' || user?.username?.toLowerCase().includes('bhuvan')) && (
                    <NavLink
                        to="/clients"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                            }`
                        }
                    >
                        <FaUsers className="w-6 h-6" />
                        <span className="text-[10px] font-medium leading-none">Clients</span>
                    </NavLink>
                )}
                {user?.role !== 'Client' && (
                    <NavLink
                        to="/tasks"
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                            }`
                        }
                    >
                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        <span className="text-[10px] font-medium leading-none">Tasks</span>
                    </NavLink>
                )}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
