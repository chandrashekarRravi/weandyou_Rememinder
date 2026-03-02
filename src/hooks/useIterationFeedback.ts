import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';
import { useSocket } from '../context/SocketContext';

export interface IterationFeedbackType {
    _id: string;
    creativeEntryId: string;
    userId: string;
    username: string;
    role: string;
    text: string;
    createdAt: string;
}

export const useIterationFeedback = (creativeEntryId: string | null) => {
    const [feedbacks, setFeedbacks] = useState<IterationFeedbackType[]>([]);
    const [loading, setLoading] = useState(false);
    const socket = useSocket();

    const fetchFeedbacks = useCallback(async () => {
        if (!creativeEntryId) {
            setFeedbacks([]);
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/api/iteration-feedbacks/${creativeEntryId}`);
            setFeedbacks(response.data);
        } catch (error) {
            console.error('Error fetching iteration feedbacks:', error);
        } finally {
            setLoading(false);
        }
    }, [creativeEntryId]);

    useEffect(() => {
        fetchFeedbacks();
    }, [fetchFeedbacks]);

    useEffect(() => {
        if (!socket || !creativeEntryId) return;

        const handleNewFeedback = (newFeedback: IterationFeedbackType) => {
            if (newFeedback.creativeEntryId === creativeEntryId) {
                setFeedbacks(prev => [...prev, newFeedback]);
            }
        };

        socket.on('newIterationFeedback', handleNewFeedback);

        return () => {
            socket.off('newIterationFeedback', handleNewFeedback);
        };
    }, [socket, creativeEntryId]);

    const addFeedback = async (text: string) => {
        if (!creativeEntryId || !text.trim()) return null;

        try {
            const response = await api.post('/api/iteration-feedbacks', {
                creativeEntryId,
                text
            });
            // We don't need to manually update state here because the socket will emit the event
            // and the listener will pick it up, adding it to the state.
            return response.data;
        } catch (error) {
            console.error('Error adding iteration feedback:', error);
            throw error;
        }
    };

    return { feedbacks, loading, addFeedback, refreshFeedbacks: fetchFeedbacks };
};
