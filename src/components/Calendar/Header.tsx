import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import CreativeEntryModal from '../CreativeEntryModal';
import { useEvents } from '../../hooks/useEvents';
import { useCreativeEntries } from '../../hooks/useCreativeEntries';
import { useCalendarContext } from '../../context/CalendarContext';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Navigation/NotificationBell';

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
    const { events } = useEvents(currentDate, { fetchAll: true });
    // Also fetch all creative entries for stats
    const { creativeEntries } = useCreativeEntries(currentDate, { fetchAll: true });

    // Combine both models for accurate total state:
    // Calendar events have statuses: Pending, Ongoing, Completed
    // Creative entries have statuses: Pending (or null), Approved, Rejected
    // We'll map Approved -> Ongoing, Rejected -> Completed (or omit Rejected from completed?)
    const total = events.length + creativeEntries.length;

    const pendingEvents = events.filter(e => e.status === 'Pending').length;
    const pendingEntries = creativeEntries.filter(e => !e.status || e.status === 'Pending').length;
    const pending = pendingEvents + pendingEntries;

    const ongoingEvents = events.filter(e => e.status === 'Ongoing').length;
    const ongoingEntries = creativeEntries.filter(e => e.status === 'Approved').length;
    const ongoing = ongoingEvents + ongoingEntries;

    const completedEvents = events.filter(e => e.status === 'Completed').length;
    // Assuming Rejected entries shouldn't necessarily be "Completed"? Or maybe they should? 
    // Wait, the user has "correct and wrong button". "Approved" means "Ongoing". 
    // Let's just count Completed events for the "Done" stat for now.
    const completed = completedEvents;

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
        <header className="flex items-center justify-between px-6 md:px-12 py-1 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 relative">

            {/* Left Side: Logo & Navigation */}
            <div className="flex items-center gap-8 md:gap-16">
                {/* Logo */}
                <div className="flex items-center">
                    <img src="/IMG_6540.PNG" alt="WE & You" className="h-16 md:h-16 w-auto rounded-full object-contain" />
                </div>

                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-8">
                    {PAGES.map(p => (
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
                    {(user?.role === 'Admin' || user?.username?.toLowerCase().includes('bhuvan')) && (
                        <NavLink
                            to="/clients"
                            className={({ isActive }) => isActive
                                ? 'text-indigo-600 font-bold text-base border-b-2 border-indigo-600 pb-0.5'
                                : 'text-gray-500 hover:text-indigo-600 font-medium text-base transition-colors pb-0.5 border-b-2 border-transparent hover:border-indigo-100'}
                        >
                            Management
                        </NavLink>
                    )}
                    {user?.role !== 'Client' && (
                        <NavLink
                            to="/tasks"
                            className={({ isActive }) => isActive
                                ? 'text-indigo-600 font-bold text-base border-b-2 border-indigo-600 pb-0.5 flex items-center gap-2'
                                : 'text-gray-500 hover:text-indigo-600 font-medium text-base transition-colors pb-0.5 border-b-2 border-transparent hover:border-indigo-100 flex items-center gap-2'}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            Tasks
                        </NavLink>
                    )}
                </nav>            </div>

            {/* Right: Stats, Actions, Profile */}
            <div className="flex items-center space-x-2 md:space-x-6">

                {/* Stats Grid (Dashboard Only) */}
                {location.pathname === '/' && user?.role !== 'Client' && (
                    <div className="hidden md:flex items-center space-x-2 mr-4">
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
                        className="hidden md:flex px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        New +
                    </button>
                )}

                <NotificationBell />

                <div className="relative" ref={ref}>
                    <button
                        onClick={() => setOpen(v => !v)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:shadow hover:bg-gray-200 transition-all"
                        aria-label="User menu"
                    >
                        <i className="fa-jelly-duo fa-regular fa-circle-user text-2xl"></i>
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
