import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';
import { useSocket } from '../context/SocketContext';

export interface TaskType {
    _id: string;
    description: string;
    fileUrls: string[];
    fileNames: string[];
    assignedTo: string;
    createdBy: string;
    status: 'Pending' | 'Completed';
    createdAt: string;
}

export const useTasks = () => {
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/tasks');
            setTasks(res.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
        
        // Listen to socket events for real-time updates
        const handleNewTask = (task: TaskType) => {
            setTasks(prev => [task, ...prev]);
        };
        const handleTaskUpdated = (updatedTask: TaskType) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        };
        const handleTaskDeleted = (taskId: string) => {
            setTasks(prev => prev.filter(t => t._id !== taskId));
        };

        if (!socket) return;

        socket.on('new_task', handleNewTask);
        socket.on('task_updated', handleTaskUpdated);
        socket.on('task_deleted', handleTaskDeleted);

        return () => {
            socket.off('new_task', handleNewTask);
            socket.off('task_updated', handleTaskUpdated);
            socket.off('task_deleted', handleTaskDeleted);
        };
    }, [fetchTasks, socket]);

    const createTask = async (formData: FormData) => {
        try {
            const res = await api.post('/api/tasks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setTasks(prev => [res.data, ...prev]);
            return res.data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    };

    const updateTaskStatus = async (id: string, status: 'Pending' | 'Completed') => {
        try {
            const res = await api.patch(`/api/tasks/${id}/status`, { status });
            setTasks(prev => prev.map(t => t._id === id ? res.data : t));
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await api.delete(`/api/tasks/${id}`);
            setTasks(prev => prev.filter(t => t._id !== id));
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    };

    return { tasks, loading, createTask, updateTaskStatus, deleteTask, refreshTasks: fetchTasks };
};
