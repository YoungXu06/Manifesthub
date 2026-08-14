import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiZap, FiArrowLeft, FiArrowRight, FiCheck, FiSun, FiSunset,
  FiClock, FiBookOpen, FiLoader, FiLock
} from 'react-icons/fi';
import useStore from '../store';
import useToast from '../hooks/useToast';
import useSubscription from '../hooks/useSubscription';
import Paywall from '../components/common/Paywall';
import {
  RESET_MORNING_KEYS, RESET_EVENING_KEYS, MINI_RESET_KEYS,
} from '../utils/manifestProtocol';

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

  const { saveResetSession, fetchResetSession, saveFoundation } = useStore();
  const { isPaid } = useSubscription();
  const { showError, showWarning } = useToast();

  const requestedKind = params.get('kind') || (isPaid ? 'full' : 'mini');
  const [kind, setKind] = useState(requestedKind);
  const [sessionId, setSessionId] = useState(params.get('id') || null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState('morning'); // 'morning' | 'evening' | 'done'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const textareaRef = useRef(null);
  // Completion-screen stats, computed in finish(): how many Foundation fields
  // were written and how many prompts were left unanswered.
  const doneStats = useRef({ synced: 0, unanswered: 0 });

  // Free-tier gate: full reset requires paid
  const lockedFull = kind === 'full' && !isPaid;

  const morningKeys = kind === 'mini' ? MINI_RESET_KEYS : RESET_MORNING_KEYS;
  const eveningKeys = kind === 'mini' ? [] : RESET_EVENING_KEYS;
  const stageKeys   = stage === 'morning' ? morningKeys : eveningKeys;

  const totalSteps = stageKeys.length;
  const currentKey = stageKeys[step];

  // Global progress across the whole wizard (mini = morning stage only).
  const overallIndex = (stage === 'morning' ? 0 : morningKeys.length) + step + 1;
  const overallTotal = morningKeys.length + eveningKeys.length;

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

  /* ── focus the active question, cursor at the end ───────── */
  useEffect(() => {
    if (loading) return;
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [step, stage, loading]);

  /* ── any answer/stage/kind change means unsaved work ────── */
  useEffect(() => {
    if (loading) return;
    setDirty(true);
  }, [answers, stage, kind]);

  /* ── auto-save on answer change (debounced) ─────────────── */
  useEffect(() => {
    if (loading || lockedFull) return;
    // Never auto-save once the session is finished: finish() persists
    // completedAt explicitly, and a post-done autosave (with no
    // completedAt) would clobber it back to null (see store saveResetSession).
    if (stage === 'done') return;
    const handle = setTimeout(persist, 800);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, stage, kind]);

  async function persist(extra = {}) {
    // Defensive: finished sessions must only be written with completedAt.
    if (stage === 'done' && !extra.completedAt) return { success: false };
    const data = {
      id: sessionId,
      kind,
      stage,
      answers,
      ...extra,
    };
    setSaving(true);
    try {
      const result = await saveResetSession(data);
      if (!result.success) {
        showError(t('reset.saveFailed', { defaultValue: 'Could not save your session. Please try again.' }));
        return result;
      }
      if (!sessionId) setSessionId(result.id);
      setDirty(false);
      return result;
    } catch (error) {
      showError(t('reset.saveFailed', { defaultValue: 'Could not save your session. Please try again.' }));
      return { success: false, error };
    } finally {
      setSaving(false);
    }
  }

  /* ── advancement helpers ────────────────────────────────── */
  const update = (k, v) => setAnswers((prev) => ({ ...prev, [k]: v }));

  const next = () => {
    if (step + 1 < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // End of stage — the header's stage label marks the morning → evening shift.
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
    try {
      const result = await persist({ completedAt });
      if (!result.success) return; // error toast already shown — keep the wizard open

      // For full reset, propagate the synthesis answers into Foundation.
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
        doneStats.current.synced = Object.keys(cleaned).length;
        if (doneStats.current.synced > 0) {
          try {
            await saveFoundation(cleaned);
          } catch (error) {
            // Answers are safe — only the Foundation sync failed. Degrade gracefully.
            showWarning(t('reset.foundationSyncFailed', { defaultValue: 'Answers saved, but your Foundation could not be updated.' }));
          }
        }
      }

      // Prompts may be skipped freely — surface how many were left blank.
      const allKeys = kind === 'mini' ? MINI_RESET_KEYS : [...RESET_MORNING_KEYS, ...RESET_EVENING_KEYS];
      doneStats.current.unanswered = allKeys.filter(
        (k) => !(answers[k] && String(answers[k]).trim().length > 0)
      ).length;

      setStage('done');
    } catch (error) {
      showError(t('reset.saveFailed', { defaultValue: 'Could not save your session. Please try again.' }));
    } finally {
      setCompleting(false);
    }
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
        syncedCount={doneStats.current.synced}
        unansweredCount={doneStats.current.unanswered}
      />
    );
  }

  const Icon = STAGE_META[stage].icon;
  const accent = STAGE_META[stage].accent;
  const v = answers[currentKey] || '';
  const canAdvance = true; // empty answers are allowed — skipped prompts are surfaced on the completion screen

  return (
    <div className="max-w-3xl mx-auto py-2 animate-fade-in">
      {/* progress strip — global across both stages */}
      <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-7">
        <div
          className={`h-full bg-gradient-to-r ${accent} transition-all duration-500`}
          style={{ width: `${(overallIndex / overallTotal) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center shadow`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {t(STAGE_META[stage].label)}
            </span>
            <span className="text-[10px] font-medium text-gray-400">
              {t('reset.progressLabel', { defaultValue: 'Question' })} {overallIndex}/{overallTotal}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reset')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            <FiClock className="w-3 h-3" />
            {t('reset.exit', { defaultValue: 'Continue later' })}
          </button>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {saving ? (
              <><FiLoader className="animate-spin w-3 h-3" /> {t('reset.saving')}</>
            ) : dirty ? (
              <><FiClock className="w-3 h-3 text-amber-500" /> {t('reset.waitingSave', { defaultValue: 'Waiting to save…' })}</>
            ) : (
              <><FiCheck className="w-3 h-3 text-emerald-500" /> {t('reset.autosaved')}</>
            )}
          </span>
        </div>
      </div>

      {!sessionId && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
          <FiLock className="w-3 h-3 shrink-0" />
          {t('reset.autosaveHint', { defaultValue: 'Auto-save is on — you can leave and continue anytime.' })}
        </p>
      )}

      <div className="card p-7 sm:p-9">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 leading-snug">
          {t(`reset.q.${currentKey}.prompt`)}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
          {t(`reset.q.${currentKey}.help`)}
        </p>

        <textarea
          ref={textareaRef}
          value={v}
          onChange={(e) => update(currentKey, e.target.value)}
          placeholder={t('reset.placeholder')}
          rows={6}
          className="input w-full text-base leading-relaxed resize-none"
        />
        <p className="text-xs text-gray-400 mt-3 border-l-2 border-indigo-400 pl-3 italic leading-relaxed">
          <FiBookOpen className="w-3 h-3 inline mr-1 -mt-0.5 align-middle" />
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
          className="btn btn-primary inline-flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
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
const DoneScreen = ({ kind, onClose, onViewFoundation, syncedCount, unansweredCount }) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto py-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30 animate-celebrate">
        <FiCheck className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-fade-in" style={{ animationDelay: '120ms' }}>
        {t('reset.done.title')}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7 max-w-md mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '180ms' }}>
        {t(kind === 'full' ? 'reset.done.fullDesc' : 'reset.done.miniDesc')}
      </p>

      {kind === 'full' && syncedCount > 0 && (
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-4 animate-fade-in" style={{ animationDelay: '240ms' }}>
          <FiCheck className="inline w-3.5 h-3.5 mr-1 -mt-0.5 align-middle" />
          {t('reset.done.synced', { defaultValue: '{{count}} fields written to your Foundation', count: syncedCount })}
        </p>
      )}
      {unansweredCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          {t('reset.done.unanswered', { defaultValue: 'Unanswered' })} · {unansweredCount}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {kind === 'full' && (
          <button onClick={onViewFoundation} className="btn btn-primary inline-flex items-center gap-2 animate-fade-in" style={{ animationDelay: '360ms' }}>
            {t('reset.done.viewFoundation')}
          </button>
        )}
        <button onClick={onClose} className="btn btn-secondary inline-flex items-center gap-2 animate-fade-in" style={{ animationDelay: '420ms' }}>
          {t('reset.done.dashboard')}
        </button>
      </div>
    </div>
  );
};

export default Reset;