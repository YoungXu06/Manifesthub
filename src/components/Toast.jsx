import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';

const Toast = ({ type = 'success', message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for animation to finish
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-500',
          icon: <FiCheck className="w-5 h-5" />,
          textColor: 'text-white'
        };
      case 'error':
        return {
          bgColor: 'bg-red-500',
          icon: <FiX className="w-5 h-5" />,
          textColor: 'text-white'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500',
          icon: <FiAlertCircle className="w-5 h-5" />,
          textColor: 'text-white'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-500',
          icon: <FiInfo className="w-5 h-5" />,
          textColor: 'text-white'
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          icon: <FiInfo className="w-5 h-5" />,
          textColor: 'text-white'
        };
    }
  };

  const config = getToastConfig();

  return (
    <div
      className={`${config.bgColor} ${config.textColor} px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } flex items-center space-x-3 max-w-sm relative`}
    >
      <div className="flex-shrink-0">
        {config.icon}
      </div>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast container component
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast; 