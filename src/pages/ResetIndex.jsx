import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiSun, FiSunset, FiClock, FiZap, FiArrowRight, FiCheck, FiList } from 'react-icons/fi';
import useStore from '../store';
import useSubscription from '../hooks/useSubscription';
import Paywall from '../components/common/Paywall';
import { FREE_TIER_LIMITS } from '../utils/manifestProtocol';
import { formatHuman } from '../utils/dateUtils';

/**
 * Landing page for the Reset Protocol — explains the ritual + lets user start
 * Mini (free) or Full (paid). Lists past sessions.
 */
const ResetIndex = () => {
  const { t } = useTranslation();
  const { fetchResetSessions, countMiniResetsThisQuarter } = useStore();
  const { isPaid, openCheckout } = useSubscription();

  const [sessions, setSessions] = useState([]);
  const [miniThisQuarter, setMiniThisQuarter] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ sessions }, count] = await Promise.all([
        fetchResetSessions(),
        countMiniResetsThisQuarter(),
      ]);
      setSessions(sessions || []);
      setMiniThisQuarter(count);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const miniLeft = Math.max(0, FREE_TIER_LIMITS.miniResetPerYear - miniThisQuarter);
  const canMini = isPaid || miniThisQuarter < 1; // free: 1 per quarter

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-7">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
          <FiZap className="w-3.5 h-3.5" />
          {t('reset.indexTag')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('reset.indexTitle')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
          {t('reset.indexSubtitle')}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {/* Mini reset card */}
        <div className="card p-6 flex flex-col">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3">
            <FiSun className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t('reset.miniName')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {t('reset.miniDuration')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-1 leading-relaxed">
            {t('reset.miniDesc')}
          </p>

          {!isPaid && (
            <p className="text-xs text-gray-400 mb-3">
              {t('reset.miniQuotaThisQuarter', { used: miniThisQuarter, total: 1 })}
            </p>
          )}

          {canMini ? (
            <Link
              to="/reset/run?kind=mini"
              className="btn btn-secondary inline-flex items-center justify-center gap-2"
            >
              {t('reset.startMini')}
              <FiArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
              {t('reset.miniNextQuarter')}
            </div>
          )}
        </div>

        {/* Full reset card */}
        <div className="card p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
            {isPaid ? t('paywall.included') : t('paywall.annual')}
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3">
            <FiSunset className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t('reset.fullName')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {t('reset.fullDuration')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-1 leading-relaxed">
            {t('reset.fullDesc')}
          </p>

          {isPaid ? (
            <Link
              to="/reset/run?kind=full"
              className="btn btn-primary inline-flex items-center justify-center gap-2"
            >
              {t('reset.startFull')}
              <FiArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={openCheckout}
              className="btn btn-primary inline-flex items-center justify-center gap-2"
            >
              <FiZap className="w-4 h-4" />
              {t('reset.unlockFull')}
            </button>
          )}
        </div>
      </div>

      {/* Past sessions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <FiList className="w-4 h-4" />
          {t('reset.historyTitle')}
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-400">{t('reset.historyEmpty')}</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map(s => {
              const date = s.completedAt
                ? formatHuman(s.completedAt)
                : (s.updatedAt?.toDate?.() ? formatHuman(s.updatedAt.toDate()) : '—');
              const isComplete = !!s.completedAt;
              return (
                <li key={s.id} className="card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isComplete ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      {isComplete
                        ? <FiCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        : <FiClock className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {s.kind === 'full' ? t('reset.fullName') : t('reset.miniName')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isComplete ? t('reset.completed', { date }) : t('reset.draft', { date })}
                      </p>
                    </div>
                  </div>
                  {!isComplete && (
                    <Link
                      to={`/reset/run?id=${s.id}&kind=${s.kind}`}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {t('reset.continue')}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ResetIndex;
