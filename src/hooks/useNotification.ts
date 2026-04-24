import { useEffect, useState } from 'react';
import { requestNotificationPermissionAndToken, onMessageListener } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import api from '../utils/axios';

export const useNotification = () => {
    const { user, isAuthenticated } = useAuth();
    const socket = useSocket();
    const [showModal, setShowModal] = useState(false);
    
    useEffect(() => {
        if (isAuthenticated && user) {
            // Check if we need to request permission
            if (Notification.permission !== 'granted') {
                setShowModal(true);
            } else {
                setupNotifications();
            }
            
            if (socket) {
                // Join the user's specific notification room
                socket.emit('join_room', user._id);

                // Listen for real-time notifications from Socket.io
                socket.on('new_notification', (notification) => {
                    toast(
                        `${notification.title}\n${notification.message}`,
                        { 
                            duration: 4000,
                            icon: notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'
                        }
                    );
                });
            }
        }

        return () => {
            if (socket) {
                socket.off('new_notification');
            }
        }
    }, [isAuthenticated, user, socket]);

    const setupNotifications = async () => {
        try {
            const token = await requestNotificationPermissionAndToken();
            if (token) {
                // Send the token to your backend using the central API instance
                await api.post('/api/auth/device-token', {
                    userId: user?._id,
                    fcmToken: token
                });
                console.log('Token successfully sent to backend!');
            }
        } catch (error) {
            console.error('Failed to setup notifications:', error);
        }

        // Listen for foreground messages
        onMessageListener().then((payload: any) => {
            console.log('Received foreground message:', payload);
            toast(
                `${payload?.notification?.title}\n${payload?.notification?.body}`,
                { duration: 4000 }
            );
        }).catch(err => console.log('failed: ', err));
    };

    return {
        showModal,
        setShowModal,
        setupNotifications,
        userRole: user?.role || ''
    };
};
