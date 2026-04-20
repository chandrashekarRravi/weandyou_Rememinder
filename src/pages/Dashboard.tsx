import React, { useState, useMemo, useRef } from 'react';
import { useCreativeEntries } from '../hooks/useCreativeEntries';
import { useEvents } from '../hooks/useEvents';
import { useClients } from '../hooks/useClients';
import { useCalendarContext } from '../context/CalendarContext';
import { useAuth } from '../context/AuthContext';
import { useIterationFeedback } from '../hooks/useIterationFeedback';
import FilterSelect from '../components/Calendar/FilterSelect';
import CreativeEntryModal from '../components/CreativeEntryModal';
import { AnimatePresence, motion } from 'framer-motion';
// import { FaRegComment } from 'react-icons/fa';

const Dashboard: React.FC = () => {
    const { currentDate } = useCalendarContext();
    const { creativeEntries, loading, updateEntry, deleteEntry } = useCreativeEntries(currentDate, { fetchAll: true });
    const { user } = useAuth();
    const { events } = useEvents(currentDate, { fetchAll: true });

    // Calculate generic stats for mobile top row
    const total = events.length + creativeEntries.length;
    const pending = events.filter(e => e.status === 'Pending').length + creativeEntries.filter(e => !e.status || e.status === 'Pending' || e.status === 'Client Approved').length;
    const ongoing = events.filter(e => e.status === 'Ongoing').length + creativeEntries.filter(e => e.status === 'Approved').length;
    const completed = events.filter(e => e.status === 'Completed').length;

    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string, status: 'Approved' | 'Rejected' | 'Client Approved' | 'Pending' } | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [ratioError, setRatioError] = useState<{ id: string, message: string } | null>(null);

    // State for toggling feedback inputs per entry
    const [showFeedbackInputs, setShowFeedbackInputs] = useState<Record<string, boolean>>({});

    const handleStatusUpdate = async (id: string, newStatus: 'Approved' | 'Rejected' | 'Client Approved' | 'Pending') => {
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

    const handleDeleteEntry = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this rejected entry? This action cannot be undone.")) {
            try {
                await deleteEntry(id);
            } catch (error) {
                console.error("Failed to delete entry:", error);
                alert("Failed to delete entry. Please try again.");
            }
        }
    };

    const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
    const { feedbacks, addFeedback, deleteFeedback, refreshFeedbacks, loading: feedbacksLoading } = useIterationFeedback(activeFeedbackId);
    const [feedbackText, setFeedbackText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialData, setModalInitialData] = useState<{ _id?: string; mediaId?: string; clientName?: string; category?: string; caption?: string; filePath?: string; ratio?: string; date?: string; }>();

    // Sort feedbacks to show latest first (descending order by createdAt)
    const sortedFeedbacks = useMemo(() => {
        return [...feedbacks].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [feedbacks]);

    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Cannot access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
        setAudioBlob(null);
        audioChunksRef.current = [];
    };

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
            if (user?.role === 'Client' && entry.status === 'Internal Review') return false;
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

    // Carousel slide direction per client: 1 = forward (right), -1 = backward (left)
    const [slideDirection, setSlideDirection] = useState<Record<string, number>>({});

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

    const updateViewState = (clientName: string, updates: Partial<{ mediaIndex: number, iterationIndex: number }>, direction?: number) => {
        if (direction !== undefined) {
            setSlideDirection(prev => ({ ...prev, [clientName]: direction }));
        }
        setViewState(prev => ({
            ...prev,
            [clientName]: { ...(prev[clientName] || { mediaIndex: 0, iterationIndex: -1 }), ...updates }
        }));
    };

    // Carousel slide variants
    const carouselVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
    };

    // Sync activeFeedbackId with the currently-viewed iteration (avoids setState-in-render)
    React.useEffect(() => {
        if (groupedEntries.length === 0) return;
        // Pick the first client group's active entry as the feedback target
        const firstGroup = groupedEntries[0];
        const maxMediaIndex = firstGroup.mediaGroups.length - 1;
        const maxIterationIndexes = firstGroup.mediaGroups.map(mg => mg.length);
        const { mediaIdx, iterIdx } = getActiveState(firstGroup.clientName, maxMediaIndex, maxIterationIndexes);
        const entry = firstGroup.mediaGroups[mediaIdx][iterIdx];
        if (entry && activeFeedbackId !== entry._id) {
            setActiveFeedbackId(entry._id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewState, groupedEntries]);

    // Toggle feedback input for a specific entry
    const toggleFeedbackInput = (entryId: string) => {
        setShowFeedbackInputs(prev => ({
            ...prev,
            [entryId]: !prev[entryId]
        }));
    };

    return (
        <div className="max-w-8xl mx-auto space-y-6">

            {/* Mobile-only Stats & Action Row */}
            {user?.role !== 'Client' && (
                <div className="md:hidden flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm"
                        >
                            New +
                        </button>
                    </div>
                    {/* Stats */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-hide">
                        <div className="flex flex-col items-center px-4 py-2 bg-white rounded-lg border border-gray-100 min-w-[70px] shadow-sm">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total</span>
                            <span className="text-sm font-bold text-gray-800">{total}</span>
                        </div>
                        <div className="flex flex-col items-center px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-100 min-w-[70px] shadow-sm">
                            <span className="text-[10px] text-yellow-600 uppercase font-bold tracking-wider">Pending</span>
                            <span className="text-sm font-bold text-yellow-700">{pending}</span>
                        </div>
                        <div className="flex flex-col items-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-100 min-w-[70px] shadow-sm">
                            <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Ongoing</span>
                            <span className="text-sm font-bold text-blue-700">{ongoing}</span>
                        </div>
                        <div className="flex flex-col items-center px-4 py-2 bg-green-50 rounded-lg border border-green-100 min-w-[70px] shadow-sm">
                            <span className="text-[10px] text-green-600 uppercase font-bold tracking-wider">Done</span>
                            <span className="text-sm font-bold text-green-700">{completed}</span>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-gray-400 align-center tp-50vh">Loading...</div>
            ) : (
                <>
                    {/* Dashboard Feed: Filters & List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* Filters Header */}
                        <div className="pl-4 pr-2 pt-2 border-b border-gray-100 bg-white flex flex-col md:flex-row items-start md:items-center gap-4">
                            <h3 className="text-lg font-bold text-gray-800 md:mr-4">Creative Entries</h3>

                            <div className={`grid ${user?.role !== 'Client' ? 'grid-cols-3' : 'grid-cols-2'} gap-1 w-full md:flex md:w-auto md:items-center md:gap-4 md:flex-1`}>
                                {user?.role !== 'Client' && (
                                    <>
                                        <div className="min-w-0">
                                            <FilterSelect
                                                label="Client"
                                                value={dashboardFilter.client}
                                                options={clientOptions}
                                                onChange={(val) => setDashboardFilter(prev => ({ ...prev, client: val }))}
                                                placeholder="All"
                                            />
                                        </div>
                                        <div className="w-px h-8 bg-gray-100 mx-2 hidden md:block"></div>
                                    </>
                                )}

                                <div className="min-w-0">
                                    <FilterSelect
                                        label="Category"
                                        value={dashboardFilter.category}
                                        options={[
                                            { label: 'Special Day', value: 'Special Day' },
                                            { label: 'Engagement', value: 'Engagement' },
                                            { label: 'Ideation', value: 'Ideation' },
                                        ]}
                                        onChange={(val) => setDashboardFilter(prev => ({ ...prev, category: val }))}
                                        placeholder="All"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <FilterSelect
                                        label="Status"
                                        value={dashboardFilter.status}
                                        options={[
                                            { label: 'Internal Review', value: 'Internal Review' },
                                            { label: 'Pending', value: 'Pending' },
                                            { label: 'Client Approved', value: 'Client Approved' },
                                            { label: 'Approved', value: 'Approved' },
                                            { label: 'Rejected', value: 'Rejected' },
                                        ]}
                                        onChange={(val) => setDashboardFilter(prev => ({ ...prev, status: val }))}
                                        placeholder="All"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Entries List Feed */}
                        <div className="p-6">
                            <div className="space-y-8">
                                {groupedEntries.length > 0 ? (
                                    groupedEntries.map((group) => {
                                        const { clientName, mediaGroups } = group;
                                        const maxMediaIndex = mediaGroups.length - 1;
                                        const maxIterationIndexes = mediaGroups.map(mg => mg.length);

                                        const { mediaIdx, iterIdx } = getActiveState(clientName, maxMediaIndex, maxIterationIndexes);

                                        const currentMediaGroup = mediaGroups[mediaIdx];
                                        const entry = currentMediaGroup[iterIdx];

                                        return (
                                            <div key={clientName} className="text-left relative py- border-b border-gray-100 last:border-b-0">

                                                {/* Iteration Carousel Arrows removed from main card container */}

                                                {/* Top Section */}
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border-b rounded-xl border-gray-300 bg-gray-100">
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
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide ${entry.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                        entry.status === 'Client Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                            entry.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                entry.status === 'Internal Review' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        STATUS: {entry.status || 'Pending'}
                                                    </span>
                                                    <div className="text-xs text-gray-500 font-medium mt-2 sm:mt-0 flex flex-row items-center justify-end gap-6 mr-4 sm:mr-0 xl:pr-8">
                                                        <span>{entry.username || 'Unknown'}</span>
                                                        <span className='flex flex-col text-right'>
                                                            <span className="text-gray-400 font-normal">Created: {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            <span className="text-indigo-600 font-bold">Posting Date: {new Date(entry.date).toLocaleDateString()}</span>
                                                        </span>
                                                        {(user?.username?.toLowerCase().includes('bhuvan') || user?.role === 'Admin') && (
                                                            <button
                                                                onClick={() => {
                                                                    setModalInitialData({
                                                                        _id: entry._id,
                                                                        mediaId: entry.mediaId,
                                                                        clientName: entry.clientName,
                                                                        category: entry.category,
                                                                        caption: entry.caption,
                                                                        filePath: entry.filePath,
                                                                        ratio: entry.ratio,
                                                                        date: entry.date
                                                                    });
                                                                    setIsModalOpen(true);
                                                                }}
                                                                className="px-2 py-1 bg-indigo-50 text-indigo-700 font-bold rounded hover:bg-indigo-100 uppercase tracking-wider border border-indigo-200 text-[10px]"
                                                            >
                                                                Edit Original
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Body Section - Carousel for iterations */}
                                                <div className="overflow-hidden">
                                                    <AnimatePresence custom={slideDirection[clientName] ?? 1} mode="wait">
                                                        <motion.div
                                                            key={`${clientName}-${mediaIdx}-${iterIdx}`}
                                                            custom={slideDirection[clientName] ?? 1}
                                                            variants={carouselVariants}
                                                            initial="enter"
                                                            animate="center"
                                                            exit="exit"
                                                            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                                                        >
                                                            <div className="p-4 sm:p-6 xl:px-12 bg-white sm:bg-transparent rounded-xl border border-gray-100 sm:border-none shadow-sm sm:shadow-none">
                                                                <div className="flex flex-col gap-1 mb-3">
                                                                    <div className="flex gap-2">
                                                                        {['1:1', '4:5', '9:16', '16:9'].map(r => (
                                                                            <button
                                                                                key={r}
                                                                                onClick={() => {
                                                                                    if (entry.ratio !== r && !(r === '1:1' && !entry.ratio)) {
                                                                                        setRatioError({ id: entry._id, message: 'This size is not available' });
                                                                                        setTimeout(() => {
                                                                                            setRatioError(prev => prev?.id === entry._id ? null : prev);
                                                                                        }, 2500);
                                                                                    }
                                                                                }}
                                                                                type="button"
                                                                                className={`px-3 py-1 text-xs font-bold rounded-md border transition-colors ${entry.ratio === r || (r === '1:1' && !entry.ratio)
                                                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                                                                    }`}
                                                                            >
                                                                                {r}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    {/* in mobile virew the in feedbakc  send button is not visible  ,   check work on it */}
                                                                    <AnimatePresence>
                                                                        {ratioError?.id === entry._id && (
                                                                            <motion.span
                                                                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                                                className="text-[11px] text-red-500 font-medium"
                                                                            >
                                                                                {ratioError.message}
                                                                            </motion.span>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                                <div className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 uppercase tracking-wider flex justify-between items-center">
                                                                    <span>Iteration {iterIdx + 1} <span className="text-gray-400 font-normal text-xs ml-1">of {currentMediaGroup.length}</span></span>

                                                                </div>

                                                                <div className="flex flex-col lg:flex-row gap-6">
                                                                    {/* Left Column: Image & Caption */}
                                                                    <div className="flex-none w-full lg:w-[30%] space-y-4">
                                                                        <div className="w-full bg-gray-50 rounded-xl flex border border-gray-200 px-10 py-4 sm:px-12 sm:py-6 overflow-hidden items-center justify-center relative group shadow-inner">
                                                                            {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                                                <video src={entry.filePath} controls className="w-full h-auto block" />
                                                                            ) : (
                                                                                <img
                                                                                    src={entry.filePath}
                                                                                    alt="Creative"
                                                                                    className="w-full h-auto block cursor-pointer transition-transform hover:scale-[1.02] rounded-md shadow-md ring-1 ring-gray-200/50"
                                                                                    onClick={() => setSelectedImage(entry.filePath)}
                                                                                />
                                                                            )}
                                                                            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
                                                                                {entry.mediaId.startsWith('vid') || entry.filePath?.match(/\.(mp4|webm|ogg)$/i) ? 'Video' : 'Image'}
                                                                            </div>

                                                                            {/* Iteration Arrows - Centered physically on the image */}
                                                                            {currentMediaGroup.length > 1 && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); if (iterIdx > 0) updateViewState(clientName, { iterationIndex: iterIdx - 1 }, -1); }}
                                                                                        disabled={iterIdx === 0}
                                                                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-indigo-600 hover:bg-white disabled:opacity-0 disabled:pointer-events-none z-20 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                                                        title="Previous Iteration"
                                                                                    >
                                                                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); if (iterIdx < maxIterationIndexes[mediaIdx] - 1) updateViewState(clientName, { iterationIndex: iterIdx + 1 }, 1); }}
                                                                                        disabled={iterIdx === maxIterationIndexes[mediaIdx] - 1}
                                                                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-indigo-600 hover:bg-white disabled:opacity-0 disabled:pointer-events-none z-20 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                                                        title="Next Iteration"
                                                                                    >
                                                                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <div className="border border-gray-200 rounded-lg p-4 min-h-[10px] bg-gray-50">
                                                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Captions</p>
                                                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.caption || 'No caption provided.'}</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Middle Column: Actions */}
                                                                    <div className="flex lg:flex-col flex-wrap items-center justify-center gap-4 lg:py-8 lg:px-2 relative">
                                                                        {/* Client Action */}
                                                                        {user?.role === 'Client' && (!entry.status || entry.status === 'Pending') && (
                                                                            <button
                                                                                onClick={() => handleStatusUpdate(entry._id, 'Approved')}
                                                                                className="px-4 py-2 rounded-full border border-green-300 bg-white flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors shadow-sm font-bold text-xs" title="Approve Entry">
                                                                                Approve
                                                                            </button>
                                                                        )}

                                                                        {/* Bhuvan Verify Action */}
                                                                        {(user?.username?.toLowerCase().includes('bhuvan') || user?.role === 'Admin') && entry.status === 'Internal Review' && (
                                                                            <button
                                                                                onClick={() => handleStatusUpdate(entry._id, 'Pending')}
                                                                                className="w-10 h-10 rounded-full border border-blue-400 bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors shadow-sm" title="Verify & Send to Client">
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                            </button>
                                                                        )}

                                                                        {/* Admin/Team Final Actions */}
                                                                        {user?.role !== 'Team' && user?.role !== 'Client' && (!entry.status || entry.status === 'Pending' || entry.status === 'Client Approved') && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => handleStatusUpdate(entry._id, 'Approved')}
                                                                                    className="w-10 h-10 rounded-full border border-green-400 bg-white flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors shadow-sm" title="Final Approve">
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleStatusUpdate(entry._id, 'Rejected')}
                                                                                    className="w-10 h-10 rounded-full border border-red-300 bg-white flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors shadow-sm" title="Reject">
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                        {/* Delete Option for Admin on Rejected Entries */}
                                                                        {user?.role === 'Admin' && entry.status === 'Rejected' && (
                                                                            <button
                                                                                onClick={() => handleDeleteEntry(entry._id)}
                                                                                className="w-10 h-10 rounded-full border border-red-400 bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors shadow-sm" title="Delete Entry">
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                            </button>
                                                                        )}

                                                                        {/* Plus Button - Add New Iteration */}
                                                                        {/* Only enabled when: non-Client role, entry is Pending, on latest iteration, AND a Client has given feedback */}
                                                                        {(() => {
                                                                            const isLatestIteration = iterIdx === currentMediaGroup.length - 1;
                                                                            const clientHasFeedback = sortedFeedbacks.some(fb => fb.role === 'Client');
                                                                            if (user?.role === 'Client' || (entry.status && entry.status !== 'Pending')) return null;
                                                                            return (
                                                                                <div className="flex flex-col items-center justify-center relative min-w-[60px]">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            if (isLatestIteration && clientHasFeedback) {
                                                                                                setModalInitialData({ mediaId: entry.mediaId, clientName, category: entry.category });
                                                                                                setIsModalOpen(true);
                                                                                            }
                                                                                        }}
                                                                                        disabled={!isLatestIteration || !clientHasFeedback}
                                                                                        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors shrink-0 shadow-sm z-10 ${isLatestIteration && clientHasFeedback
                                                                                            ? 'border-gray-400 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'
                                                                                            : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                                                                                            }`}
                                                                                        title={!isLatestIteration ? 'Navigate to the latest iteration' : !clientHasFeedback ? 'Waiting for client feedback before adding a new iteration' : 'Add New Iteration'}
                                                                                    >
                                                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                                                                        </svg>
                                                                                    </button>
                                                                                    <div className="mt-2 text-center text-[10px] leading-tight w-20">
                                                                                        {!clientHasFeedback
                                                                                            ? <span className="text-orange-400 font-medium">Awaiting client feedback</span>
                                                                                            : <span className="text-gray-500">Add new iteration</span>
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>

                                                                    {/* Right Column: Feedback Box & Plus Button */}
                                                                    <div className="flex-1 flex gap-4">
                                                                        {/* Feedback Box */}
                                                                        <div className={`w-full lg:max-w-[350px] flex-1 rounded-lg flex flex-col overflow-hidden bg-white border border-gray-100 lg:border-none shadow-sm lg:shadow-none transition-all duration-300 ease-in-out ${showFeedbackInputs[entry._id] || sortedFeedbacks.length > 0 ? 'h-[400px]' : 'h-min lg:h-[400px]'}`}>
                                                                            <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                                                                                <div className="flex items-center gap-2">
                                                                                    <h4 className="text-sm font-bold text-gray-700 text-left">Feedback of Iteration {iterIdx + 1}</h4>
                                                                                    {/* Refresh button visible on mobile only */}
                                                                                    <button
                                                                                        onClick={() => refreshFeedbacks()}
                                                                                        className="p-1 md:hidden text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors"
                                                                                        title="Refresh feedback"
                                                                                    >
                                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                                                    </button>
                                                                                </div>
                                                                                {/* Only show the add-feedback toggle on the latest iteration */}
                                                                                {iterIdx === currentMediaGroup.length - 1 && (
                                                                                    <button
                                                                                        onClick={() => toggleFeedbackInput(entry._id)}
                                                                                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                                        title={showFeedbackInputs[entry._id] ? "Hide feedback input" : "Add feedback"}
                                                                                    >
                                                                                        {showFeedbackInputs[entry._id] ? (
                                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                                        ) : (
                                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                                                        )}
                                                                                    </button>
                                                                                )}
                                                                                {/* Previous iterations show a lock hint */}
                                                                                {iterIdx < currentMediaGroup.length - 1 && (
                                                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-6V9a6 6 0 10-12 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z" /></svg>
                                                                                        Read-only
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className={`flex-1 p-4 overflow-y-auto space-y-8 flex-col-reverse ${!showFeedbackInputs[entry._id] && sortedFeedbacks.length === 0 ? 'hidden lg:flex' : 'flex'}`}>
                                                                                {feedbacksLoading ? (
                                                                                    <div className="text-center text-gray-400 text-sm mt-10">Loading comments...</div>
                                                                                ) : sortedFeedbacks.length === 0 ? (
                                                                                    <div className="text-center text-gray-400 text-sm mt-10">
                                                                                        No feedback yet.<br />Start the conversation!
                                                                                    </div>
                                                                                ) : (
                                                                                    sortedFeedbacks.map((fb) => {
                                                                                        const isCurrentUser = fb.userId === user?._id || fb._id.startsWith('temp');
                                                                                        if (!isCurrentUser) {
                                                                                            return (
                                                                                                <div key={fb._id} className="flex flex-col gap-1 items-start group">
                                                                                                    <div className={`text-sm p-3 rounded-lg rounded-tl-none border relative w-[100%] max-w-md ${fb.role === 'Client' ? 'bg-blue-50 text-gray-800 border-blue-100' : 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                                                                                                        <div className="flex justify-between items-start">
                                                                                                            <span className="text-xs font-semibold text-gray-700">{fb.username || 'User'}</span>
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <span className="text-[10px] text-gray-400">
                                                                                                                    {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},
                                                                                                                    {new Date(fb.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                                                                </span>
                                                                                                                {user?.role === 'Admin' && (
                                                                                                                    <button onClick={() => deleteFeedback(fb._id)} className="text-gray-400 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" title="Delete">
                                                                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                                                                    </button>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {fb.text && <div className="mt-1">{fb.text}</div>}
                                                                                                        {fb.audioUrl && (
                                                                                                            <div className="mt-2 w-full overflow-x-hidden rounded-full">
                                                                                                                <audio src={fb.audioUrl} controls className="h-9 w-full max-w-full" style={{ minWidth: '150px' }} />
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        } else {
                                                                                            return (
                                                                                                <div key={fb._id} className="flex flex-col gap-1 items-end mt-4 group">
                                                                                                    <div className={`text-sm p-3 rounded-lg rounded-tr-none border relative max-w-sm ${fb.role === 'Client' ? 'bg-blue-50 text-gray-800 border-blue-100' : 'bg-indigo-50 text-indigo-900 border-indigo-100'}`}>
                                                                                                        <div className="flex justify-between items-start flex-row-reverse mb-1 gap-2">
                                                                                                            <div className="flex items-center gap-1">
                                                                                                                <span className="text-xs font-semibold text-gray-700">You ({fb.role})</span>
                                                                                                                <button onClick={() => deleteFeedback(fb._id)} className="text-red-400 hover:text-red-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-1" title="Delete">
                                                                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                                                                </button>
                                                                                                            </div>
                                                                                                            <span className="text-[10px] text-gray-400 pt-0.5">
                                                                                                                {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},
                                                                                                                {new Date(fb.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        {fb.text && <div className="mt-1">{fb.text}</div>}
                                                                                                        {fb.audioUrl && (
                                                                                                            <div className="mt-2 flex justify-end w-full overflow-x-hidden rounded-full">
                                                                                                                <audio src={fb.audioUrl} controls className="h-9 w-full max-w-full" style={{ minWidth: '150px' }} />
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                    })
                                                                                )}
                                                                            </div>
                                                                            {/* Input area — only on latest iteration */}
                                                                            {showFeedbackInputs[entry._id] && iterIdx === currentMediaGroup.length - 1 && (
                                                                                <div className="p-3 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
                                                                                    {audioBlob && (
                                                                                        <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-md">
                                                                                            <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 flex-1" />
                                                                                            <button onClick={cancelRecording} className="p-1 text-red-500 hover:bg-red-100 rounded">
                                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                    {isRecording && (
                                                                                        <div className="flex items-center gap-2 bg-red-50 p-2 rounded-md animate-pulse">
                                                                                            <span className="w-2 h-2 rounded-full bg-red-500" />
                                                                                            <span className="text-red-600 text-xs font-semibold flex-1">Recording...</span>
                                                                                            <button onClick={stopRecording} className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold shadow-sm">Stop</button>
                                                                                        </div>
                                                                                    )}
                                                                                    <form
                                                                                        onSubmit={async (e) => {
                                                                                            e.preventDefault();
                                                                                            if (feedbackText.trim() || audioBlob) {
                                                                                                await addFeedback(feedbackText, audioBlob || undefined);
                                                                                                setFeedbackText('');
                                                                                                setAudioBlob(null);
                                                                                            }
                                                                                        }}
                                                                                        className="flex items-center gap-2 border border-gray-300 rounded-md p-1 bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow"
                                                                                    >
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={isRecording ? stopRecording : startRecording}
                                                                                            className={`p-2 shrink-0 rounded transition-colors ${isRecording ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                                                                            title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
                                                                                        >
                                                                                            {isRecording ? (
                                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" strokeWidth="2" fill="currentColor" /></svg>
                                                                                            ) : (
                                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                                                                            )}
                                                                                        </button>
                                                                                        <input
                                                                                            type="text"
                                                                                            placeholder={audioBlob ? "Add caption (optional)..." : "Type feedback..."}
                                                                                            value={feedbackText}
                                                                                            onChange={(e) => setFeedbackText(e.target.value)}
                                                                                            className="flex-1 min-w-0 bg-transparent px-2 py-1 text-sm outline-none"
                                                                                            autoFocus
                                                                                        />
                                                                                        <button
                                                                                            type="submit"
                                                                                            className={`p-2 shrink-0 rounded transition-colors ml-1 ${(!feedbackText.trim() && !audioBlob) ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                                                                            title="Send"
                                                                                            disabled={!feedbackText.trim() && !audioBlob}
                                                                                        >
                                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                                                                            </svg>
                                                                                        </button>
                                                                                    </form>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </AnimatePresence>
                                                </div>

                                                {/* Footer Strip - Media Pagination (different mediaIds) + Iteration Dots */}
                                                <div className="px-2 sm:px-6 pb-5 pt-2 border-t border-gray-200 rounded-xl bg-gray-100">
                                                    <div className="flex items-center justify-between max-w-2xl mx-auto gap-2 sm:gap-4">

                                                        {/* Media Prev — navigate different mediaIds */}
                                                        {mediaGroups.length > 1 ? (
                                                            <button
                                                                onClick={() => updateViewState(clientName, { mediaIndex: Math.max(0, mediaIdx - 1), iterationIndex: -1 })}
                                                                disabled={mediaIdx === 0}
                                                                className="w-8 h-8 shrink-0 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-colors"
                                                                title="Previous Media ID"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                            </button>
                                                        ) : <div className="w-8 shrink-0" />}

                                                        {/* Center: Iteration dots */}
                                                        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                                                            {currentMediaGroup.map((_, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => updateViewState(clientName, { iterationIndex: i }, i > iterIdx ? 1 : -1)}
                                                                    title={`Iteration ${i + 1}`}
                                                                    className={`rounded-full border transition-all shrink-0 ${i === iterIdx
                                                                        ? 'w-7 h-7 border-indigo-400 bg-indigo-600 text-white text-xs font-bold shadow-sm'
                                                                        : 'w-6 h-6 border-gray-300 bg-white text-gray-500 text-xs hover:border-indigo-300 hover:text-indigo-600'
                                                                        }`}
                                                                >
                                                                    {i + 1}
                                                                </button>
                                                            ))}
                                                            {mediaGroups.length > 1 && (
                                                                <span className="ml-1 sm:ml-2 text-[9px] sm:text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                                    Media {mediaIdx + 1}/{mediaGroups.length}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Media Next — navigate different mediaIds */}
                                                        {mediaGroups.length > 1 ? (
                                                            <button
                                                                onClick={() => updateViewState(clientName, { mediaIndex: Math.min(maxMediaIndex, mediaIdx + 1), iterationIndex: -1 })}
                                                                disabled={mediaIdx === maxMediaIndex}
                                                                className="w-8 h-8 shrink-0 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-colors"
                                                                title="Next Media ID"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                            </button>
                                                        ) : <div className="w-8 shrink-0" />}
                                                    </div>
                                                </div>

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
                            {pendingStatusUpdate.status === 'Approved' || pendingStatusUpdate.status === 'Client Approved' ? (
                                <svg className="w-14 h-14 text-green-500 mx-auto drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : pendingStatusUpdate.status === 'Pending' ? (
                                <svg className="w-14 h-14 text-blue-500 mx-auto drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
                            {pendingStatusUpdate.status === 'Approved' || pendingStatusUpdate.status === 'Client Approved' ? 'Approve Entry' : pendingStatusUpdate.status === 'Pending' ? 'Send to Client' : 'Reject Entry'}
                        </h3>
                        <p className="text-gray-600 text-[15px] mb-4 font-medium">
                            You're going to {pendingStatusUpdate.status === 'Approved' || pendingStatusUpdate.status === 'Client Approved' ? 'approve' : pendingStatusUpdate.status === 'Pending' ? 'send' : 'reject'} this "Entry"
                        </p>
                        {pendingStatusUpdate.status !== 'Pending' ? (
                            <p className="text-red-500 text-sm font-bold mb-8">
                                Note: Once you do this, all further actions and feedback for this iteration will be permanently disabled.
                            </p>
                        ) : (
                            <p className="text-blue-500 text-sm font-bold mb-8">
                                Note: This will verify the entry and make it visible to the client.
                            </p>
                        )}
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={cancelStatusUpdate}
                                className="flex-1 py-3 px-2 bg-[#EAEAEA] hover:bg-[#dfdfdf] text-gray-800 font-semibold rounded-xl transition-colors text-[15px]"
                            >
                                No, keep it.
                            </button>
                            <button
                                onClick={confirmStatusUpdate}
                                className={`flex-1 py-3 px-2 text-white font-semibold rounded-xl transition-all text-[15px] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] ${pendingStatusUpdate.status === 'Approved' || pendingStatusUpdate.status === 'Client Approved'
                                    ? 'bg-green-500 hover:bg-green-600 shadow-green-500/50'
                                    : 'bg-[#FF3B30] hover:bg-[#e6352b] shadow-red-500/50'
                                    }`}
                            >
                                Yes, {pendingStatusUpdate.status === 'Client Approved' ? 'Approve' : pendingStatusUpdate.status}!
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
                onSuccess={() => { setIsModalOpen(false); window.location.reload(); }}
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
