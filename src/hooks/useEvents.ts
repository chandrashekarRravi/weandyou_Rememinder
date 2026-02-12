import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface EventType {
    _id: string;
    title: string;
    date: string; // ISO string
    startTime?: string;
    endTime?: string;
    description?: string;
    clientName?: string;
    clientBrand?: string;
    poster?: string;
    review?: string;
    captions?: string;
    category: 'Special Day' | 'Engagement' | 'Ideation' | 'Other';
    status: 'Pending' | 'Ongoing' | 'Completed';
    // other fields...
}

export const useEvents = (currentDate: Date) => {
    const [events, setEvents] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(false);
    const socket = useSocket();

    // Stabilize the date dependency by using the start of the month string
    // This prevents infinite loops if the passed 'currentDate' object reference changes but represents the same month
    const monthStartStr = startOfMonth(currentDate).toISOString();

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const start = monthStartStr;
            const end = endOfMonth(currentDate).toISOString();
            const response = await axios.get('/api/events', {
                params: { start, end }
            });
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    }, [monthStartStr]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        if (!socket) return;

        socket.on('eventCreated', (newEvent: EventType) => {
            setEvents(prev => [...prev, newEvent]);
        });

        socket.on('eventUpdated', (updatedEvent: EventType) => {
            setEvents(prev => prev.map(evt => evt._id === updatedEvent._id ? updatedEvent : evt));
        });

        socket.on('eventDeleted', (deletedEventId: string) => {
            setEvents(prev => prev.filter(evt => evt._id !== deletedEventId));
        });

        return () => {
            socket.off('eventCreated');
            socket.off('eventUpdated');
            socket.off('eventDeleted');
        };
    }, [socket]);

    return { events, loading, refreshEvents: fetchEvents };
};
