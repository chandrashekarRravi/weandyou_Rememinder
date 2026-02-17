import React from 'react';
import CalendarGrid from '../components/Calendar/CalendarGrid.tsx';
import { useCalendarContext } from '../context/CalendarContext.tsx';
import { useEvents } from '../hooks/useEvents.ts';

const Dashboard: React.FC = () => {
    const { currentDate, daysRequired } = useCalendarContext();
    const { events, loading } = useEvents(currentDate);

    const itemsWithReview = React.useMemo(() => events.filter(e => (e.review && e.review.trim() !== '')), [events]);
    const itemsWithCaptions = React.useMemo(() => events.filter(e => (e.captions && e.captions.trim() !== '')), [events]);


    return (
        <div className="space-y-8">
            <CalendarGrid
                currentDate={currentDate}
                days={daysRequired}
            />
            {/* 
<section className="max-w-4xl mx-auto">
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100/50 mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Reviews & Captions</h3>
                    <p className="text-sm text-gray-500">Recent reviews and captions from events in the current month.</p>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading...</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-600 mb-3">Reviews</h4>
                            {itemsWithReview.length === 0 ? (
                                <p className="text-gray-400">No reviews available.</p>
                            ) : (
                                <div className="space-y-4">
                                    {itemsWithReview.map(item => (
                                        <div key={item._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-sm font-semibold text-gray-800">{item.title}</div>
                                                <div className="text-xs text-gray-500">{item.clientName || 'No Client'}</div>
                                            </div>
                                            <p className="text-sm text-gray-700">{item.review}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-600 mb-3">Captions</h4>
                            {itemsWithCaptions.length === 0 ? (
                                <p className="text-gray-400">No captions available.</p>
                            ) : (
                                <div className="space-y-4">
                                    {itemsWithCaptions.map(item => (
                                        <div key={item._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-sm font-semibold text-gray-800">{item.title}</div>
                                                <div className="text-xs text-gray-500">{item.clientName || 'No Client'}</div>
                                            </div>
                                            <p className="text-sm text-gray-700">{item.captions}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
*/}

        </div>
    );
};

export default Dashboard;
