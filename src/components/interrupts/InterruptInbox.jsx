import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiBell, FiArrowRight, FiX } from 'react-icons/fi';
import useStore from '../../store';
import { toDateStr } from '../../utils/dateUtils';
import { getDuePrompts, getInterruptSettings, scheduleTodayNotifications } from '../../utils/interrupts';

/**
 * Slim in-app banner showing the count of pending interrupts.
 * Mounted in MainLayout so it appears on every authenticated page.
 */
const InterruptInbox = () => {
  const { t } = useTranslation();
  const { user, fetchInterruptResponses } = useStore();
  const [due, setDue] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const settings = getInterruptSettings();
    if (!settings.enabled || !user) return;

    let cancel = false;
    (async () => {
      const dateStr = toDateStr(new Date());
      const { responses } = await fetchInterruptResponses(dateStr);
      if (cancel) return;
      const list = getDuePrompts(responses, new Date());
      setDue(list);
      // Also schedule live notifications for not-yet-due slots
      scheduleTodayNotifications(responses);
    })();

    // Re-check every 5 min while page is open
    const handle = setInterval(async () => {
      const dateStr = toDateStr(new Date());
      const { responses } = await fetchInterruptResponses(dateStr);
      setDue(getDuePrompts(responses, new Date()));
    }, 5 * 60 * 1000);

    return () => { cancel = true; clearInterval(handle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (dismissed || due.length === 0) return null;
  const next = due[0];

  return (
    <div className="mb-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/40 p-3 flex items-center gap-3 animate-fade-in">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
        <FiBell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('interrupts.banner.title', { count: due.length })}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {t(`interrupts.q.${next.key}.short`)}
        </p>
      </div>
      <Link
        to={`/interrupt?slot=${next.key}`}
        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 transition-colors"
      >
        {t('interrupts.banner.answer')}
        <FiArrowRight className="w-3.5 h-3.5" />
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
};

export default InterruptInbox;
