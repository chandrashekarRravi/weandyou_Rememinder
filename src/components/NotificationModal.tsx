import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell } from 'react-icons/fi';

interface NotificationModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
  userRole: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onAllow, onDeny, userRole }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiBell className="text-3xl text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {Notification.permission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-base leading-relaxed">
                {Notification.permission === 'denied' 
                  ? "It looks like you have blocked notifications. Please click the site settings (lock) icon in your browser's address bar and set Notifications to 'Allow' so we can keep you updated!"
                  : userRole === 'Client' 
                    ? "Please allow notifications so we can let you know the moment your poster or design is ready! We want to keep you updated in real-time."
                    : "Please allow notifications so we can keep you updated when entry and rejection approvals happen. This ensures the entire team stays coordinated!"}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={onAllow}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  {Notification.permission === 'denied' ? 'I have enabled them' : 'Allow Notifications'}
                </button>
                <button
                  onClick={onDeny}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;
