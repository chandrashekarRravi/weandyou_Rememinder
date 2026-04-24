import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/axios';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const socket = useSocket();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleNewNotification = (notif: any) => {
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
        };
        socket.on('new_notification', handleNewNotification);
        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    // Close click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };
    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.delete(`/api/notifications/${id}`);
            setNotifications(prev => {
                const notif = prev.find(n => n._id === id);
                if (notif && !notif.read) {
                    setUnreadCount(count => Math.max(0, count - 1));
                }
                return prev.filter(n => n._id !== id);
            });
        } catch (err) {
            console.error(err);
        }
    };

    const clearAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications?')) return;
        try {
            await api.delete('/api/notifications/clear-all');
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };
    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none transition-colors"
                aria-label="Notifications"
            >
                <FiBell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100">
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <span className="font-semibold text-gray-700">Notifications</span>
                        <div className="flex space-x-3">
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button 
                                    onClick={clearAllNotifications}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500">
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map(notif => (
                                    <div 
                                        key={notif._id} 
                                        className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className={`text-sm font-medium text-gray-900 ${!notif.read ? 'font-semibold' : ''}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                {notif.actionLink && (
                                                    <Link 
                                                        to={notif.actionLink} 
                                                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                                                        onClick={() => {
                                                            if (!notif.read) markAsRead(notif._id);
                                                            setIsOpen(false);
                                                        }}
                                                    >
                                                        View details
                                                    </Link>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex flex-col space-y-2 ml-3">
                                                {!notif.read && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <FiCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => deleteNotification(notif._id, e)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Delete notification"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
