import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';

interface HeaderProps { }

const PAGES = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Reminders', to: '/reminder' },

];

const Header: React.FC<HeaderProps> = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement | null>(null);

    const username = typeof window !== 'undefined' ? (localStorage.getItem('username') || 'User') : 'User';

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
        localStorage.removeItem('username');
        navigate('/');
        setOpen(false);
    };

    return (
        <header className="flex items-center justify-between px-12 py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 relative">

            {/* Left: Logo */}
            <div className="flex items-center">
                <img src="/AVAIO.png" alt="AVAIO" className="h-16 w-auto object-contain" />
            </div>

            {/* Center: Navigation */}
            <nav className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-8">
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
            </nav>

            {/* Right: User Profile */}
            <div className="flex items-center space-x-4">
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
                                {username}
                            </div>
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
