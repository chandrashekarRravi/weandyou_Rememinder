import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface CreativeEntryType {
    _id: string;
    mediaId: string;
    filePath: string;
    caption?: string;
    category?: string;
    date: string; // Posting Date
    username?: string;
    createdAt: string; // ISO string
}

export const useCreativeEntries = (currentDate: Date) => {
    const [creativeEntries, setCreativeEntries] = useState<CreativeEntryType[]>([]);
    const [loading, setLoading] = useState(false);

    const monthStartStr = startOfMonth(currentDate).toISOString();

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const start = monthStartStr;
            const end = endOfMonth(currentDate).toISOString();
            console.log('Fetching entries for range:', { start, end });
            const response = await axios.get('/api/creative-entries', {
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

    return { creativeEntries, loading, refreshEntries: fetchEntries };
};
