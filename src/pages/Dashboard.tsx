import React from 'react';
import { useEvents } from '../hooks/useEvents';
import { useCalendarContext } from '../context/CalendarContext';

const Review: React.FC = () => {
    const { currentDate } = useCalendarContext();
    const { events, loading } = useEvents(currentDate);

    const reviewItems = React.useMemo(() => events.filter(e => e.review && e.review.trim() !== ''), [events]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-semibold">Reviews</h2>
            {loading ? (
                <div className="text-gray-400">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {reviewItems.length === 0 ? (
                        <div className="text-gray-500">No reviews found for this month.</div>
                    ) : (
                        reviewItems.map(r => (
                            <div key={r._id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-semibold">{r.title}</div>
                                    <div className="text-xs text-gray-500">{r.clientName || 'No Client'}</div>
                                </div>
                                <p className="text-gray-700">{r.review}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Review;
