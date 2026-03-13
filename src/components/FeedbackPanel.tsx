import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useIterationFeedback } from '../hooks/useIterationFeedback';

interface FeedbackPanelProps {
    entryId: string;
    onFeedbackAdded?: () => void;
    readOnly?: boolean;
    showInput?: boolean;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ entryId, onFeedbackAdded, readOnly = false, showInput = true }) => {
    const { user } = useAuth();
    const { feedbacks, addFeedback, loading } = useIterationFeedback(entryId);
    const [feedbackText, setFeedbackText] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (feedbackText.trim() && !readOnly) {
            await addFeedback(feedbackText);
            setFeedbackText('');
            if (onFeedbackAdded) onFeedbackAdded();
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white">
            <div className="flex-1 p-2 overflow-y-auto space-y-4">
                {loading ? (
                    <div className="text-center text-gray-400 text-sm mt-4">Loading comments...</div>
                ) : feedbacks.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-4">
                        No feedback yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedbacks.map((fb) => (
                            <div key={fb._id} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-800">
                                        {fb.username || 'User'} {fb.userId === user?._id && '(You)'}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  {new Date(fb.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap pl-1">
                                    {fb.text}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Input Box */}
            {showInput && !readOnly && (
                <div className="p-2 border-t border-gray-100 mt-2">
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-2 border border-gray-300 rounded-md p-1 bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow"
                    >
                        <input
                            type="text"
                            placeholder="Type feedback..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            className="flex-1 bg-transparent px-2 py-1 text-sm outline-none"
                        />
                        <button type="submit" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors ml-1" title="Send" disabled={!feedbackText.trim()}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default FeedbackPanel;
