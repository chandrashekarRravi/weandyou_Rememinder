import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';

interface FilterSelectProps {
    label: string;
    value: string;
    options: { label: string; value: string; subLabel?: string }[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
    label,
    value,
    options,
    onChange,
    placeholder = 'All',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className="relative min-w-0 w-full md:min-w-[160px]" ref={containerRef}>
            <div className="relative w-full">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl text-left transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isOpen ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-gray-300 hover:border-gray-400'
                        }`}
                >
                    <span className={`text-sm truncate pr-2 ${value === 'All' ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <FaChevronDown
                        className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : 'group-hover:text-gray-600'}`}
                    />
                </button>

                {/* Floating Label */}
                <label
                    onClick={() => setIsOpen(!isOpen)}
                    className={`absolute left-3 px-1 transition-all duration-200 pointer-events-none bg-white
                        ${isOpen ? '-top-2.5 text-xs text-indigo-600 font-semibold' : '-top-2.5 text-xs text-gray-500 font-medium'}`}
                >
                    {label}
                </label>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden ring-1 ring-black/5"
                        >
                            <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                <button
                                    onClick={() => {
                                        onChange('All');
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${value === 'All' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span>All</span>
                                    {value === 'All' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                                </button>
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${value === option.value ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className={`truncate w-full ${value === option.value ? 'font-medium' : ''}`}>
                                                {option.label}
                                            </span>
                                            {option.subLabel && (
                                                <span className="text-xs text-gray-400 truncate w-full mt-0.5 group-hover:text-gray-500">
                                                    {option.subLabel}
                                                </span>
                                            )}
                                        </div>
                                        {value === option.value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-2 flex-shrink-0"></span>}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FilterSelect;
