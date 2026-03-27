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
                    <div className="space-y-6">
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
                <div className="p-4 border-t border-gray-200 mt-2 bg-gray-50">
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-3"
                    >
                        <textarea
                            placeholder="Add your feedback..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            className="w-full border border-gray-300 rounded-md p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[100px] shadow-sm bg-white"
                        />
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" 
                                disabled={!feedbackText.trim()}
                            >
                                Submit Feedback
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default FeedbackPanel;
