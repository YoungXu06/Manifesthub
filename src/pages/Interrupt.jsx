import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiCheck, FiArrowRight, FiZap } from 'react-icons/fi';
import useStore from '../store';
import useToast from '../hooks/useToast';
import { INTERRUPT_PROMPTS } from '../utils/manifestProtocol';
import { toDateStr } from '../utils/dateUtils';
import { loadInterruptDraft, saveInterruptDraft, clearInterruptDraft } from '../utils/interrupts';

const RING_RADIUS = 24;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 150.8

/**
 * 60-second answer page for a single interrupt.
 * URL: /interrupt?slot=i1_avoiding
 */
const Interrupt = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { saveInterruptResponse, fetchInterruptResponses } = useStore();
  const { showSuccess, showError, showInfo } = useToast();

  const slot = new URLSearchParams(location.search).get('slot');
  const prompt = INTERRUPT_PROMPTS.find(p => p.key === slot);

  const [answer, setAnswer] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const draftMetaRef = useRef(null); // { dateStr, slot }
  const draftTimerRef = useRef(null);

  // Restore a local draft (takes precedence) or any prior saved answer for today
  useEffect(() => {
    if (!prompt) return;
    const dateStr = toDateStr(new Date());
    draftMetaRef.current = { dateStr, slot: prompt.key };
    (async () => {
      const { responses } = await fetchInterruptResponses(dateStr);
      const draft = loadInterruptDraft(dateStr, prompt.key);
      if (draft) {
        setAnswer(draft);
        showInfo(t('interrupts.draftRestored', { defaultValue: 'Draft restored' }));
      } else if (responses[prompt.key]) {
        setAnswer(responses[prompt.key]);
        setSaved(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  // Soft 60-second timer (informational, not enforced)
  useEffect(() => {
    if (saved) return;
    const handle = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(handle);
  }, [saved]);

  // Clear any pending draft debounce on unmount
  useEffect(() => () => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setAnswer(value);
    const meta = draftMetaRef.current;
    if (!meta) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    // 500ms debounced local draft write
    draftTimerRef.current = setTimeout(() => {
      saveInterruptDraft(meta.dateStr, meta.slot, value);
    }, 500);
  };

  if (!prompt) {
    return (
      <div className="max-w-xl mx-auto py-8 text-center">
        <p className="text-sm text-gray-500">{t('interrupts.notFound')}</p>
        <Link to="/dashboard" className="btn btn-primary inline-flex items-center gap-2 mt-4">
          {t('reset.done.dashboard')}
        </Link>
      </div>
    );
  }

  const handleSave = async () => {
    if (!answer.trim()) return;
    setSaving(true);
    const dateStr = toDateStr(new Date());
    const result = await saveInterruptResponse(dateStr, prompt.key, { answer: answer.trim() });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      const meta = draftMetaRef.current;
      if (meta) clearInterruptDraft(meta.dateStr, meta.slot);
      showSuccess(t('interrupts.saved'), 1800);
    } else {
      showError(result.error || t('interrupts.saveFailed'));
    }
  };

  // Ring progress: 0 offset at 60s → full circumference consumed at 0s
  const ringOffset = (RING_CIRCUMFERENCE / 60) * (60 - secondsLeft);

  return (
    <div className="max-w-xl mx-auto py-6 animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <FiZap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {t('interrupts.tag')}{prompt.time !== 'free' ? ` · ${prompt.time}` : ''}
          </span>
        </div>
        {!saved && (
          <div aria-live="polite" className="flex items-center">
            {secondsLeft > 0 ? (
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 60 60" className="w-14 h-14">
                  <circle
                    cx="30" cy="30" r={RING_RADIUS}
                    fill="none" strokeWidth="3.5"
                    className="stroke-gray-200 dark:stroke-gray-700"
                  />
                  <motion.circle
                    cx="30" cy="30" r={RING_RADIUS}
                    fill="none" strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    initial={false}
                    animate={{ strokeDashoffset: ringOffset }}
                    transition={{ duration: 1, ease: 'linear' }}
                    className={secondsLeft <= 10 ? 'stroke-amber-500' : 'stroke-indigo-500'}
                    transform="rotate(-90 30 30)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-gray-300">
                    {secondsLeft}s
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 max-w-[190px] text-right leading-snug">
                {t('interrupts.timeUp', { defaultValue: 'Time is up — keep going if you want' })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="card p-7">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-5 leading-snug">
          {t(`interrupts.q.${prompt.key}.prompt`)}
        </h1>
        <textarea
          autoFocus
          value={answer}
          onChange={handleChange}
          placeholder={t('interrupts.placeholder')}
          rows={5}
          className="input w-full text-base leading-relaxed resize-none"
        />
        <p className="text-xs text-gray-400 mt-2">{t('interrupts.softTimer')}</p>
      </div>

      <div className="flex justify-between items-center mt-6">
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          {t('common.cancel')}
        </Link>
        <button
          onClick={handleSave}
          disabled={!answer.trim() || saving}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          {saved ? <FiCheck className="w-4 h-4" /> : null}
          {saved ? t('interrupts.update') : t('interrupts.save')}
          {!saved && <FiArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default Interrupt;
