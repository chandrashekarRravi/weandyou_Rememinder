import React, { useState, useMemo } from 'react';
import { useCreativeEntries } from '../hooks/useCreativeEntries';
import { useCalendarContext } from '../context/CalendarContext';
import FilterSelect from '../components/Calendar/FilterSelect';

const Dashboard: React.FC = () => {
    const { currentDate } = useCalendarContext();
    const { creativeEntries, loading } = useCreativeEntries(currentDate);

    // Dashboard-specific filter state
    const [dashboardFilter, setDashboardFilter] = useState({
        client: 'All',
        category: 'All',
        status: 'All'
    });

    // Generate Client Options from Creative Entries
    const clientOptions = useMemo(() => {
        const uniqueClients = new Set<string>();
        creativeEntries.forEach(e => {
            if (e.clientName) uniqueClients.add(e.clientName.trim());
        });
        return Array.from(uniqueClients).sort().map(c => ({ label: c, value: c }));
    }, [creativeEntries]);

    // Filtered Entries Logic
    const filteredEntries = useMemo(() => {
        return creativeEntries.filter(entry => {
            if (dashboardFilter.client !== 'All' && entry.clientName !== dashboardFilter.client) return false;
            if (dashboardFilter.category !== 'All' && (entry.category || 'Other') !== dashboardFilter.category) return false;
            if (dashboardFilter.status !== 'All' && (entry.status || 'Pending') !== dashboardFilter.status) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [creativeEntries, dashboardFilter]);


    // Removed unused recent events logic

    // --- New UI state for Dashboard (Legacy/Feedback) ---
    // Removed legacy state and functions as they were unused and causing clutter/lint errors.

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {loading ? (
                <div className="text-gray-400 align-center tp-50vh">Loading...</div>
            ) : (
                <>
                    {/* Dashboard Feed: Filters & List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* Filters Header */}
                        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap items-center gap-4">
                            <h3 className="text-lg font-bold text-gray-800 mr-4">Creative Entries</h3>

                            <FilterSelect
                                label="Client"
                                value={dashboardFilter.client}
                                options={clientOptions}
                                onChange={(val) => setDashboardFilter(prev => ({ ...prev, client: val }))}
                                placeholder="All Clients"
                            />

                            <div className="w-px h-8 bg-gray-100 mx-2 hidden md:block"></div>

                            <FilterSelect
                                label="Category"
                                value={dashboardFilter.category}
                                options={[
                                    { label: 'Special Day', value: 'Special Day' },
                                    { label: 'Engagement', value: 'Engagement' },
                                    { label: 'Ideation', value: 'Ideation' },
                                    { label: 'Other', value: 'Other' },
                                ]}
                                onChange={(val) => setDashboardFilter(prev => ({ ...prev, category: val }))}
                                placeholder="All Categories"
                            />

                            <FilterSelect
                                label="Status"
                                value={dashboardFilter.status}
                                options={[
                                    { label: 'Pending', value: 'Pending' },
                                    { label: 'Approved', value: 'Approved' },
                                    { label: 'Rejected', value: 'Rejected' },
                                ]}
                                onChange={(val) => setDashboardFilter(prev => ({ ...prev, status: val }))}
                                placeholder="All Status"
                            />
                        </div>

                        {/* Entries List */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Media ID</th>
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Uploaded By</th>
                                        <th className="px-6 py-4">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEntries.length > 0 ? (
                                        filteredEntries.map((entry) => (
                                            <tr key={entry._id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                            {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                                <video src={entry.filePath} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <img src={entry.filePath} alt="" className="w-full h-full object-cover" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-mono text-xs font-medium text-gray-900">{entry.mediaId}</p>
                                                            {entry.caption && <p className="text-[10px] text-gray-400 max-w-[150px] truncate">{entry.caption}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-gray-700">{entry.clientName || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-medium border ${entry.category === 'Special Day' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        entry.category === 'Engagement' ? 'bg-stone-50 text-stone-600 border-stone-200' :
                                                            entry.category === 'Ideation' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}>
                                                        {entry.category || 'Other'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${entry.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                        entry.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {entry.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {entry.username || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-700">{new Date(entry.createdAt).toLocaleDateString()}</span>
                                                        <span className="text-[10px]">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                No creative entries found for this month.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
