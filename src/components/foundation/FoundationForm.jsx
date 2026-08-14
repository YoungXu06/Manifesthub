import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiLoader } from 'react-icons/fi';
import { FOUNDATION_ELEMENTS } from '../../utils/manifestProtocol';

/**
 * Editable form for the 6-element identity foundation.
 * Pure presentational — wires `value`, `onChange`, `onSubmit`.
 */
const FoundationForm = ({ value, onChange, onSubmit, saving = false, submitLabel }) => {
  const { t } = useTranslation();

  const update = (key, v) => onChange({ ...value, [key]: v });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(value); }}
      className="space-y-6"
    >
      {FOUNDATION_ELEMENTS.map(({ key, maxLen, lines }) => {
        const v = value[key] || '';
        return (
          <div key={key} className="card p-5">
            <label className="block">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t(`foundation.${key}.label`)}
                </span>
                <span className="text-xs text-gray-400">{v.length}/{maxLen}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                {t(`foundation.${key}.help`)}
              </p>
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

      <div className="flex justify-end gap-3 pt-2">
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
