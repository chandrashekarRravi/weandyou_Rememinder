import { useState, useEffect } from 'react';
import api from '../utils/axios';

export interface TeamMember {
    _id: string;
    username: string;
    role: string;
    createdAt?: string;
}

export const useTeam = () => {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTeam = async () => {
        try {
            const { data } = await api.get('/api/auth/team');
            setTeam(data);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const createTeamMember = async (name: string) => {
        const { data } = await api.post('/api/auth/team', { name });
        setTeam(prev => [...prev, data.user]);
        return data.user;
    };

    const deleteTeamMember = async (id: string) => {
        await api.delete(`/api/auth/team/${id}`);
        setTeam(prev => prev.filter(member => member._id !== id));
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    return {
        team,
        loading,
        createTeamMember,
        deleteTeamMember,
        fetchTeam
    };
};
