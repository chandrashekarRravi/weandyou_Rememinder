import React, { useState, useMemo } from 'react';
import { useCreativeEntries } from '../hooks/useCreativeEntries';
import { useClients } from '../hooks/useClients';
import { useCalendarContext } from '../context/CalendarContext';
import { useAuth } from '../context/AuthContext';
import { useIterationFeedback } from '../hooks/useIterationFeedback';
import FilterSelect from '../components/Calendar/FilterSelect';
import CreativeEntryModal from '../components/CreativeEntryModal';
import { AnimatePresence, motion } from 'framer-motion';
import { FaRegComment } from 'react-icons/fa';

const Dashboard: React.FC = () => {
    const { currentDate } = useCalendarContext();
    const { creativeEntries, loading, updateEntry } = useCreativeEntries(currentDate, { fetchAll: true });
    const { user } = useAuth();

    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string, status: 'Approved' | 'Rejected' } | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleStatusUpdate = async (id: string, newStatus: 'Approved' | 'Rejected') => {
        setPendingStatusUpdate({ id, status: newStatus });
    };

    const confirmStatusUpdate = async () => {
        if (!pendingStatusUpdate) return;
        try {
            await updateEntry(pendingStatusUpdate.id, { status: pendingStatusUpdate.status });
        } catch (error) {
            console.error('Failed to update status', error);
            // Optionally could use a toast notification here instead of alert
        } finally {
            setPendingStatusUpdate(null);
        }
    };

    const cancelStatusUpdate = () => {
        setPendingStatusUpdate(null);
    };

    const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
    const { feedbacks, addFeedback, loading: feedbacksLoading } = useIterationFeedback(activeFeedbackId);
    const [feedbackText, setFeedbackText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialData, setModalInitialData] = useState<{ mediaId?: string; clientName?: string; category?: string }>();

    // Dashboard-specific filter state
    const [dashboardFilter, setDashboardFilter] = useState({
        client: 'All',
        category: 'All',
        status: 'All'
    });

    const { clients } = useClients();

    // Generate Client Options from Clients API
    const clientOptions = useMemo(() => {
        return clients.map(c => ({ label: c.clientName, value: c.clientName }));
    }, [clients]);

    // Filtered & Grouped Entries Logic
    const groupedEntries = useMemo(() => {
        // 1. Filter
        const filtered = creativeEntries.filter(entry => {
            if (dashboardFilter.client !== 'All' && entry.clientName !== dashboardFilter.client) return false;
            if (dashboardFilter.category !== 'All' && (entry.category || 'Other') !== dashboardFilter.category) return false;
            if (dashboardFilter.status !== 'All' && (entry.status || 'Pending') !== dashboardFilter.status) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // 2. Group by Client Name
        const byClient = filtered.reduce((acc, entry) => {
            const client = entry.clientName || 'Unknown Client';
            if (!acc[client]) acc[client] = [];
            acc[client].push(entry);
            return acc;
        }, {} as Record<string, typeof creativeEntries>);

        // 3. Within each Client, Group by Media ID (Iterations)
        const grouped = Object.entries(byClient).map(([clientName, entries]) => {
            const byMediaId = entries.reduce((acc, entry) => {
                const mediaId = entry.mediaId || 'unknown-media';
                if (!acc[mediaId]) acc[mediaId] = [];
                acc[mediaId].push(entry);
                return acc;
            }, {} as Record<string, typeof creativeEntries>);

            // Sort iterations within each mediaId (oldest first, so Iteration 1 is oldest)
            const groupedByMedia = Object.values(byMediaId).map(iterations =>
                iterations.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            );

            return {
                clientName,
                mediaGroups: groupedByMedia // Array of Arrays (each inner array is a set of iterations for a single mediaId)
            };
        });

        return grouped;
    }, [creativeEntries, dashboardFilter]);

    // State for pagination (media index) and iteration index for each client group
    // Key: ClientName, Value: { mediaIndex: number, iterationIndex: number }
    const [viewState, setViewState] = useState<Record<string, { mediaIndex: number, iterationIndex: number }>>({});

    // Helper to get active indices for a client
    const getActiveState = (clientName: string, maxMediaIndex: number, maxIterationIndexes: number[]) => {
        const state = viewState[clientName] || { mediaIndex: 0, iterationIndex: -1 }; // -1 means latest
        const mediaIdx = Math.min(Math.max(0, state.mediaIndex), maxMediaIndex);

        let iterIdx = state.iterationIndex;
        if (iterIdx === -1 || iterIdx >= maxIterationIndexes[mediaIdx]) {
            iterIdx = maxIterationIndexes[mediaIdx] - 1; // Default to latest iteration
        }
        return { mediaIdx, iterIdx };
    };

    const updateViewState = (clientName: string, updates: Partial<{ mediaIndex: number, iterationIndex: number }>) => {
        setViewState(prev => ({
            ...prev,
            [clientName]: { ...(prev[clientName] || { mediaIndex: 0, iterationIndex: -1 }), ...updates }
        }));
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {loading ? (
                <div className="text-gray-400 align-center tp-50vh">Loading...</div>
            ) : (
                <>
                    {/* Dashboard Feed: Filters & List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* Filters Header */}
                        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap items-center gap-4">
                            <h3 className="text-lg font-bold text-gray-800 mr-4">Creative Entries</h3>

                            {user?.role !== 'Client' && (
                                <>
                                    <FilterSelect
                                        label="Client"
                                        value={dashboardFilter.client}
                                        options={clientOptions}
                                        onChange={(val) => setDashboardFilter(prev => ({ ...prev, client: val }))}
                                        placeholder="All Clients"
                                    />
                                    <div className="w-px h-8 bg-gray-100 mx-2 hidden md:block"></div>
                                </>
                            )}

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

                        {/* Entries List Feed */}
                        <div className="p-6 bg-gray-50">
                            <div className="space-y-8">
                                {groupedEntries.length > 0 ? (
                                    groupedEntries.map((group) => {
                                        const { clientName, mediaGroups } = group;
                                        const maxMediaIndex = mediaGroups.length - 1;
                                        const maxIterationIndexes = mediaGroups.map(mg => mg.length);

                                        const { mediaIdx, iterIdx } = getActiveState(clientName, maxMediaIndex, maxIterationIndexes);

                                        const currentMediaGroup = mediaGroups[mediaIdx];
                                        const entry = currentMediaGroup[iterIdx];
                                        const activeFeedbackIdForClient = activeFeedbackId === entry._id; // Is feedback open for this specific iteration?

                                        return (
                                            <div key={clientName} className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm relative">

                                                {/* Pagination Arrows for Different Media IDs (Same Client) */}
                                                {mediaGroups.length > 1 && (
                                                    <>
                                                        <button
                                                            onClick={() => updateViewState(clientName, { mediaIndex: Math.max(0, mediaIdx - 1), iterationIndex: -1 })}
                                                            disabled={mediaIdx === 0}
                                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:hover:text-gray-600 disabled:hover:border-gray-200 z-20"
                                                        >
                                                            &lt;
                                                        </button>
                                                        <button
                                                            onClick={() => updateViewState(clientName, { mediaIndex: Math.min(maxMediaIndex, mediaIdx + 1), iterationIndex: -1 })}
                                                            disabled={mediaIdx === maxMediaIndex}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:hover:text-gray-600 disabled:hover:border-gray-200 z-20"
                                                        >
                                                            &gt;
                                                        </button>
                                                    </>
                                                )}

                                                {/* Top Section */}
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-100 bg-gray-50/50">
                                                    <div className="flex flex-wrap items-center gap-6 xl:pl-8">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-500 font-medium">Media ID:</span>
                                                            <span className="text-sm font-semibold text-gray-900 border-b border-gray-300 px-1">{entry.mediaId}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-1 sm:mb-0">
                                                            <span className="text-sm text-gray-500 font-medium">Client Name:</span>
                                                            <div className="flex items-center gap-2 border-b border-gray-300 pb-1">
                                                                <span className="text-sm font-semibold text-gray-900">{clientName || '-'}</span>
                                                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-medium mt-2 sm:mt-0 flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 xl:pr-8">
                                                        <span>{entry.username || 'Unknown'}</span>
                                                        <span>
                                                            {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {' '}
                                                            {new Date(entry.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Body Section */}
                                                <div className="p-6 xl:px-12">
                                                    <div className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 uppercase tracking-wider flex justify-between items-center">
                                                        <span>Iteration {iterIdx + 1}</span>
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide ${entry.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                            entry.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            STATUS: {entry.status || 'Pending'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-col lg:flex-row gap-6">
                                                        {/* Left Column: Image & Caption */}
                                                        <div className="flex-none lg:w-[30%] space-y-4">
                                                            <div className="w-full bg-gray-100 rounded-lg flex border border-gray-200 overflow-hidden items-center justify-center relative group">
                                                                {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                                    <video src={entry.filePath} controls className="w-full h-auto block" />
                                                                ) : (
                                                                    <img
                                                                        src={entry.filePath}
                                                                        alt="Creative"
                                                                        className="w-full h-auto block cursor-pointer transition-transform hover:scale-[1.02]"
                                                                        onClick={() => setSelectedImage(entry.filePath)}
                                                                    />
                                                                )}
                                                                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
                                                                    {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? 'Video' : 'Image'}
                                                                </div>
                                                            </div>
                                                            <div className="border border-gray-200 rounded-lg p-4 min-h-[10px] bg-gray-50">
                                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Captions</p>
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.caption || 'No caption provided.'}</p>
                                                            </div>
                                                        </div>

                                                        {/* Middle Column: Actions */}
                                                        <div className="flex lg:flex-col items-center justify-center gap-4 lg:py-8 lg:px-2 relative">
                                                            <button
                                                                onClick={() => setActiveFeedbackId(activeFeedbackIdForClient ? null : entry._id)}
                                                                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shadow-sm ${activeFeedbackIdForClient ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'}`}
                                                                title="Feedback"
                                                            >
                                                                <FaRegComment className="w-5 h-5" />
                                                            </button>
                                                            {user?.role !== 'Team' && user?.role !== 'Client' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleStatusUpdate(entry._id, 'Approved')}
                                                                        className="w-10 h-10 rounded-full border border-green-300 bg-white flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors shadow-sm" title="Approve">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleStatusUpdate(entry._id, 'Rejected')}
                                                                        className="w-10 h-10 rounded-full border border-red-300 bg-white flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors shadow-sm" title="Reject">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Right Column: Feedback Box & Plus Button */}
                                                        <div className="flex-1 flex gap-4">
                                                            {activeFeedbackIdForClient ? (
                                                                <>
                                                                    {/* Feedback Box */}
                                                                    <div className="flex-1 border border-gray-300 rounded-lg flex flex-col overflow-hidden bg-white shadow-sm h-[400px]">
                                                                        <div className="bg-gray-50 p-3 border-b border-gray-200">
                                                                            <h4 className="text-sm font-bold text-gray-700 text-center">Feedback of Iteration {iterIdx + 1}</h4>
                                                                        </div>
                                                                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                                                            {feedbacksLoading ? (
                                                                                <div className="text-center text-gray-400 text-sm mt-10">Loading comments...</div>
                                                                            ) : feedbacks.length === 0 ? (
                                                                                <div className="text-center text-gray-400 text-sm mt-10">
                                                                                    No feedback yet.<br />Start the conversation!
                                                                                </div>
                                                                            ) : (
                                                                                feedbacks.map((fb) => {
                                                                                    const isCurrentUser = fb.userId === user?._id;

                                                                                    if (!isCurrentUser) {
                                                                                        // Someone else's comment (Left side)
                                                                                        return (
                                                                                            <div key={fb._id} className="flex flex-col gap-1 items-start">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${fb.role === 'Client' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                                                        {fb.username?.charAt(0).toUpperCase() || 'U'}
                                                                                                    </div>
                                                                                                    <span className="text-xs font-semibold text-gray-700">{fb.username || 'User'}</span>
                                                                                                    <span className="text-[10px] text-gray-400">
                                                                                                        {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className={`text-sm p-3 rounded-lg rounded-tl-none border relative w-full max-w-sm ${fb.role === 'Client' ? 'bg-blue-50 text-gray-800 border-blue-100' : 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                                                                                                    {fb.text}
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    } else {
                                                                                        // Current user's comment (Right side)
                                                                                        return (
                                                                                            <div key={fb._id} className="flex flex-col gap-1 items-end mt-4">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className="text-[10px] text-gray-400">
                                                                                                        {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                                    </span>
                                                                                                    <span className="text-xs font-semibold text-gray-700">You ({fb.role})</span>
                                                                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${fb.role === 'Client' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                                                        {fb.username?.charAt(0).toUpperCase() || 'U'}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className={`text-sm p-3 rounded-lg rounded-tr-none border relative max-w-sm ${fb.role === 'Client' ? 'bg-blue-50 text-gray-800 border-blue-100' : 'bg-indigo-50 text-indigo-900 border-indigo-100'}`}>
                                                                                                    {fb.text}
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                })
                                                                            )}
                                                                        </div>
                                                                        {/* Input Box */}
                                                                        <div className="p-3 border-t border-gray-200 bg-gray-50">
                                                                            <form
                                                                                onSubmit={async (e) => {
                                                                                    e.preventDefault();
                                                                                    if (feedbackText.trim()) {
                                                                                        await addFeedback(feedbackText);
                                                                                        setFeedbackText('');
                                                                                    }
                                                                                }}
                                                                                className="flex items-center gap-2 border border-gray-300 rounded-md p-1 bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow"
                                                                            >
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Type feedback..."
                                                                                    value={feedbackText}
                                                                                    onChange={(e) => setFeedbackText(e.target.value)}
                                                                                    className="flex-1 bg-transparent px-2 py-1 text-sm outline-none"
                                                                                />
                                                                                <svg className="w-4 h-4 text-gray-400 cursor-pointer ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                                                <button type="submit" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors ml-1" title="Send" disabled={!feedbackText.trim()}>
                                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                                                                </button>
                                                                            </form>
                                                                        </div>
                                                                    </div>

                                                                    {/* Plus Button Container (Small / Side) - Hidden for Clients */}
                                                                    {user?.role !== 'Client' && (
                                                                        <div className="flex flex-col items-center justify-center ml-2 relative min-w-[60px]">
                                                                            <button
                                                                                onClick={() => { setModalInitialData({ mediaId: entry.mediaId, clientName, category: entry.category }); setIsModalOpen(true); }}
                                                                                className="w-12 h-12 rounded-full border border-gray-400 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors shrink-0 shadow-sm z-10 bg-white"
                                                                                title="Accept & Add New Iteration"
                                                                            >
                                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                                                                            </button>
                                                                            <div className="absolute top-[calc(50%+30px)] right-full mr-2 hidden lg:flex items-center">

                                                                            </div>
                                                                            <div className="mt-2 text-center text-[10px] text-gray-500 w-20 leading-tight">
                                                                                After this accept<br />add to new one
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                /* Plus Button Container (Large / Center) - Hidden for Clients */
                                                                user?.role !== 'Client' ? (
                                                                    <div className="flex-1 flex items-center justify-center h-[400px]">
                                                                        <div className="flex flex-col items-center justify-center relative group">
                                                                            <button
                                                                                onClick={() => { setModalInitialData({ mediaId: entry.mediaId, clientName, category: entry.category }); setIsModalOpen(true); }}
                                                                                className="w-24 h-24 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-500 transition-all shrink-0 shadow-sm z-10 bg-white"
                                                                                title="Accept & Add New Iteration"
                                                                            >
                                                                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                                                                            </button>
                                                                            <div className="absolute right-full mr-4 hidden lg:flex items-center top-[120px]">

                                                                            </div>
                                                                            <div className="mt-6 text-center text-sm font-medium text-gray-500 leading-tight">
                                                                                After this accept<br />add to new one
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : <div className="flex-1 flex items-center justify-center h-[400px]"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Strip - Iterations */}
                                                {
                                                    currentMediaGroup.length > 0 && (
                                                        <div className="px-6 pb-6 pt-2">
                                                            <div className="grid grid-cols-[repeat(auto-fit,minmax(12px,1fr))] h-3 border border-gray-300 divide-x divide-gray-300 mb-4 bg-gray-50 max-w-2xl mx-auto">
                                                                {[...Array(30)].map((_, i) => (
                                                                    <div key={i} className="h-full"></div>
                                                                ))}
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-4 border-t border-dashed border-gray-200 pt-4 max-w-2xl mx-auto">
                                                                <span className="text-xs font-bold text-gray-500">I {iterIdx + 1}:</span>
                                                                <div className="border border-gray-300 p-1 w-24 h-16 rounded overflow-hidden bg-gray-100 flex items-center justify-center relative">
                                                                    {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                                        <video src={entry.filePath} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <img src={entry.filePath} alt="Thumb" className="w-full h-full object-cover" />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-white/20"></div>
                                                                </div>

                                                                <div className="flex-1"></div>

                                                                <div className="text-sm font-mono text-gray-500 tracking-widest flex items-center gap-3">
                                                                    <span
                                                                        onClick={() => updateViewState(clientName, { iterationIndex: Math.max(0, iterIdx - 1) })}
                                                                        className={`cursor-pointer ${iterIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-indigo-600'}`}
                                                                    >
                                                                        &lt;
                                                                    </span>

                                                                    {currentMediaGroup.map((_, i) => (
                                                                        <span
                                                                            key={i}
                                                                            onClick={() => updateViewState(clientName, { iterationIndex: i })}
                                                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer transition-colors ${i === iterIdx
                                                                                ? 'border border-gray-300 font-bold bg-white text-gray-800 shadow-sm'
                                                                                : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                                                                                }`}
                                                                        >
                                                                            {i + 1}
                                                                        </span>
                                                                    ))}

                                                                    <span
                                                                        onClick={() => updateViewState(clientName, { iterationIndex: Math.min(maxIterationIndexes[mediaIdx] - 1, iterIdx + 1) })}
                                                                        className={`cursor-pointer ${iterIdx === maxIterationIndexes[mediaIdx] - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-indigo-600'}`}
                                                                    >
                                                                        &gt;
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                }

                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="bg-white p-12 text-center text-gray-400 rounded-xl border border-gray-200 shadow-sm">
                                        No creative entries found for this month.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )
            }
            {/* Status Confirmation Modal */}
            {pendingStatusUpdate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={cancelStatusUpdate}></div>
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-[340px] p-6 flex flex-col items-center relative z-10 animate-fade-in text-center">
                        <div className="mb-4">
                            {pendingStatusUpdate.status === 'Approved' ? (
                                <svg className="w-14 h-14 text-green-500 mx-auto drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-red-500 mx-auto drop-shadow-sm">
                                    <path d="M12 4.16875L2.34375 20.8313H21.6562L12 4.16875Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 10.8313V15.8313" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="18.3313" r="1.5" fill="currentColor" />
                                </svg>
                            )}
                        </div>
                        <h3 className="text-[22px] font-bold text-gray-800 mb-2">
                            {pendingStatusUpdate.status === 'Approved' ? 'Approve Entry' : 'Reject Entry'}
                        </h3>
                        <p className="text-gray-600 text-[15px] mb-8 font-medium">
                            You're going to {pendingStatusUpdate.status === 'Approved' ? 'approve' : 'reject'} this "Entry"
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={cancelStatusUpdate}
                                className="flex-1 py-3 px-2 bg-[#EAEAEA] hover:bg-[#dfdfdf] text-gray-800 font-semibold rounded-xl transition-colors text-[15px]"
                            >
                                No, keep it.
                            </button>
                            <button
                                onClick={confirmStatusUpdate}
                                className={`flex-1 py-3 px-2 text-white font-semibold rounded-xl transition-all text-[15px] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] ${pendingStatusUpdate.status === 'Approved'
                                    ? 'bg-green-500 hover:bg-green-600 shadow-green-500/50'
                                    : 'bg-[#FF3B30] hover:bg-[#e6352b] shadow-red-500/50'
                                    }`}
                            >
                                Yes, {pendingStatusUpdate.status}!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Creative Entry Modal */}
            <CreativeEntryModal
                isOpen={isModalOpen}
                initialData={modalInitialData}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => setIsModalOpen(false)}
            />

            {/* Image Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            src={selectedImage}
                            alt="Fullscreen Creative"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Dashboard;
