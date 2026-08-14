import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiEdit3, FiClock, FiArrowRight, FiZap, FiRotateCcw } from 'react-icons/fi';
import useStore from '../store';
import useToast from '../hooks/useToast';
import useSubscription from '../hooks/useSubscription';
import FoundationForm from '../components/foundation/FoundationForm';
import Skeleton from '../components/common/Skeleton';
import { FOUNDATION_ELEMENTS } from '../utils/manifestProtocol';
import { formatHuman } from '../utils/dateUtils';

const Foundation = () => {
  const { t, i18n } = useTranslation();
  const { user, saveFoundation, fetchFoundationHistory } = useStore();
  const { isPaid, openCheckout } = useSubscription();
  const { showSuccess, showError } = useToast();

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const current = user?.foundation;
  const hasFoundation = current && (current.identityStatement || current.vision);

  useEffect(() => {
    setValues(current || {});
  }, [user?.foundation]);

  useEffect(() => {
    if (isPaid) {
      setHistoryLoading(true);
      fetchFoundationHistory().then(({ history }) => {
        setHistory(history || []);
        setHistoryLoading(false);
      });
    }
  }, [isPaid]);

  const handleSave = async (next) => {
    setSaving(true);
    const result = await saveFoundation(next);
    setSaving(false);
    if (result.success) {
      showSuccess(t('foundation.saved'), 2000);
      setEditing(false);
    } else {
      showError(result.error || t('foundation.saveFailed'));
    }
  };

  const handleCancel = () => {
    setValues(current || {});
    setEditing(false);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
          <FiZap className="w-3.5 h-3.5" />
          {t('foundation.title')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {t('foundation.heading')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
          {t('foundation.subheading')}
        </p>
      </div>

      {/* Empty state */}
      {!hasFoundation && !editing && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <FiZap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('foundation.emptyTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-md mx-auto">
            {t('foundation.emptyDesc')}
          </p>
          <Link to="/foundation/onboard" className="btn btn-primary inline-flex items-center gap-2">
            {t('foundation.start')}
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Editing */}
      {editing && (
        <FoundationForm
          value={values}
          onChange={setValues}
          onSubmit={handleSave}
          onCancel={handleCancel}
          saving={saving}
          submitLabel={t('foundation.save')}
        />
      )}

      {/* Read-only view */}
      {hasFoundation && !editing && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setEditing(true)}
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <FiEdit3 className="w-4 h-4" />
              {t('foundation.edit')}
            </button>
          </div>

          <div className="space-y-4">
            {FOUNDATION_ELEMENTS.map(({ key }, idx) => {
              const v = current?.[key];
              if (!v) return null;
              const isIdentity = key === 'identityStatement';
              const number = String(idx + 1).padStart(2, '0');
              return (
                <div
                  key={key}
                  className={
                    isIdentity
                      ? 'card p-6 sm:p-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-indigo-100 dark:border-indigo-900/50'
                      : 'card p-5'
                  }
                >
                  {isIdentity ? (
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-3">
                      {t(`foundation.${key}.label`)}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                        {number}
                      </span>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {t(`foundation.${key}.label`)}
                      </p>
                    </div>
                  )}
                  <p
                    className={
                      isIdentity
                        ? 'font-serif italic text-xl sm:text-2xl leading-relaxed text-gray-900 dark:text-white whitespace-pre-wrap'
                        : 'text-sm sm:text-base text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap'
                    }
                  >
                    {v}
                  </p>
                </div>
              );
            })}
          </div>

          {current?.updatedAt && (
            <p className="text-xs text-gray-400 mt-6 flex items-center gap-1.5">
              <FiClock className="w-3 h-3" />
              {t('foundation.updatedAt', { date: formatHuman(current.updatedAt, i18n.language) })}
            </p>
          )}

          {/* History (paid only) */}
          <div className="mt-10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiRotateCcw className="w-4 h-4" />
              {t('foundation.historyTitle')}
            </h2>

            {!isPaid && (
              <div className="card p-5 text-center bg-gradient-to-br from-indigo-50/40 to-purple-50/40 dark:from-indigo-950/40 dark:to-purple-950/40 border-indigo-200 dark:border-indigo-800/50">
                <p className="text-sm text-gray-700 dark:text-gray-200 mb-3 leading-relaxed">
                  {t('foundation.historyLocked')}
                </p>
                <button onClick={openCheckout} className="btn btn-primary inline-flex items-center gap-2">
                  <FiZap className="w-4 h-4" />
                  {t('paywall.cta')}
                </button>
              </div>
            )}

            {isPaid && historyLoading && (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}

            {isPaid && !historyLoading && history.length === 0 && (
              <p className="text-sm text-gray-400">{t('foundation.historyEmpty')}</p>
            )}

            {isPaid && !historyLoading && history.length > 0 && (
              <div className="relative space-y-4 pl-6 border-l-2 border-gray-100 dark:border-gray-800">
                {history.map(h => (
                  <div key={h.id} className="relative">
                    <span className="absolute -left-[31px] top-5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-950" />
                    <details className="card p-4 group">
                      <summary className="cursor-pointer flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span>{t('foundation.historyEntry', { date: h.replacedAt ? formatHuman(h.replacedAt, i18n.language) : '—' })}</span>
                        <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="mt-3 space-y-2">
                        {FOUNDATION_ELEMENTS.map(({ key }) => h.snapshot?.[key] && (
                          <div key={key}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                              {t(`foundation.${key}.label`)}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {h.snapshot[key]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Foundation;
