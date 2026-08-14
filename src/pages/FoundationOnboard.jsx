import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiClock, FiArrowLeft, FiArrowRight, FiCheck,
  FiTarget, FiUser, FiCalendar, FiZap, FiShield
} from 'react-icons/fi';
import useStore from '../store';
import { FOUNDATION_ELEMENTS } from '../utils/manifestProtocol';

/**
 * 5-minute onboarding wizard for first-time users.
 * Walks through the 6 foundation elements one at a time with strong copy.
 * On submit → saveFoundation → redirect to dashboard.
 */
const STEP_META = {
  antiVision:        { icon: FiShield,   accent: 'from-red-500 to-rose-500' },
  vision:            { icon: FiTarget,   accent: 'from-indigo-500 to-purple-500' },
  identityStatement: { icon: FiUser,     accent: 'from-pink-500 to-fuchsia-500' },
  oneYearLens:       { icon: FiCalendar, accent: 'from-blue-500 to-cyan-500' },
  oneMonthProject:   { icon: FiZap,      accent: 'from-emerald-500 to-teal-500' },
  constraints:       { icon: FiCheck,    accent: 'from-amber-500 to-orange-500' },
};

const FoundationOnboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, saveFoundation } = useStore();

  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  const current = FOUNDATION_ELEMENTS[step];
  const Icon = STEP_META[current.key].icon;
  const accent = STEP_META[current.key].accent;
  const total = FOUNDATION_ELEMENTS.length;
  const isLast = step === total - 1;
  const isFirst = step === 0;

  // Pre-populate from existing foundation if user revisits
  useEffect(() => {
    if (user?.foundation) setValues({ ...user.foundation });
  }, [user]);

  const next = async () => {
    if (!isLast) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    const result = await saveFoundation(values);
    setSaving(false);
    if (result.success) navigate('/dashboard', { replace: true });
  };

  const prev = () => !isFirst && setStep(step - 1);
  const skip = () => navigate('/dashboard', { replace: true });

  const v = values[current.key] || '';
  const canAdvance = v.trim().length > 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col">
      {/* progress strip */}
      <div className="w-full h-1 bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full bg-gradient-to-r ${accent} transition-all duration-500`}
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-2xl animate-fade-in">
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
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg mb-5`}>
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
              <span className="text-xs text-gray-400">{v.length}/{current.maxLen}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prev}
              disabled={isFirst}
              className="btn btn-secondary inline-flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FiArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </button>
            <button
              onClick={next}
              disabled={!canAdvance || saving}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              {isLast ? (saving ? t('foundation.saving') : t('foundation.onboard.lockIn')) : t('common.next')}
              {!isLast && <FiArrowRight className="w-4 h-4" />}
              {isLast && !saving && <FiCheck className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoundationOnboard;
