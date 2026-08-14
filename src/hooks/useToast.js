import useStore from '../store';

/**
 * Toast facade — stable API over the store's global notification channel.
 * Single source of truth: store.notifications + one renderer mounted at App
 * root (GlobalToastNotifications). Page-level toast containers were removed
 * to avoid overlapping stacks / duplicate toasts.
 */
const useToast = () => {
  const toasts = useStore((s) => s.notifications);
  const removeToast = useStore((s) => s.removeNotification);
  const showSuccess = useStore((s) => s.showSuccess);
  const showError = useStore((s) => s.showError);
  const showWarning = useStore((s) => s.showWarning);
  const showInfo = useStore((s) => s.showInfo);

  return { toasts, removeToast, showSuccess, showError, showWarning, showInfo };
};

export default useToast;
