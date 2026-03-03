import React, { useMemo } from 'react';
import DayCell from './DayCell';
import { useEvents } from '../../hooks/useEvents';
import { useCreativeEntries } from '../../hooks/useCreativeEntries';
import { useClients } from '../../hooks/useClients';
import { isSameDay, parseISO } from 'date-fns';
import { useCalendarContext } from '../../context/CalendarContext';
import { motion, AnimatePresence } from 'framer-motion';
import FilterSelect from './FilterSelect';

interface CalendarGridProps {
    currentDate: Date;
    days: Date[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentDate, days }) => {
    const { events } = useEvents(currentDate);
    const { creativeEntries, updateEntry, deleteEntry } = useCreativeEntries(currentDate);
    const { clients } = useClients();

    // Context now provides objects for activeFilter and partial update setter
    const { activeFilter, setActiveFilter, monthLabel } = useCalendarContext();

    // Split days into weeks (chunks of 7)
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    // Generate unique clients from global clients
    const clientOptions = useMemo(() => {
        return clients.map(c => ({
            label: c.clientName,
            value: c.clientName
        })).sort((a, b) => a.label.localeCompare(b.label));
    }, [clients]);

    const categoryOptions = [
        { label: 'Special Day', value: 'Special Day' },
        { label: 'Engagement', value: 'Engagement' },
        { label: 'Ideation', value: 'Ideation' },
        { label: 'Other', value: 'Other' },
    ];

    const statusOptions = [
        { label: 'Review', value: 'Pending' },
        { label: 'Approved', value: 'Ongoing' },
        { label: 'Completed', value: 'Completed' },
    ];

    const getEventsForDay = (date: Date) => {
        return events.filter(event => {
            const isSameDate = isSameDay(new Date(event.date), date);
            if (!isSameDate) return false;

            // Client Filter
            if (activeFilter.client !== 'All') {
                const evtClient = event.clientName?.trim() || 'No Client';
                if (evtClient !== activeFilter.client) return false;
            }

            // Category Filter
            if (activeFilter.category !== 'All') {
                if (event.category !== activeFilter.category) return false;
            }

            // Status Filter
            if (activeFilter.status !== 'All') {
                if (event.status !== activeFilter.status) return false;
            }

            return true;
        });
    };

    const getCreativeEntriesForDay = (date: Date) => {
        return creativeEntries.filter(entry => {
            const entryDateStr = entry.date || entry.createdAt;
            if (!entryDateStr) return false;

            const isSameDate = isSameDay(parseISO(entryDateStr), date);
            if (!isSameDate) return false;

            // Client Filter
            if (activeFilter.client !== 'All') {
                const entryClient = entry.clientName?.trim() || 'No Client';
                if (entryClient !== activeFilter.client) return false;
            }

            // Category Filter
            if (activeFilter.category !== 'All') {
                const cat = entry.category || 'Other';
                if (cat !== activeFilter.category) return false;
            }

            // Status Filter
            if (activeFilter.status !== 'All') {
                // Map Entry status to Event status equivalent
                // Pending -> Pending (Review)
                // Approved -> Ongoing (Approved)
                // Creative Entries don't have Completed usually
                if (activeFilter.status === 'Pending' && entry.status !== 'Pending') return false;
                if (activeFilter.status === 'Ongoing' && entry.status !== 'Approved') return false;
                if (activeFilter.status === 'Completed') return false;
            }

            return true;
        });
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">


            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4 p-4 border-b border-gray-100 bg-white">
                <FilterSelect
                    label="Client"
                    value={activeFilter.client}
                    options={clientOptions}
                    onChange={(val) => setActiveFilter({ client: val })}
                    placeholder="All Clients"
                />

                <div className="w-px h-8 bg-gray-100 mx-2 hidden md:block"></div>

                <FilterSelect
                    label="Category"
                    value={activeFilter.category}
                    options={categoryOptions}
                    onChange={(val) => setActiveFilter({ category: val })}
                    placeholder="All"
                />

                <FilterSelect
                    label="Status"
                    value={activeFilter.status}
                    options={statusOptions}
                    onChange={(val) => setActiveFilter({ status: val })}
                    placeholder="All"
                />
            </div>

            {/* Transposed month grid: left column = weekday labels, top row = week numbers */}
            <div className="flex-1 overflow-auto">
                <div
                    className="inline-grid w-full"
                    style={{ gridTemplateColumns: `80px repeat(${weeks.length}, minmax(0, 1fr))` }}
                >
                    {/* Weekday rows */}
                    {WEEKDAYS.map((wd, dayIdx) => (
                        <React.Fragment key={wd}>
                            <div className="p-2 border-b border-r border-gray-100 bg-gray-50/50 flex items-center justify-center text-xs font-bold text-gray-400 uppercase tracking-wider sticky left-0 z-10">
                                {wd}
                            </div>
                            {weeks.map((week, widx) => {
                                const day = week[dayIdx];
                                return (
                                    <div key={String(day?.toISOString()) + widx} className="border-b border-r border-gray-100 min-w-[100px]">
                                        {day ? (
                                            <DayCell
                                                date={day}
                                                currentMonth={currentDate}
                                                events={getEventsForDay(day)}
                                                creativeEntries={getCreativeEntriesForDay(day)}
                                                onUpdateCreativeEntry={updateEntry}
                                                onDeleteCreativeEntry={deleteEntry}
                                            />
                                        ) : (
                                            <div className="p-1 h-full bg-gray-50" />
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarGrid;
