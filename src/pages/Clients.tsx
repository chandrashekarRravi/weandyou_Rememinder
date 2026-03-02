import React, { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Clients: React.FC = () => {
    const { clients, loading, createClient, deleteClient } = useClients();
    const { user } = useAuth();
    const [newClientName, setNewClientName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Protect this page for Admins only
    if (user?.role !== 'Admin') {
        return <Navigate to="/" replace />;
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientName.trim()) return;

        setSubmitting(true);
        setError('');
        try {
            await createClient(newClientName.trim());
            setNewClientName('');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Error creating client');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the client "${name}"?`)) {
            try {
                await deleteClient(id);
            } catch (err: any) {
                alert(err.response?.data?.message || 'Error deleting client');
            }
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading clients...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
                <p className="text-gray-500 text-sm mt-1">Manage the global list of clients used across the platform.</p>
            </div>

            {/* Add New Client Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Add New Client</h2>
                    <p className="text-sm text-indigo-600 bg-indigo-50 p-3 rounded-lg mt-2 border border-indigo-100">
                        <span className="font-semibold">Note:</span> Adding a new client will automatically generate a User account for them so they can log in. <br />
                        <b>Username:</b> [Client Name]<br />
                        <b>Password:</b> [Client Name]@{new Date().getFullYear()}
                    </p>
                </div>
                <form onSubmit={handleCreate} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Client Name..."
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                        required
                    />
                    <button
                        type="submit"
                        disabled={submitting || !newClientName.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Adding...' : 'Add Client'}
                    </button>
                </form>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            {/* Client List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800">Existing Clients ({clients.length})</h2>
                </div>
                {clients.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No clients registered yet.</div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {clients.map(client => (
                            <li key={client._id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                                <div>
                                    <h3 className="text-md font-medium text-gray-900">{client.clientName}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Added {new Date(client.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(client._id, client.clientName)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Clients;
