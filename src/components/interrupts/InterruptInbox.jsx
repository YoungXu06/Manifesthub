import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiBell, FiArrowRight, FiX, FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import useStore from '../../store';
import { toDateStr } from '../../utils/dateUtils';
import {
  getDuePrompts,
  getInterruptSettings,
  scheduleTodayNotifications,
  isInterruptDismissed,
  dismissInterrupts,
} from '../../utils/interrupts';
import { INTERRUPT_PROMPTS } from '../../utils/manifestProtocol';

/**
 * Slim in-app banner showing the count of pending interrupts.
 * Mounted in MainLayout so it appears on every authenticated page.
 */
const InterruptInbox = () => {
  const { t } = useTranslation();
  const { user, fetchInterruptResponses } = useStore();
  const location = useLocation();
  const [due, setDue] = useState([]);
  const [responses, setResponses] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return isInterruptDismissed(toDateStr(new Date())); } catch { return false; }
  });

  useEffect(() => {
    const settings = getInterruptSettings();
    if (!settings.enabled || !user) return;

    let cancel = false;
    const refresh = async () => {
      const dateStr = toDateStr(new Date());
      const { responses: resp } = await fetchInterruptResponses(dateStr);
      if (cancel) return;
      setResponses(resp);
      setDue(getDuePrompts(resp, new Date()));
      // (Re-)schedule today's live notifications — deduped inside the util.
      scheduleTodayNotifications(resp);
    };

    refresh();
    // Re-check every 5 min while page is open
    const handle = setInterval(refresh, 5 * 60 * 1000);

    return () => { cancel = true; clearInterval(handle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Hide the banner while the user is actually answering interrupts
  const pathname = location.pathname;
  if (pathname === '/reset/run' || pathname === '/interrupt') return null;
  if (dismissed || due.length === 0) return null;

  const next = due[0];
  const timedSlots = INTERRUPT_PROMPTS.filter(p => p.time !== 'free');

  return (
    <div className="mb-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/40 p-3 animate-fade-in">
      <div className="flex items-center gap-3">
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
          onClick={() => { dismissInterrupts(toDateStr(new Date())); setDismissed(true); }}
          aria-label="Dismiss"
          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/30">
        <button
          onClick={() => setShowAll(s => !s)}
          aria-expanded={showAll}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 inline-flex items-center gap-1"
        >
          {t('interrupts.banner.viewAll', { defaultValue: 'View all' })}
          {showAll ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAll && (
          <ul className="mt-2 space-y-1">
            {timedSlots.map(p => {
              const answered = !!responses[p.key];
              return (
                <li key={p.key}>
                  <Link
                    to={`/interrupt?slot=${p.key}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <span className="truncate">
                      <span className="font-mono text-gray-400 dark:text-gray-500">{p.time}</span>
                      {' · '}
                      {t(`interrupts.q.${p.key}.short`)}
                    </span>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      answered
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}>
                      {answered && <FiCheck className="w-3 h-3" />}
                      {answered
                        ? t('interrupts.banner.answered', { defaultValue: 'Answered' })
                        : t('interrupts.banner.pending', { defaultValue: 'Pending' })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InterruptInbox;
