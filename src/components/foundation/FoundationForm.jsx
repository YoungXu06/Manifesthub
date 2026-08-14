import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
import { FOUNDATION_ELEMENTS } from '../../utils/manifestProtocol';

/**
 * Editable form for the 6-element identity foundation.
 * Pure presentational — wires `value`, `onChange`, `onSubmit`, `onCancel`.
 * Validates that at least one of identityStatement / vision is filled.
 */
const FoundationForm = ({ value, onChange, onSubmit, onCancel, saving = false, submitLabel }) => {
  const { t } = useTranslation();
  const [error, setError] = useState('');

  const update = (key, v) => onChange({ ...value, [key]: v });

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasIdentity = (value.identityStatement || '').trim().length > 0;
    const hasVision = (value.vision || '').trim().length > 0;
    if (!hasIdentity && !hasVision) {
      setError(t('foundation.validation.identityOrVision', {
        defaultValue: 'Add an Identity Statement or Vision to save your Foundation.',
      }));
      return;
    }
    setError('');
    onSubmit?.(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 sm:grid-cols-2"
    >
      {FOUNDATION_ELEMENTS.map(({ key, maxLen, lines }) => {
        const v = value[key] || '';
        const pct = maxLen ? v.length / maxLen : 0;
        const nearLimit = pct >= 0.9;
        const isWide = key === 'constraints';
        return (
          <div key={key} className={`card p-5 ${isWide ? 'sm:col-span-2' : ''}`}>
            <label className="block">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t(`foundation.${key}.label`)}
                </span>
                <span className={`tnum text-xs ${nearLimit ? 'text-amber-500' : 'text-gray-400'}`}>
                  {v.length}/{maxLen}
                </span>
              </div>
              <details className="mb-3">
                <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors select-none">
                  {t('foundation.helpToggle', { defaultValue: 'What to write here?' })}
                </summary>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(`foundation.${key}.help`)}
                </p>
              </details>
              <textarea
                value={v}
                onChange={(e) => update(key, e.target.value.slice(0, maxLen))}
                rows={lines}
                placeholder={t(`foundation.${key}.placeholder`)}
                className="input w-full text-sm leading-relaxed resize-none"
              />
            </label>
          </div>
        );
      })}

      {error && (
        <p className="sm:col-span-2 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <FiX className="w-4 h-4" />
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary inline-flex items-center gap-2 px-6"
        >
          {saving ? <FiLoader className="animate-spin w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
          {submitLabel || t('foundation.save')}
        </button>
      </div>
    </form>
  );
};

export default FoundationForm;
