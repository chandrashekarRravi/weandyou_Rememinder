import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useIterationFeedback } from '../hooks/useIterationFeedback';
import type { CreativeEntryType } from '../hooks/useCreativeEntries';

interface EntryFeedbackBoxProps {
    entry: CreativeEntryType;
    iterIdx: number;
    currentMediaGroupLength: number;
}

const EntryFeedbackBox: React.FC<EntryFeedbackBoxProps> = ({ entry, iterIdx, currentMediaGroupLength }) => {
    const { user } = useAuth();
    const { feedbacks, addFeedback, deleteFeedback, refreshFeedbacks, loading: feedbacksLoading } = useIterationFeedback(entry._id);
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);

    const sortedFeedbacks = useMemo(() => {
        return [...feedbacks].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [feedbacks]);

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

    return (
        <div className={`w-full lg:max-w-[350px] flex-1 rounded-lg flex flex-col overflow-hidden bg-white border border-gray-100 lg:border-none shadow-sm lg:shadow-none transition-all duration-300 ease-in-out ${showFeedbackInput || sortedFeedbacks.length > 0 ? 'h-[400px]' : 'h-min lg:h-[400px]'}`}>
            <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-700 text-left">Feedback of Iteration {iterIdx + 1}</h4>
                    <button
                        onClick={() => refreshFeedbacks()}
                        className="p-1 md:hidden text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors"
                        title="Refresh feedback"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
                {iterIdx === currentMediaGroupLength - 1 && (
                    <button
                        onClick={() => setShowFeedbackInput(prev => !prev)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title={showFeedbackInput ? "Hide feedback input" : "Add feedback"}
                    >
                        {showFeedbackInput ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        )}
                    </button>
                )}
                {iterIdx < currentMediaGroupLength - 1 && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-6V9a6 6 0 10-12 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z" /></svg>
                        Read-only
                    </span>
                )}
            </div>
            <div className={`flex-1 p-4 overflow-y-auto space-y-8 flex-col-reverse ${!showFeedbackInput && sortedFeedbacks.length === 0 ? 'hidden lg:flex' : 'flex'}`}>
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
            {showFeedbackInput && iterIdx === currentMediaGroupLength - 1 && (
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
    );
};

export default EntryFeedbackBox;
