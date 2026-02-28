import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';
import { useSocket } from '../context/SocketContext';

export interface ClientType {
    _id: string;
    clientName: string;
    contactEmail?: string;
    createdAt: string;
}

export const useClients = () => {
    const [clients, setClients] = useState<ClientType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const socket = useSocket();

    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/api/clients');
            setClients(data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    useEffect(() => {
        if (!socket) return;

        socket.on('clientCreated', (client: ClientType) => {
            setClients(prev => [...prev, client].sort((a, b) => a.clientName.localeCompare(b.clientName)));
        });

        socket.on('clientDeleted', (id: string) => {
            setClients(prev => prev.filter(c => c._id !== id));
        });

        return () => {
            socket.off('clientCreated');
            socket.off('clientDeleted');
        };
    }, [socket]);

    const createClient = async (clientName: string, contactEmail?: string) => {
        const { data } = await api.post('/api/clients', { clientName, contactEmail });
        return data;
    };

    const deleteClient = async (id: string) => {
        await api.delete(`/api/clients/${id}`);
    };

    return { clients, loading, error, createClient, deleteClient, fetchClients };
};
