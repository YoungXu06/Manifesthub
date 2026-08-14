import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiZap, FiArrowRight, FiCheck } from 'react-icons/fi';
import useSubscription from '../../hooks/useSubscription';

/**
 * Generic paywall card. Use anywhere a feature requires the annual plan.
 *
 * Props:
 *   feature   — short i18n key fragment shown in the title
 *   blurb     — i18n key fragment for the body copy
 *   preview   — optional ReactNode rendered behind a blur (gives "look but cannot touch" UX)
 *   compact   — render a slim 1-line variant
 */
const Paywall = ({ feature = 'paywall.default', blurb = 'paywall.defaultBlurb', preview = null, compact = false }) => {
  const { t } = useTranslation();
  const { isPaid, openCheckout } = useSubscription();

  if (isPaid) return null;

  if (compact) {
    return (
      <button
        onClick={openCheckout}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800/50 hover:from-indigo-500/15 hover:to-purple-500/15 transition-all group"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
          <FiZap className="w-4 h-4" />
          {t(blurb)}
        </span>
        <FiArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
      </button>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {preview && (
        <div className="absolute inset-0 pointer-events-none select-none filter blur-md opacity-40">
          {preview}
        </div>
      )}
      <div className="relative p-6 sm:p-8 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/40 dark:from-gray-900 dark:via-indigo-950/40 dark:to-purple-950/40 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <FiZap className="w-3.5 h-3.5" />
            {t('paywall.lockedFeature')}
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t(feature)}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
          {t(blurb)}
        </p>
        <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 mb-6">
          {['paywall.b1', 'paywall.b2', 'paywall.b3', 'paywall.b4'].map(k => (
            <li key={k} className="flex items-start gap-2">
              <FiCheck className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
              <span>{t(k)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={openCheckout}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-100"
          >
            {t('paywall.cta')}
            <FiArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('paywall.priceHint')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
