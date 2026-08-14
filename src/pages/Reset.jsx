import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiZap, FiArrowLeft, FiArrowRight, FiCheck, FiSun, FiSunset,
  FiClock, FiBookOpen, FiLoader, FiLock
} from 'react-icons/fi';
import useStore from '../store';
import useToast from '../hooks/useToast';
import useSubscription from '../hooks/useSubscription';
import { ToastContainer } from '../components/Toast';
import Paywall from '../components/common/Paywall';
import {
  RESET_MORNING_KEYS, RESET_EVENING_KEYS, MINI_RESET_KEYS, FOUNDATION_ELEMENTS,
} from '../utils/manifestProtocol';
import { formatHuman } from '../utils/dateUtils';

/**
 * Reset Protocol — multi-stage wizard.
 *
 * Free tier: only `mini` kind allowed (7 distilled prompts, quarterly).
 * Paid tier: `full` kind unlocked → 14 morning + 8 evening prompts, plus
 *            an automatic mapping from synthesis answers into the user's
 *            Foundation document.
 *
 * Query string:
 *   ?kind=mini|full   → choose flavor (defaults to mini for free, full for paid)
 *   ?id=<sessionId>   → resume an existing session
 */

const STAGE_META = {
  morning:   { icon: FiSun,    accent: 'from-amber-500 to-orange-500', label: 'reset.stage.morning' },
  evening:   { icon: FiSunset, accent: 'from-indigo-500 to-purple-600', label: 'reset.stage.evening' },
};

