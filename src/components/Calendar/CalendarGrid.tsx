import React, { useMemo } from 'react';
import DayCell from './DayCell';
import { useEvents } from '../../hooks/useEvents';
import { useCreativeEntries } from '../../hooks/useCreativeEntries';
import { useClients } from '../../hooks/useClients';
import { isSameDay, parseISO } from 'date-fns';
import { useCalendarContext } from '../../context/CalendarContext';
import FilterSelect from './FilterSelect';

interface CalendarGridProps {
    currentDate: Date;
    days: Date[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentDate, days }) => {
    const { events } = useEvents(currentDate);
    const { creativeEntries, updateEntry, deleteEntry } = useCreativeEntries(currentDate);
    const { clients } = useClients();

    // Context now provides objects for activeFilter and partial update setter
    const { activeFilter, setActiveFilter, setMonth } = useCalendarContext();

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
    ];

    const statusOptions = [
        { label: 'Review', value: 'Pending' },
        { label: 'Approved', value: 'Ongoing' },
        { label: 'Completed', value: 'Completed' },
    ];

    const monthOptions = MONTH_NAMES.map((m, idx) => ({ label: m, value: idx.toString() }));

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

            // Only show the entry in the calendar if it has received final approval
            if (entry.status !== 'Approved') return false;

            // Do not show Chinmai's raw drafts in the calendar
            const entryClient = entry.clientName?.trim() || 'No Client';
            if (entryClient === 'Drafts') return false;

            // Client Filter
            if (activeFilter.client !== 'All') {
                if (entryClient !== activeFilter.client) return false;
            }

            // Category Filter
            if (activeFilter.category !== 'All') {
                const cat = entry.category || 'Other';
                if (cat !== activeFilter.category) return false;
            }

            // Status Filter
            if (activeFilter.status !== 'All') {
                // Since this function now only processes 'Approved' entries,
                // they only map to the 'Ongoing' event status filter.
                if (activeFilter.status !== 'Ongoing') return false;
            }

            return true;
        });
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">


            {/* Filter Controls */}
            <div className="p-4 border-b border-gray-100 bg-white flex flex-col md:flex-row items-start md:items-center gap-4">

                {/* Mobile Month Tap */}
                <div className="w-full md:hidden">
                    <FilterSelect
                        label="Month"
                        value={currentDate.getMonth().toString()}
                        options={monthOptions}
                        onChange={(val) => setMonth?.(parseInt(val))}
                        placeholder="Select Month"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto md:items-center md:gap-4 md:flex-1">
                    <div className="min-w-0 md:flex-1 max-w-xs">
                        <FilterSelect
                            label="Client"
                            value={activeFilter.client}
                            options={clientOptions}
                            onChange={(val) => setActiveFilter({ client: val })}
                            placeholder="All"
                        />
                    </div>

                    <div className="w-px h-8 bg-gray-100 mx-2 hidden md:block"></div>

                    <div className="min-w-0 md:flex-1 max-w-xs">
                        <FilterSelect
                            label="Category"
                            value={activeFilter.category}
                            options={categoryOptions}
                            onChange={(val) => setActiveFilter({ category: val })}
                            placeholder="All"
                        />
                    </div>

                    <div className="min-w-0 col-span-2 md:col-span-1 md:flex-1 max-w-xs">
                        <FilterSelect
                            label="Status"
                            value={activeFilter.status}
                            options={statusOptions}
                            onChange={(val) => setActiveFilter({ status: val })}
                            placeholder="All"
                        />
                    </div>
                </div>
            </div>

            {/* Desktop Transposed month grid: left column = weekday labels, top row = week numbers */}
            <div className="hidden md:block flex-1 overflow-auto">
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

            {/* Mobile Standard Grid: top row = weekday labels, scrolling vertically */}
            <div className="md:hidden flex-1 overflow-auto bg-white">
                <div className="grid grid-cols-7 w-full border-t border-l border-gray-100 min-w-[300px]">
                    {/* Weekday headers */}
                    {WEEKDAYS.map(wd => (
                        <div key={`m-header-${wd}`} className="p-2 border-b border-r border-gray-100 bg-gray-50/50 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10">
                            {wd.substring(0, 3)}
                        </div>
                    ))}

                    {/* Days */}
                    {days.map((day, idx) => (
                        <div key={`m-day-${idx}`} className="border-b border-r border-gray-100 min-h-[100px] h-full sm:min-h-[120px]">
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
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarGrid;
