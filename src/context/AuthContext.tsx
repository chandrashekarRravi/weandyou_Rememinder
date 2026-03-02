import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import api from '../utils/axios';

export type Role = 'Admin' | 'Team' | 'Client';

export interface User {
    _id: string;
    username: string;
    role: Role;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Initialize from localStorage and fetch current user
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            api.get('/api/auth/me', { headers: { Authorization: `Bearer ${storedToken}` } })
                .then(res => {
                    setUser({ _id: res.data._id, username: res.data.username, role: res.data.role });
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load user profile", err);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = (newUser: User, newToken: string) => {
        setUser(newUser);
        setToken(newToken);
        localStorage.setItem('token', newToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, loading }}>
            {!loading ? children : <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-gray-500">Loading Session...</div>}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
