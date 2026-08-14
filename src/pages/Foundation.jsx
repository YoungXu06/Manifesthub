import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiEdit3, FiClock, FiArrowRight, FiCheck, FiZap, FiRotateCcw } from 'react-icons/fi';
import useStore from '../store';
import useToast from '../hooks/useToast';
import useSubscription from '../hooks/useSubscription';
import { ToastContainer } from '../components/Toast';
import FoundationForm from '../components/foundation/FoundationForm';
import { FOUNDATION_ELEMENTS } from '../utils/manifestProtocol';
import { formatHuman } from '../utils/dateUtils';

const Foundation = () => {
  const { t } = useTranslation();
  const { user, saveFoundation, fetchFoundationHistory } = useStore();
  const { isPaid, openCheckout } = useSubscription();
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);

  const current = user?.foundation;
  const hasFoundation = current && (current.identityStatement || current.vision);

  useEffect(() => {
    setValues(current || {});
  }, [user?.foundation]);

  useEffect(() => {
    if (isPaid) {
      fetchFoundationHistory().then(({ history }) => setHistory(history || []));
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

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

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
            {FOUNDATION_ELEMENTS.map(({ key }) => {
              const v = current?.[key];
              if (!v) return null;
              return (
                <div key={key} className="card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    {t(`foundation.${key}.label`)}
                  </p>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                    {v}
                  </p>
                </div>
              );
            })}
          </div>

          {current?.updatedAt && (
            <p className="text-xs text-gray-400 mt-6 flex items-center gap-1.5">
              <FiClock className="w-3 h-3" />
              {t('foundation.updatedAt', { date: formatHuman(current.updatedAt) })}
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

            {isPaid && history.length === 0 && (
              <p className="text-sm text-gray-400">{t('foundation.historyEmpty')}</p>
            )}

            {isPaid && history.length > 0 && (
              <div className="space-y-3">
                {history.map(h => (
                  <details key={h.id} className="card p-4 group">
                    <summary className="cursor-pointer flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span>{t('foundation.historyEntry', { date: h.replacedAt ? formatHuman(h.replacedAt) : '—' })}</span>
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
