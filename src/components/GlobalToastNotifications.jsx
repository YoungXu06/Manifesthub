import React from 'react';
import useStore from '../store';
import { ToastContainer } from './Toast';

/**
 * Single global toast renderer. Mounted once at App root; reads straight
 * from the store's notification channel so every showSuccess/showError call
 * (from actions or pages) lands in exactly one place.
 */
const GlobalToastNotifications = () => {
  const notifications = useStore((s) => s.notifications);
  const removeNotification = useStore((s) => s.removeNotification);
  return <ToastContainer toasts={notifications} removeToast={removeNotification} />;
};

export default GlobalToastNotifications;
