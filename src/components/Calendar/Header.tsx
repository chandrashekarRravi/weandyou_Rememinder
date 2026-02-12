import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaCalendarAlt } from 'react-icons/fa';

interface HeaderProps {}

const PAGES = [
     {label:'Dashboard', to :   '/dashboard'},
    { label: 'Reminders', to: '/reminder' },
    { label: 'Review', to: '/review' }
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
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
            <div className="flex items-center space-x-6">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                        <FaCalendarAlt className="text-white text-lg" />
                    </div>
                    <span className="text-lg font-bold text-gray-800 tracking-tight">AVAIO</span>
                </div>

                <nav className="flex items-center space-x-4">
                    {PAGES.map(p => (
                        <NavLink
                            key={p.to}
                            to={p.to}
                            className={({ isActive }) => isActive ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-indigo-600'}
                        >
                            {p.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="flex items-center space-x-4">
                <div className="hidden sm:block text-sm text-gray-600">Signed in as <span className="font-medium text-gray-800">{username}</span></div>

                <div className="relative" ref={ref}>
                    <button
                        onClick={() => setOpen(v => !v)}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:shadow"
                        aria-label="User menu"
                    >
                        <FaUserCircle size={20} />
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 p-2 z-20">
                            <div className="px-3 py-2 text-sm text-gray-700 font-medium">{username}</div>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 rounded">Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
