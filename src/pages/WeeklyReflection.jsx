import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FiCalendar, FiTrendingUp, FiCheck, FiArrowRight, FiLoader, FiZap,
  FiStar, FiAlertTriangle, FiTarget, FiList,
} from 'react-icons/fi';
import useStore from '../store';
import useToast from '../hooks/useToast';
import useSubscription from '../hooks/useSubscription';
import { ToastContainer } from '../components/Toast';
import { WEEKLY_REFLECTION_KEYS, FREE_TIER_LIMITS } from '../utils/manifestProtocol';
import { toIsoWeek, formatHuman, startOfWeek } from '../utils/dateUtils';

const SCALE_KEY = 'w1_identityProgress';
const STATUS_KEY = 'w4_projectStatus';

const STATUS_OPTIONS = ['ahead', 'on', 'behind', 'adjust'];

const WeeklyReflection = () => {
  const { t } = useTranslation();
  const { saveWeeklyReflection, fetchWeeklyReflection, fetchWeeklyReflections } = useStore();
  const { isPaid, openCheckout } = useSubscription();
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const weekId = toIsoWeek(new Date());
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ reflection }, { reflections }] = await Promise.all([
        fetchWeeklyReflection(weekId),
        fetchWeeklyReflections(24),
      ]);
      if (reflection) setAnswers(reflection.answers || {});
      setHistory(reflections || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId]);

  const update = (k, v) => setAnswers((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const result = await saveWeeklyReflection(weekId, answers);
    setSaving(false);
    if (result.success) showSuccess(t('reflection.saved'), 2000);
    else showError(result.error || t('reflection.saveFailed'));
  };

  // Free-tier sees only the most recent N weeks
  const visibleHistory = isPaid
    ? history
    : history.slice(0, FREE_TIER_LIMITS.reflectionHistoryWeeks);
  const hiddenCount = Math.max(0, history.length - visibleHistory.length);

  const weekRange = (() => {
    const s = startOfWeek(new Date());
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    return `${formatHuman(s)} – ${formatHuman(e)}`;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin w-6 h-6 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="mb-7">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
          <FiCalendar className="w-3.5 h-3.5" />
          {t('reflection.tag')} · {weekId}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {t('reflection.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {weekRange} · {t('reflection.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        {WEEKLY_REFLECTION_KEYS.map((key) => {
          const isScale = key === SCALE_KEY;
          const isStatus = key === STATUS_KEY;
          const v = answers[key];

          return (
            <div key={key} className="card p-5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {t(`reflection.q.${key}.prompt`)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t(`reflection.q.${key}.help`)}
              </p>

              {isScale && (
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => update(key, n)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                        v === n
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow scale-110'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:scale-105'
                      }`}
                    >{n}</button>
                  ))}
                </div>
              )}

              {isStatus && (
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => update(key, s)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        v === s
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >{t(`reflection.statusOpts.${s}`)}</button>
                  ))}
                </div>
              )}

              {!isScale && !isStatus && (
                <textarea
                  value={v || ''}
                  onChange={(e) => update(key, e.target.value)}
                  rows={3}
                  className="input w-full text-sm leading-relaxed resize-none"
                  placeholder={t('reflection.placeholder')}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          {saving ? <FiLoader className="animate-spin w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
          {t('reflection.save')}
        </button>
      </div>

      {/* History */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <FiList className="w-4 h-4" />
          {t('reflection.historyTitle')}
        </h2>
        {visibleHistory.length === 0 ? (
          <p className="text-sm text-gray-400">{t('reflection.historyEmpty')}</p>
        ) : (
          <ul className="space-y-2">
            {visibleHistory.map(r => (
              <li key={r.id} className="card p-3 text-sm flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{r.weekId}</p>
                  <p className="text-xs text-gray-400">
                    {t('reflection.summary', {
                      score: r.answers?.[SCALE_KEY] || '—',
                      status: r.answers?.[STATUS_KEY] ? t(`reflection.statusOpts.${r.answers[STATUS_KEY]}`) : '—',
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {hiddenCount > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50/40 to-purple-50/40 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('reflection.hiddenCount', { count: hiddenCount })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('reflection.unlockHint')}
              </p>
            </div>
            <button onClick={openCheckout} className="btn btn-primary inline-flex items-center gap-2 text-sm">
              <FiZap className="w-4 h-4" /> {t('paywall.cta')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyReflection;
