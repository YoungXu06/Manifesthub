import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiClock, FiCheck, FiArrowRight, FiZap } from 'react-icons/fi';
import useStore from '../store';
import useToast from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { INTERRUPT_PROMPTS } from '../utils/manifestProtocol';
import { toDateStr } from '../utils/dateUtils';

/**
 * 60-second answer page for a single interrupt.
 * URL: /interrupt?slot=i1_avoiding
 */
const Interrupt = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { saveInterruptResponse, fetchInterruptResponses } = useStore();
  const { toasts, removeToast, showSuccess, showError } = useToast();

  const slot = new URLSearchParams(location.search).get('slot');
  const prompt = INTERRUPT_PROMPTS.find(p => p.key === slot);

  const [answer, setAnswer] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load any prior answer for today
  useEffect(() => {
    if (!prompt) return;
    (async () => {
      const dateStr = toDateStr(new Date());
      const { responses } = await fetchInterruptResponses(dateStr);
      if (responses[prompt.key]) {
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
      showSuccess(t('interrupts.saved'), 1800);
    } else {
      showError(result.error || t('interrupts.saveFailed'));
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 animate-fade-in">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

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
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <FiClock className="w-3 h-3" />
            {secondsLeft}s
          </span>
        )}
      </div>

      <div className="card p-7">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-5 leading-snug">
          {t(`interrupts.q.${prompt.key}.prompt`)}
        </h1>
        <textarea
          autoFocus
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
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
