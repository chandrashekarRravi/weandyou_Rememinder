import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';
import { useSocket } from '../context/SocketContext';

export interface IterationFeedbackType {
    _id: string;
    creativeEntryId: string;
    userId: string;
    username: string;
    role: string;
    text?: string;
    audioUrl?: string;
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

    const addFeedback = async (text: string, audioBlob?: Blob) => {
        if (!creativeEntryId || (!text.trim() && !audioBlob)) return null;

        const tempId = `temp-${Date.now()}`;
        
        let localAudioUrl: string | undefined = undefined;
        if (audioBlob) {
            localAudioUrl = URL.createObjectURL(audioBlob);
        }

        const tempFeedback: IterationFeedbackType = {
            _id: tempId,
            creativeEntryId,
            userId: 'temp', 
            username: 'You',
            role: 'Sending...',
            text: text || undefined,
            audioUrl: localAudioUrl,
            createdAt: new Date().toISOString()
        };

        // Add optimistic UI bubble
        setFeedbacks(prev => [...prev, tempFeedback]);

        try {
            let audioUrl = undefined;
            if (audioBlob) {
                const formData = new FormData();
                formData.append('file', audioBlob, 'audio_note.webm');
                const uploadRes = await api.post('/api/feedbacks/upload', formData);
                audioUrl = uploadRes.data.url;
            }

            const response = await api.post('/api/iteration-feedbacks', {
                creativeEntryId,
                text,
                audioUrl
            });
            
            const newFeedback = response.data;
            setFeedbacks(prev => {
                const filtered = prev.filter(fb => fb._id !== tempId);
                if (filtered.some(fb => fb._id === newFeedback._id)) return filtered;
                return [...filtered, newFeedback];
            });
            return response.data;
        } catch (error) {
            console.error('Error adding iteration feedback:', error);
            // Remove the temporary bubble if it fails
            setFeedbacks(prev => prev.filter(fb => fb._id !== tempId));
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
