import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiX, FiExternalLink } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

// Global event bus for cross-component communication
export const indexEventBus = {
  listeners: {},
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        listener => listener !== callback
      );
    };
  },
  publish(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
};

// Helper to trigger index notifications
export const notifyIndexRequired = (collectionName, indexUrl) => {
  indexEventBus.publish('indexRequired', { collectionName, indexUrl });
};

const IndexNotification = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // Subscribe to index-required events
    const unsubscribe = indexEventBus.subscribe('indexRequired', data => {
      // Prevent duplicate notifications
      if (!notifications.some(n => n.indexUrl === data.indexUrl)) {
        setNotifications(prev => [...prev, { ...data, id: Date.now() }]);
      }
    });
    
    return () => unsubscribe();
  }, [notifications]);
  
  // User dismisses a notification
  const dismissNotification = id => {
    setNotifications(notifications.filter(n => n.id !== id));
  };
  
  // Render nothing if no notifications
  if (notifications.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className="bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 shadow-lg rounded-lg p-4 flex items-start"
        >
          <div className="flex-shrink-0 text-amber-500 dark:text-amber-400 mr-3 mt-0.5">
            <FiAlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-amber-800 dark:text-amber-300">
              {t('indexNotification.title')}
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              {t('indexNotification.needsIndex', { collection: notification.collectionName })}
            </p>
            <a 
              href={notification.indexUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center text-sm font-medium text-amber-600 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
            >
              {t('indexNotification.createNow')}
              <FiExternalLink className="ml-1 h-4 w-4" />
            </a>
          </div>
          <button 
            onClick={() => dismissNotification(notification.id)}
            className="flex-shrink-0 ml-2 text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
          >
            <span className="sr-only">{t('common.dismiss')}</span>
            <FiX className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default IndexNotification; 