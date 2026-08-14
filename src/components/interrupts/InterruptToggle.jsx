import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBell, FiBellOff } from 'react-icons/fi';
import { getInterruptSettings, setInterruptSettings, requestNotificationPermission } from '../../utils/interrupts';
import useToast from '../../hooks/useToast';

/**
 * Compact switch that the user can drop into Profile or Dashboard
 * to opt-in/out of pattern interrupts. Handles the browser permission flow.
 */
const InterruptToggle = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    setEnabled(!!getInterruptSettings().enabled);
  }, []);

  const handleToggle = async () => {
    if (enabled) {
      setInterruptSettings({ enabled: false });
      setEnabled(false);
      showSuccess(t('interrupts.disabled'), 1500);
      return;
    }
    // Enabling — request browser permission first
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      setInterruptSettings({ enabled: true });
      setEnabled(true);
      showSuccess(t('interrupts.enabledWithNotif'), 2000);
    } else if (result === 'denied') {
      // Still enable in-app inbox (no native pop-ups, but banner works)
      setInterruptSettings({ enabled: true });
      setEnabled(true);
      showSuccess(t('interrupts.enabledNoNotif'), 2400);
    } else {
      showError(t('interrupts.permissionFailed'));
    }
  };

  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={handleToggle}
      className={`w-full flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
        enabled
          ? 'border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/15'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          enabled ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          {enabled
            ? <FiBell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            : <FiBellOff className="w-4 h-4 text-gray-400" />}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('interrupts.toggleTitle')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {enabled
              ? (permission === 'granted'
                  ? t('interrupts.notifState', { defaultValue: 'Browser notifications on' })
                  : t('interrupts.notifState', { defaultValue: 'In-app only' }))
              : t('interrupts.toggleDisabled')}
          </p>
        </div>
      </div>
      {/* Switch track + thumb */}
      <span
        aria-hidden="true"
        className={`relative inline-flex flex-shrink-0 h-6 w-10 items-center rounded-full transition-colors ${
          enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
};

export default InterruptToggle;
