import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiClock, FiArrowLeft, FiArrowRight, FiCheck,
  FiTarget, FiUser, FiCalendar, FiZap, FiShield, FiAlertCircle
} from 'react-icons/fi';
import useStore from '../store';
import { FOUNDATION_ELEMENTS } from '../utils/manifestProtocol';

/**
 * 5-minute onboarding wizard for first-time users.
 * Walks through the 6 foundation elements one at a time with strong copy.
 * On submit → saveFoundation → completion screen → redirect to dashboard.
 */
const STEP_META = {
  antiVision:        { icon: FiShield },
  vision:            { icon: FiTarget },
  identityStatement: { icon: FiUser },
  oneYearLens:       { icon: FiCalendar },
  oneMonthProject:   { icon: FiZap },
  constraints:       { icon: FiCheck },
};

const FoundationOnboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, saveFoundation } = useStore();

  const [stage, setStage] = useState('form'); // 'form' | 'done'
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const current = FOUNDATION_ELEMENTS[step];
  const Icon = STEP_META[current.key].icon;
  const total = FOUNDATION_ELEMENTS.length;
  const isLast = step === total - 1;
  const isFirst = step === 0;

  // Pre-populate from existing foundation if user revisits
  useEffect(() => {
    if (user?.foundation) setValues({ ...user.foundation });
  }, [user]);

  const submit = async () => {
    setSaving(true);
    setSaveError('');
    const result = await saveFoundation(values);
    setSaving(false);
    if (result.success) {
      setStage('done');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
    } else {
      setSaveError(result.error || t('foundation.saveFailed', { defaultValue: 'Failed to save your Foundation.' }));
    }
  };

  const next = async () => {
    if (!isLast) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    await submit();
  };

  const prev = () => !isFirst && setStep(step - 1);
  const skip = () => navigate('/dashboard', { replace: true });

  const v = values[current.key] || '';
  const canAdvance = v.trim().length > 4;
  const blocked = !canAdvance && !saving;
  const minHint = t('onboard.minHint', { defaultValue: 'At least 5 characters' });

  // Completion state — full-screen fade-in before redirecting to dashboard
  if (stage === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col items-center justify-center p-5 animate-fade-in">
        <div className="text-center animate-celebrate">
          <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
            <FiCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('onboard.doneTitle', { defaultValue: 'Your identity is locked in' })}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {t('onboard.doneSub', { defaultValue: 'Building your dashboard…' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col">
      {/* progress strip */}
      <div className="w-full h-1 bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-2xl animate-fade-in">
          {/* step dots — completed solid, current outlined, upcoming gray */}
          <div className="flex items-center gap-1.5 mb-6">
            {FOUNDATION_ELEMENTS.map((_, i) => (
              <span
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                  i < step ? 'bg-indigo-500'
                  : i === step ? 'bg-indigo-500/15 border border-indigo-500'
                  : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* step counter */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {t('foundation.onboard.step', { current: step + 1, total })}
            </span>
            <button
              onClick={skip}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {t('foundation.onboard.skip')}
            </button>
          </div>

          <div className="card p-7 sm:p-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg mb-5">
              <Icon className="w-6 h-6 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
              {t(`foundation.${current.key}.label`)}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
              {t(`foundation.${current.key}.help`)}
            </p>

            <textarea
              autoFocus
              value={v}
              onChange={(e) => setValues({ ...values, [current.key]: e.target.value.slice(0, current.maxLen) })}
              rows={current.lines}
              placeholder={t(`foundation.${current.key}.placeholder`)}
              className="input w-full text-base leading-relaxed resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <FiClock className="w-3 h-3" />
                {t('foundation.onboard.fiveMin')}
              </span>
              <span className="tnum text-xs text-gray-400">{v.length}/{current.maxLen}</span>
            </div>
          </div>

          {/* inline save error with retry */}
          {saveError && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-4 py-3 animate-fade-in">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                {saveError}
              </p>
              <button
                onClick={submit}
                disabled={saving}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 flex-shrink-0"
              >
                {t('common.retry', { defaultValue: 'Retry' })}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prev}
              disabled={isFirst}
              className="btn btn-secondary inline-flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FiArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </button>
            <div className="flex flex-col items-end gap-1.5">
              <button
                onClick={next}
                disabled={!canAdvance || saving}
                title={blocked ? minHint : undefined}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                {isLast ? (saving ? t('foundation.saving') : t('foundation.onboard.lockIn')) : t('common.next')}
                {!isLast && <FiArrowRight className="w-4 h-4" />}
                {isLast && !saving && <FiCheck className="w-4 h-4" />}
              </button>
              {blocked && (
                <p className="text-xs text-gray-400">{minHint}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundationOnboard;
