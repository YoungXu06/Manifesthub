import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmDialog = ({ title, message, confirmLabel, cancelLabel, danger = false, onConfirm, onCancel }) => {
  const confirmRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    confirmRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-2xl p-6 animate-fade-in"
      >
        <div className="flex items-start gap-3 mb-5">
          <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500'}`}>
            <FiAlertTriangle className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 id="confirm-title" className="text-base font-bold text-gray-900 dark:text-white leading-snug">{title}</h3>
            {message && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">{cancelLabel}</button>
          <button ref={confirmRef} type="button" onClick={onConfirm} className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Promise-based confirm. Returns [confirm, element]:
 *   const [confirm, confirmEl] = useConfirm();
 *   const ok = await confirm({ title, message, confirmLabel, danger });
 *   ... render {confirmEl} in the component.
 */
export const useConfirm = () => {
  const { t } = useTranslation();
  const [state, setState] = useState(null);

  const confirm = useCallback((opts = {}) => new Promise((resolve) => {
    setState({
      title: opts.title || t('common.confirm', { defaultValue: 'Are you sure?' }),
      message: opts.message,
      confirmLabel: opts.confirmLabel || t('common.confirmAction', { defaultValue: 'Confirm' }),
      cancelLabel: opts.cancelLabel || t('common.cancel', { defaultValue: 'Cancel' }),
      danger: !!opts.danger,
      resolve,
    });
  }), [t]);

  const settle = useCallback((value) => {
    setState((cur) => { cur?.resolve?.(value); return null; });
  }, []);

  const element = state ? (
    <ConfirmDialog
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      danger={state.danger}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null;

  return [confirm, element];
};
