import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { FaPlus, FaCheck, FaTrash, FaFileAlt, FaPaperclip } from 'react-icons/fa';

const Tasks: React.FC = () => {
    const { user } = useAuth();
    const { tasks, loading, createTask, updateTaskStatus, deleteTask } = useTasks();
    const { team } = useTeam();

    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isAdminOrBhuvan = user?.role === 'Admin' || user?.username?.toLowerCase().includes('bhuvan');
    const isClient = user?.role === 'Client';

    if (isClient) {
        return <Navigate to="/" replace />;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !assignedTo) {
            setError('Please provide a description and assign a team member.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('assignedTo', assignedTo);
            formData.append('createdBy', user?.username || 'Unknown');
            
            files.forEach(file => {
                formData.append('files', file);
            });

            await createTask(formData);
            setDescription('');
            setAssignedTo('');
            setFiles([]);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error creating task');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading Tasks...</div>;
    }

    // Filter tasks based on user role
    const visibleTasks = isAdminOrBhuvan 
        ? tasks 
        : tasks.filter(t => t.assignedTo === user?.username);

    return (
        <div className="p-4 md:p-8 pt-8 max-w-7xl mx-auto space-y-10 animate-fade-in pb-20 md:pb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Tasks</h1>
                <p className="text-gray-500 text-sm mt-1">Assign work and track progress within the creative team.</p>
            </div>

            {isAdminOrBhuvan && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Assign New Task</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Task Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the task..."
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 text-sm outline-none min-h-[100px]"
                                />
                            </div>
                            <div className="flex flex-col gap-4 w-full md:w-64 shrink-0">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Assign To (@name)</label>
                                    <select
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 text-sm outline-none bg-white"
                                    >
                                        <option value="">Select team member...</option>
                                        {team.map(member => (
                                            <option key={member._id} value={member.username}>@{member.username}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
                                        <span className="bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2 border border-gray-200 w-full justify-center">
                                            <FaPaperclip className="text-gray-500" />
                                            {files.length > 0 ? `${files.length} file(s)` : 'Attach Files (PDF, etc)'}
                                        </span>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-xs">{error}</p>}
                        
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting || !description.trim() || !assignedTo}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm"
                            >
                                {isSubmitting ? 'Assigning...' : <><FaPlus /> Assign Task</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Assigned Tasks</h2>
                {visibleTasks.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                        No tasks found.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {visibleTasks.map(task => (
                            <div key={task._id} className={`bg-white rounded-xl border p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${task.status === 'Completed' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {task.status}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {new Date(task.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-800 whitespace-pre-wrap font-medium">
                                        {task.description}
                                    </div>
                                    
                                    {task.fileUrls && task.fileUrls.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attachments</div>
                                            {task.fileUrls.map((url, idx) => (
                                                <a 
                                                    key={idx}
                                                    href={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${url}` : url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50 p-2 rounded-md"
                                                >
                                                    <FaFileAlt className="shrink-0" />
                                                    <span className="truncate">{task.fileNames[idx] || `File ${idx + 1}`}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-[11px] text-gray-500">
                                        Assigned by <span className="font-bold text-gray-700">{task.createdBy}</span> to <span className="font-bold text-indigo-600">@{task.assignedTo}</span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {task.status !== 'Completed' && (task.assignedTo === user?.username || isAdminOrBhuvan) && (
                                            <button
                                                onClick={() => updateTaskStatus(task._id, 'Completed')}
                                                className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors"
                                                title="Mark as Completed"
                                            >
                                                <FaCheck className="w-3 h-3" />
                                            </button>
                                        )}
                                        {isAdminOrBhuvan && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this task?')) deleteTask(task._id);
                                                }}
                                                className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                                                title="Delete Task"
                                            >
                                                <FaTrash className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tasks;
