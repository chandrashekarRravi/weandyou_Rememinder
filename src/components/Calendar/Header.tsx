import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
    monthLabel: string;
    onNextMonth: () => void;
    onPrevMonth: () => void;
}

const Header: React.FC<HeaderProps> = ({ monthLabel, onNextMonth, onPrevMonth }) => {
    return (
        <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
            <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Rememinder</h1>
            </div>

            <div className="flex items-center space-x-8">
                <button
                    onClick={onPrevMonth}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                >
                    <FaChevronLeft />
                </button>

                <div className="w-48 text-center overflow-hidden relative h-8">
                    <AnimatePresence mode='wait'>
                        <motion.h2
                            key={monthLabel}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-xl font-semibold text-gray-800 absolute w-full"
                        >
                            {monthLabel}
                        </motion.h2>
                    </AnimatePresence>
                </div>

                <button
                    onClick={onNextMonth}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                >
                    <FaChevronRight />
                </button>
            </div>

            <div className="w-24">
                {/* Placeholder for user profile or extra actions */}
            </div>
        </header>
    );
};

export default Header;
