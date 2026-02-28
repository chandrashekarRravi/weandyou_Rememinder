import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useSocket } from '../context/SocketContext';

export interface CreativeEntryType {
    _id: string;
    mediaId: string;
    filePath: string;
    caption?: string;
    category?: string;
    date: string; // Posting Date
    username?: string;
    clientName?: string;
    createdAt: string; // ISO string
    status?: 'Pending' | 'Approved' | 'Rejected';
}

export const useCreativeEntries = (currentDate: Date) => {
    const [creativeEntries, setCreativeEntries] = useState<CreativeEntryType[]>([]);
    const [loading, setLoading] = useState(false);
    const socket = useSocket();

    const monthStartStr = startOfMonth(currentDate).toISOString();

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const start = monthStartStr;
            const end = endOfMonth(currentDate).toISOString();
            console.log('Fetching entries for range:', { start, end });
            const response = await api.get('/api/creative-entries', {
                params: { start, end }
            });
            console.log('Fetched Creative Entries:', response.data);
            setCreativeEntries(response.data);
        } catch (error) {
            console.error('Error fetching creative entries:', error);
        } finally {
            setLoading(false);
        }
    }, [monthStartStr]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    useEffect(() => {
        if (!socket) return;

        const handleEntryCreated = (newEntry: CreativeEntryType) => {
            setCreativeEntries(prev => [newEntry, ...prev]);
        };

        const handleEntryUpdated = (updatedEntry: CreativeEntryType) => {
            setCreativeEntries(prev => prev.map(entry => entry._id === updatedEntry._id ? updatedEntry : entry));
        };

        const handleEntryDeleted = (deletedId: string) => {
            setCreativeEntries(prev => prev.filter(entry => entry._id !== deletedId));
        };

        socket.on('creativeEntryCreated', handleEntryCreated);
        socket.on('creativeEntryUpdated', handleEntryUpdated);
        socket.on('creativeEntryDeleted', handleEntryDeleted);

        return () => {
            socket.off('creativeEntryCreated', handleEntryCreated);
            socket.off('creativeEntryUpdated', handleEntryUpdated);
            socket.off('creativeEntryDeleted', handleEntryDeleted);
        };
    }, [socket]);

    const updateEntry = async (id: string, updates: Partial<CreativeEntryType>) => {
        try {
            const response = await api.put(`/api/creative-entries/${id}`, updates);
            // Optimistic update
            setCreativeEntries(prev => prev.map(entry => entry._id === id ? { ...entry, ...updates } : entry));
            return response.data;
        } catch (error) {
            console.error('Error updating creative entry:', error);
            throw error;
        }
    };

    const deleteEntry = async (id: string) => {
        try {
            await api.delete(`/api/creative-entries/${id}`);
            // Optimistic update
            setCreativeEntries(prev => prev.filter(entry => entry._id !== id));
        } catch (error) {
            console.error('Error deleting creative entry:', error);
            throw error;
        }
    };

    return { creativeEntries, loading, refreshEntries: fetchEntries, updateEntry, deleteEntry };
};
