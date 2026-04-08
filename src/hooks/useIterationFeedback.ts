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
                setFeedbacks(prev => {
                    // Prevent duplicates in case the HTTP POST response already appended it
                    if (prev.some(fb => fb._id === newFeedback._id)) return prev;
                    return [...prev, newFeedback];
                });
            }
        };

        socket.on('newIterationFeedback', handleNewFeedback);
        socket.on('deleteIterationFeedback', (deletedId: string) => {
            setFeedbacks(prev => prev.filter(fb => fb._id !== deletedId));
        });

        return () => {
            socket.off('newIterationFeedback', handleNewFeedback);
            socket.off('deleteIterationFeedback');
        };
    }, [socket, creativeEntryId]);

    const addFeedback = async (text: string) => {
        if (!creativeEntryId || !text.trim()) return null;

        try {
            const response = await api.post('/api/iteration-feedbacks', {
                creativeEntryId,
                text
            });
            // Update local state instantly so the user doesn't have to wait for the socket
            const newFeedback = response.data;
            setFeedbacks(prev => {
                if (prev.some(fb => fb._id === newFeedback._id)) return prev;
                return [...prev, newFeedback];
            });
            return response.data;
        } catch (error) {
            console.error('Error adding iteration feedback:', error);
            throw error;
        }
    };

    const deleteFeedback = async (id: string) => {
        try {
            await api.delete(`/api/iteration-feedbacks/${id}`);
            setFeedbacks(prev => prev.filter(fb => fb._id !== id));
        } catch (error) {
            console.error('Error deleting iteration feedback:', error);
            throw error;
        }
    };

    return { feedbacks, loading, addFeedback, deleteFeedback, refreshFeedbacks: fetchFeedbacks };
};
