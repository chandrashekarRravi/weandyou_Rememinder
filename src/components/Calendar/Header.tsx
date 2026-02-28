import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import CreativeEntryModal from '../CreativeEntryModal';
import { useEvents } from '../../hooks/useEvents';
import { useCalendarContext } from '../../context/CalendarContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps { }

const PAGES = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Reminders', to: '/reminder' },
];

const Header: React.FC<HeaderProps> = () => {
    const [open, setOpen] = useState(false);
    const [isCreativeModalOpen, setIsCreativeModalOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const ref = useRef<HTMLDivElement | null>(null);

    const { user, logout } = useAuth();

    // Stats Logic for Dashboard Header
    const { currentDate } = useCalendarContext();
    const { events } = useEvents(currentDate);

    const total = events.length;
    const pending = events.filter(e => e.status === 'Pending').length;
    const ongoing = events.filter(e => e.status === 'Ongoing').length;
    const completed = events.filter(e => e.status === 'Completed').length;

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setOpen(false);
    };

    return (
        <header className="flex items-center justify-between px-8 py-1 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 relative">

            {/* Left Side: Logo & Navigation */}
            <div className="flex items-center gap-16">
                {/* Logo */}
                <div className="flex items-center">
                    <img src="/AVAIO.png" alt="AVAIO" className="h-16 w-auto object-contain" />
                </div>

                {/* Navigation */}
                <nav className="flex items-center space-x-8">
                    {PAGES.filter(p => user?.role !== 'Client' || p.label === 'Dashboard').map(p => (
                        <NavLink
                            key={p.to}
                            to={p.to}
                            className={({ isActive }) => isActive
                                ? 'text-indigo-600 font-bold text-base border-b-2 border-indigo-600 pb-0.5'
                                : 'text-gray-500 hover:text-indigo-600 font-medium text-base transition-colors pb-0.5 border-b-2 border-transparent hover:border-indigo-100'}
                        >
                            {p.label}
                        </NavLink>
                    ))}
                    {user?.role === 'Admin' && (
                        <NavLink
                            to="/clients"
                            className={({ isActive }) => isActive
                                ? 'text-indigo-600 font-bold text-base border-b-2 border-indigo-600 pb-0.5'
                                : 'text-gray-500 hover:text-indigo-600 font-medium text-base transition-colors pb-0.5 border-b-2 border-transparent hover:border-indigo-100'}
                        >
                            Clients
                        </NavLink>
                    )}
                </nav>            </div>

            {/* Right: Stats, Actions, Profile */}
            <div className="flex items-center space-x-6">

                {/* Stats Grid (Dashboard Only) */}
                {location.pathname === '/' && user?.role !== 'Client' && (
                    <div className="flex items-center space-x-2 mr-4">
                        <div className="flex flex-col items-center px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total</span>
                            <span className="text-sm font-bold text-gray-800">{total}</span>
                        </div>
                        <div className="flex flex-col items-center px-3 py-1 bg-yellow-50 rounded-lg border border-yellow-100">
                            <span className="text-[10px] text-yellow-600 uppercase font-bold tracking-wider">Pending</span>
                            <span className="text-sm font-bold text-yellow-700">{pending}</span>
                        </div>
                        <div className="flex flex-col items-center px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">
                            <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Ongoing</span>
                            <span className="text-sm font-bold text-blue-700">{ongoing}</span>
                        </div>
                        <div className="flex flex-col items-center px-3 py-1 bg-green-50 rounded-lg border border-green-100">
                            <span className="text-[10px] text-green-600 uppercase font-bold tracking-wider">Done</span>
                            <span className="text-sm font-bold text-green-700">{completed}</span>
                        </div>
                    </div>
                )}

                {/* New + Button (Dashboard Only) */}
                {location.pathname === '/' && user?.role !== 'Client' && (
                    <button
                        onClick={() => setIsCreativeModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        New +
                    </button>
                )}

                <div className="relative" ref={ref}>
                    <button
                        onClick={() => setOpen(v => !v)}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:shadow hover:bg-gray-200 transition-all"
                        aria-label="User menu"
                    >
                        <FaUserCircle size={24} />
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 animate-fade-in-down">
                            <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b border-gray-50 mb-1">
                                <div className="font-bold">{user?.username}</div>
                                <div className="text-xs text-indigo-500 uppercase">{user?.role}</div>
                            </div>
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <CreativeEntryModal
                isOpen={isCreativeModalOpen}
                onClose={() => setIsCreativeModalOpen(false)}
                onSuccess={() => {
                    // Ideally trigger a refresh if needed
                    // window.location.reload(); // Simple brute force or use context
                }}
            />
        </header>
    );
};

export default Header;
