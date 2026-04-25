import React, { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaUserTie, FaUsers } from 'react-icons/fa';

const Clients: React.FC = () => {
    const { clients, loading: clientsLoading, createClient, deleteClient } = useClients();
    const { team, loading: teamLoading, createTeamMember, deleteTeamMember } = useTeam();
    const { user } = useAuth();
    
    // Client State
    const [newClientName, setNewClientName] = useState('');
    const [submittingClient, setSubmittingClient] = useState(false);
    const [clientError, setClientError] = useState('');
    
    // Team State
    const [newTeamName, setNewTeamName] = useState('');
    const [submittingTeam, setSubmittingTeam] = useState(false);
    const [teamError, setTeamError] = useState('');

    // Protect this page for Admins and Bhuvan
    if (user?.role !== 'Admin' && !user?.username?.toLowerCase().includes('bhuvan')) {
        return <Navigate to="/" replace />;
    }

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientName.trim()) return;

        setSubmittingClient(true);
        setClientError('');
        try {
            await createClient(newClientName.trim());
            setNewClientName('');
        } catch (err: unknown) {
            const error = err as any;
            setClientError(error.response?.data?.message || error.message || 'Error creating client');
        } finally {
            setSubmittingClient(false);
        }
    };

    const handleDeleteClient = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the client "${name}"?`)) {
            try {
                await deleteClient(id);
            } catch (err: unknown) {
                const error = err as any;
                alert(error.response?.data?.message || 'Error deleting client');
            }
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;

        setSubmittingTeam(true);
        setTeamError('');
        try {
            await createTeamMember(newTeamName.trim());
            setNewTeamName('');
        } catch (err: unknown) {
            const error = err as any;
            setTeamError(error.response?.data?.message || error.message || 'Error creating team member');
        } finally {
            setSubmittingTeam(false);
        }
    };

    const handleDeleteTeam = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete team member "${name}"?`)) {
            try {
                await deleteTeamMember(id);
            } catch (err: unknown) {
                const error = err as any;
                alert(error.response?.data?.message || 'Error deleting team member');
            }
        }
    };

    if (clientsLoading || teamLoading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    return (
        <div className="p-4 md:p-8 pt-8 max-w-7xl mx-auto space-y-10 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-500 text-sm mt-1">Manage global Clients and internal Team members.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ---------------- CLIENT MANAGEMENT ---------------- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FaUserTie className="text-xl text-indigo-600" />
                        <h2 className="text-xl font-bold text-gray-800">Clients</h2>
                    </div>
                    {/* Add New Client Form */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-md font-semibold text-gray-800">Add New Client</h3>
                            <p className="text-xs text-indigo-600 bg-indigo-50 p-3 rounded-lg mt-2 border border-indigo-100">
                                <span className="font-semibold">Note:</span> Generating a client creates a login account:<br />
                                <b>Username:</b> [Client Name]<br />
                                <b>Password:</b> [Client Name]@{new Date().getFullYear()}
                            </p>
                        </div>
                        <form onSubmit={handleCreateClient} className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Client Name..."
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
                                required
                            />
                            <button
                                type="submit"
                                disabled={submittingClient || !newClientName.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
                            >
                                {submittingClient ? 'Adding...' : <><FaPlus className="mr-2" /> Add</>}
                            </button>
                        </form>
                        {clientError && <p className="text-red-500 text-xs mt-2">{clientError}</p>}
                    </div>

                    {/* Client List */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-800">Existing Clients</h3>
                            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">{clients.length}</span>
                        </div>
                        {clients.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">No clients registered.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                                {clients.map(client => (
                                    <li key={client._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">{client.clientName}</h4>
                                            <p className="text-[10px] text-gray-400 mt-1">Added {new Date(client.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteClient(client._id, client.clientName)}
                                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors flex items-center gap-1"
                                        >
                                            <FaTrash />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* ---------------- TEAM MANAGEMENT ---------------- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FaUsers className="text-xl text-teal-600" />
                        <h2 className="text-xl font-bold text-gray-800">Team</h2>
                    </div>
                    {/* Add New Team Form */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-md font-semibold text-gray-800">Add New Team Member</h3>
                            <p className="text-xs text-teal-700 bg-teal-50 p-3 rounded-lg mt-2 border border-teal-100">
                                <span className="font-semibold">Note:</span> Creating a team member generates a login account:<br />
                                <b>Username:</b> [Name]@team<br />
                                <b>Password:</b> [Name]@12345
                            </p>
                        </div>
                        <form onSubmit={handleCreateTeam} className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Team Member Name..."
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 text-sm outline-none"
                                required
                            />
                            <button
                                type="submit"
                                disabled={submittingTeam || !newTeamName.trim()}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
                            >
                                {submittingTeam ? 'Adding...' : <><FaPlus className="mr-2" /> Add</>}
                            </button>
                        </form>
                        {teamError && <p className="text-red-500 text-xs mt-2">{teamError}</p>}
                    </div>

                    {/* Team List */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-800">Existing Team Members</h3>
                            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-0.5 rounded-full">{team.length}</span>
                        </div>
                        {team.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">No team members registered.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                                {team.map(member => (
                                    <li key={member._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">{member.username}</h4>
                                            <p className="text-[10px] text-gray-400 mt-1">Role: {member.role}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTeam(member._id, member.username)}
                                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors flex items-center gap-1"
                                        >
                                            <FaTrash />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Clients;