const Reset = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const { saveResetSession, fetchResetSession, saveFoundation, countMiniResetsThisQuarter } = useStore();
  const { isPaid, openCheckout } = useSubscription();
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const requestedKind = params.get('kind') || (isPaid ? 'full' : 'mini');
  const [kind, setKind] = useState(requestedKind);
  const [sessionId, setSessionId] = useState(params.get('id') || null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState('morning'); // 'morning' | 'evening' | 'done'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Free-tier gate: full reset requires paid
  const lockedFull = kind === 'full' && !isPaid;

  const morningKeys = kind === 'mini' ? MINI_RESET_KEYS : RESET_MORNING_KEYS;
  const eveningKeys = kind === 'mini' ? [] : RESET_EVENING_KEYS;
  const stageKeys   = stage === 'morning' ? morningKeys : eveningKeys;

  const totalSteps = stageKeys.length;
  const currentKey = stageKeys[step];

  /* ── load session if resuming ───────────────────────────── */
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (sessionId) {
        const { session } = await fetchResetSession(sessionId);
        if (cancel) return;
        if (session) {
          setKind(session.kind || 'mini');
          setAnswers(session.answers || {});
          setStage(session.stage || 'morning');
        }
      }
      setLoading(false);
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── auto-save on answer change (debounced) ─────────────── */
  useEffect(() => {
    if (loading || lockedFull) return;
    const handle = setTimeout(persist, 800);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, stage, kind]);

  async function persist(extra = {}) {
    const data = {
      id: sessionId,
      kind,
      stage,
      answers,
      ...extra,
    };
    setSaving(true);
    const result = await saveResetSession(data);
    setSaving(false);
    if (result.success && !sessionId) setSessionId(result.id);
  }

  /* ── advancement helpers ────────────────────────────────── */
  const update = (k, v) => setAnswers((prev) => ({ ...prev, [k]: v }));

  const next = () => {
    if (step + 1 < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // End of stage
    if (stage === 'morning' && eveningKeys.length > 0) {
      setStage('evening');
      setStep(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    finish();
  };

  const prev = () => {
    if (step > 0) { setStep(step - 1); return; }
    if (stage === 'evening') {
      setStage('morning');
      setStep(morningKeys.length - 1);
    }
  };

  const finish = async () => {
    setCompleting(true);
    const completedAt = new Date().toISOString();
    await persist({ completedAt });

    // For full reset, propagate the synthesis answers into Foundation
    if (kind === 'full') {
      const mapping = {
        antiVision: answers.e3_antiVisionSentence,
        vision: answers.e4_visionSentence,
        oneYearLens: answers.e5_oneYearLens,
        oneMonthProject: answers.e6_oneMonthLens,
        constraints: answers.e8_constraints,
        identityStatement: answers.q13_identityToHave,
      };
      const cleaned = Object.fromEntries(
        Object.entries(mapping)
          .filter(([_, v]) => v && String(v).trim().length > 0)
          .map(([k, v]) => [k, String(v).trim()])
      );
      if (Object.keys(cleaned).length > 0) {
        await saveFoundation(cleaned);
      }
    }

    setCompleting(false);
    setStage('done');
  };

  /* ── render ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin w-6 h-6 text-indigo-500" />
      </div>
    );
  }

  if (lockedFull) {
    return (
      <div className="max-w-2xl mx-auto py-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {t('reset.fullTitle')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('reset.fullSubtitle')}
          </p>
        </div>
        <Paywall feature="reset.lockedTitle" blurb="reset.lockedBlurb" />
        <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {t('reset.fallbackHint')}
          </p>
          <button
            onClick={() => { setKind('mini'); }}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <FiZap className="w-4 h-4" />
            {t('reset.startMini')}
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'done') {
    return (
      <DoneScreen
        kind={kind}
        onClose={() => navigate('/dashboard')}
        onViewFoundation={() => navigate('/foundation')}
      />
    );
  }

  const Icon = STAGE_META[stage].icon;
  const accent = STAGE_META[stage].accent;
  const v = answers[currentKey] || '';
  const canAdvance = v.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto py-2 animate-fade-in">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* progress strip */}
      <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-7">
        <div
          className={`h-full bg-gradient-to-r ${accent} transition-all duration-500`}
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center shadow`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {t(STAGE_META[stage].label)} · {step + 1} / {totalSteps}
          </span>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          {saving ? (
            <><FiLoader className="animate-spin w-3 h-3" /> {t('reset.saving')}</>
          ) : (
            <><FiCheck className="w-3 h-3 text-emerald-500" /> {t('reset.autosaved')}</>
          )}
        </span>
      </div>

      <div className="card p-7 sm:p-9">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 leading-snug">
          {t(`reset.q.${currentKey}.prompt`)}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
          {t(`reset.q.${currentKey}.help`)}
        </p>

        <textarea
          autoFocus
          value={v}
          onChange={(e) => update(currentKey, e.target.value)}
          placeholder={t('reset.placeholder')}
          rows={6}
          className="input w-full text-base leading-relaxed resize-none"
        />
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
          <FiBookOpen className="w-3 h-3" />
          {t('reset.noAi')}
        </p>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={prev}
          disabled={step === 0 && stage === 'morning'}
          className="btn btn-secondary inline-flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FiArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
        <button
          onClick={next}
          disabled={!canAdvance || completing}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          {completing ? (
            <><FiLoader className="animate-spin w-4 h-4" /> {t('reset.completing')}</>
          ) : step + 1 === totalSteps && (stage === 'evening' || eveningKeys.length === 0) ? (
            <>{t('reset.finish')} <FiCheck className="w-4 h-4" /></>
          ) : (
            <>{t('common.next')} <FiArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Completion screen
───────────────────────────────────────────── */
const DoneScreen = ({ kind, onClose, onViewFoundation }) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto py-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30">
        <FiCheck className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {t('reset.done.title')}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7 max-w-md mx-auto leading-relaxed">
        {t(kind === 'full' ? 'reset.done.fullDesc' : 'reset.done.miniDesc')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {kind === 'full' && (
          <button onClick={onViewFoundation} className="btn btn-primary inline-flex items-center gap-2">
            {t('reset.done.viewFoundation')}
          </button>
        )}
        <button onClick={onClose} className="btn btn-secondary inline-flex items-center gap-2">
          {t('reset.done.dashboard')}
        </button>
      </div>
    </div>
  );
};

export default Reset;
