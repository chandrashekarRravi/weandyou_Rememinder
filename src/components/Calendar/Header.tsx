import React from 'react';

interface HeaderProps {
}

const Header: React.FC<HeaderProps> = () => {
    return (
        <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
            <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Rememinder</h1>
            </div>
            <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Rememinder</h1>
            </div>

            
            <div className="flex items-center space-x-8">
            </div>

            <div className="w-24">
                {/* Placeholder for user profile or extra actions */}
                
            </div>
        </header>
    );
};

export default Header;
