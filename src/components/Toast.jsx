import React, { useEffect, useState } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const CONFIG = {
  success: { icon: FiCheck,   chip: 'bg-emerald-500',  accent: 'border-l-emerald-500',  labelKey: 'common.success' },
  error:   { icon: FiAlertCircle, chip: 'bg-red-500', accent: 'border-l-red-500',       labelKey: 'common.error' },
  warning: { icon: FiAlertCircle, chip: 'bg-amber-500',accent: 'border-l-amber-500',     labelKey: 'common.warning' },
  info:    { icon: FiInfo,    chip: 'bg-blue-500',    accent: 'border-l-blue-500',      labelKey: 'common.info' },
};

const Toast = ({ type = 'success', message, duration = 3000, onClose }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // wait for exit animation
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, paused, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const cfg = CONFIG[type] || CONFIG.info;
  const Icon = cfg.icon;
  const isAlert = type === 'error' || type === 'warning';

  return (
    <div
      role={isAlert ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto w-full max-w-sm flex items-start gap-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 border-l-4 ${cfg.accent} shadow-lg px-4 py-3 transition-all duration-300 ${isVisible ? 'toast-enter opacity-100' : 'translate-x-4 opacity-0'}`}
    >
      <span className={`flex-shrink-0 w-7 h-7 rounded-full ${cfg.chip} text-white flex items-center justify-center mt-0.5`}>
        <Icon className="w-4 h-4" />
      </span>
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-100 min-w-0 break-words">{message}</p>
      <button
        type="button"
        onClick={handleClose}
        aria-label={t('common.closeNotification', { defaultValue: 'Close notification' })}
        className="flex-shrink-0 p-1 -m-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

// Single global container — rendered once from App root (GlobalToastNotifications).
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    // Above app modals (z-[9999]) so in-modal feedback stays visible; below ConfirmDialog (z-[10001]).
    <div className="fixed top-16 right-4 z-[10000] flex flex-col items-end gap-2 w-full max-w-sm pointer-events-none">
      {toasts.slice(-5).map((toast) => (
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
