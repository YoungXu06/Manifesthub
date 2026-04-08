import React, { useEffect, useRef } from 'react';
import useStore from '../store';
import { ToastContainer } from './Toast';
import useToast from '../hooks/useToast';

/**
 * Global Toast Notifications Component
 * This component listens to the store's notification state and displays toast messages
 * It should be placed at the root level of the app to show notifications from any store action
 */
const GlobalToastNotifications = () => {
  const { notifications, removeNotification } = useStore();
  const { toasts, addToast, removeToast } = useToast();
  const processedNotifications = useRef(new Set());

  // Listen to store notifications and convert them to local toasts
  useEffect(() => {
    notifications.forEach(notification => {
      // Check if this notification has already been processed
      if (!processedNotifications.current.has(notification.id)) {
        // Mark as processed
        processedNotifications.current.add(notification.id);
        
        // Add the notification as a toast
        addToast(notification.message, notification.type, notification.duration);
        
        // Remove the notification from store immediately
        removeNotification(notification.id);
      }
    });

    // Clean up processed notifications set periodically to prevent memory leaks
    if (processedNotifications.current.size > 100) {
      processedNotifications.current.clear();
    }
  }, [notifications, addToast, removeNotification]);

  return <ToastContainer toasts={toasts} removeToast={removeToast} />;
};

export default GlobalToastNotifications; 