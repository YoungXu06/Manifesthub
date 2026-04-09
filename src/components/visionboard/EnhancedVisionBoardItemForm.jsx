import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiCalendar, FiTarget, FiPlus, FiX, FiUpload, FiTrash2,
  FiChevronDown, FiChevronUp, FiLoader
} from 'react-icons/fi';
import useStore from '../../store';

/* ─────────────────────────────────────────────
   Category meta
───────────────────────────────────────────── */
const CATEGORY_META = {
  general:      { emoji: '⭐', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-gray-300 dark:ring-gray-600' },
  career:       { emoji: '💼', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-blue-400' },
  health:       { emoji: '💪', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 ring-emerald-400' },
  relationships:{ emoji: '💜', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 ring-purple-400' },
  finances:     { emoji: '💰', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 ring-amber-400' },
  personal:     { emoji: '🌟', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 ring-orange-400' },
  travel:       { emoji: '✈️', color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 ring-cyan-400' },
  home:         { emoji: '🏡', color: 'bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400 ring-lime-400' },
  education:    { emoji: '📚', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 ring-indigo-400' },
  spirituality: { emoji: '🧘', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 ring-violet-400' },
};

const CATEGORIES = Object.keys(CATEGORY_META);

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
const EnhancedVisionBoardItemForm = ({ itemToEdit = null, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const { addVisionBoardItem, updateVisionBoardItem, uploadImage } = useStore();

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    } catch { return ''; }
  };

  const [formData, setFormData] = useState({
    title: itemToEdit?.title || '',
    content: itemToEdit?.content || '',
    category: itemToEdit?.category || 'general',
    imageData: itemToEdit?.imageData || '',
    imageId: itemToEdit?.imageId || '',
    feelings: itemToEdit?.feelings || '',
    visualization: itemToEdit?.visualization || '',
    progress: itemToEdit?.progress || 0,
    completed: itemToEdit?.completed || false,
    dueDate: formatDateForInput(itemToEdit?.dueDate) || '',
    priority: itemToEdit?.priority || 1,
    steps: itemToEdit?.steps || [],
  });

  const [newStep, setNewStep] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(itemToEdit?.imageData || itemToEdit?.imageUrl || '');
  const [error, setError] = useState('');
  const [showGoalFields, setShowGoalFields] = useState(!!itemToEdit?.dueDate || !!(itemToEdit?.steps?.length));
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData({
      title: itemToEdit?.title || '',
      content: itemToEdit?.content || '',
      category: itemToEdit?.category || 'general',
      imageData: itemToEdit?.imageData || '',
      imageId: itemToEdit?.imageId || '',
      feelings: itemToEdit?.feelings || '',
      visualization: itemToEdit?.visualization || '',
      progress: itemToEdit?.progress || 0,
      completed: itemToEdit?.completed || false,
      dueDate: formatDateForInput(itemToEdit?.dueDate) || '',
      priority: itemToEdit?.priority || 1,
      steps: itemToEdit?.steps || [],
    });
    setShowGoalFields(!!itemToEdit?.dueDate || !!(itemToEdit?.steps?.length));
    setImagePreview(itemToEdit?.imageData || itemToEdit?.imageUrl || '');
  }, [itemToEdit]);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'progress') {
      const n = parseInt(value);
      setFormData(prev => ({ ...prev, progress: n, completed: n === 100 }));
    } else if (name === 'priority') {
      set(name, parseInt(value));
    } else {
      set(name, value);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingImage(true);
    setError('');
    try {
      const result = await uploadImage(file, 'vision-images');
      if (result.success) {
        setFormData(prev => ({ ...prev, imageData: result.base64Data, imageId: result.imageId }));
        setImagePreview(result.base64Data);
      } else {
        setError(result.error || t('visionboard.form.imageUploadError', { defaultValue: 'Image upload failed' }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, imageData: '', imageId: '' }));
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddStep = () => {
    if (newStep.trim()) {
      set('steps', [...formData.steps, { text: newStep.trim(), completed: false }]);
      setNewStep('');
    }
  };

  const handleRemoveStep = (i) => {
    set('steps', formData.steps.filter((_, idx) => idx !== i));
  };

  const toggleStepComplete = (i) => {
    const updated = formData.steps.map((s, idx) =>
      idx === i ? { ...s, completed: !s.completed } : s
    );
    const allDone = updated.every(s => s.completed);
    setFormData(prev => ({ ...prev, steps: updated, ...(allDone ? { progress: 100, completed: true } : {}) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { setError(t('visionboard.form.titleRequired', { defaultValue: 'Title is required' })); return; }
    if (!formData.content.trim()) { setError(t('visionboard.form.contentRequired', { defaultValue: 'Description is required' })); return; }

    setIsSubmitting(true);
    setError('');

    try {
      const dataToSave = { ...formData };
      if (!itemToEdit) {
        dataToSave.uuid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
        dataToSave.createdAt = new Date().toISOString();
      }
      if (Array.isArray(dataToSave.steps)) {
        dataToSave.steps = dataToSave.steps.map(s => ({ text: String(s.text || ''), completed: Boolean(s.completed) }));
      }
      if (dataToSave.dueDate) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataToSave.dueDate)) {
          const d = new Date(dataToSave.dueDate);
          dataToSave.dueDate = isNaN(d.getTime()) ? null : d.toISOString();
        } else if (!dataToSave.dueDate.includes('T')) {
          dataToSave.dueDate = null;
        }
      }

      if (onSubmit) {
        await onSubmit(dataToSave);
      } else if (itemToEdit?.id) {
        const result = await updateVisionBoardItem(itemToEdit.id, dataToSave);
        if (!result.success) throw new Error(result.error || t('visionboard.failedUpdate'));
      } else {
        await addVisionBoardItem(dataToSave);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOpts = [
    { value: 1, label: t('visionboard.form.low'),    color: 'text-emerald-600' },
    { value: 2, label: t('visionboard.form.medium'), color: 'text-amber-500' },
    { value: 3, label: t('visionboard.form.high'),   color: 'text-red-500' },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
            <span className="shrink-0">⚠️</span>
            {error}
            <button type="button" className="ml-auto" onClick={() => setError('')}><FiX className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── Title ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            {t('visionboard.form.title')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('visionboard.form.titlePlaceholder')}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition"
          />
        </div>

        {/* ── Category pills ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            {t('visionboard.form.category')}
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat];
              const isActive = formData.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set('category', cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? `${meta.color} ring-2`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{meta.emoji}</span>
                  {t(`visionboard.categories.${cat}`, { defaultValue: cat })}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Description ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            {t('visionboard.form.visionDescription')} <span className="text-red-400">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={4}
            placeholder={t('visionboard.form.descriptionPlaceholder', { defaultValue: 'Describe your vision in vivid detail…' })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition"
          />
        </div>

        {/* ── Image upload ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            {t('visionboard.form.imageUpload')}
          </label>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden group">
              <img src={imagePreview} alt="preview" className="w-full h-36 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  {t('visionboard.form.removeImage', { defaultValue: 'Remove' })}
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="imageUpload"
              className={`flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                isUploadingImage
                  ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
              }`}
            >
              {isUploadingImage ? (
                <FiLoader className="w-5 h-5 text-indigo-500 animate-spin" />
              ) : (
                <>
                  <FiUpload className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {t('visionboard.form.uploadHint', { defaultValue: 'Click to upload · PNG, JPG, WebP (max 10MB)' })}
                  </span>
                </>
              )}
              <input
                ref={fileInputRef}
                id="imageUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
              />
            </label>
          )}
        </div>

        {/* ── Two-column: feelings + visualization ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t('visionboard.form.feelings')}
            </label>
            <textarea
              name="feelings"
              value={formData.feelings}
              onChange={handleChange}
              rows={3}
              placeholder={t('visionboard.form.feelingsPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t('visionboard.form.visualizationPrompt', { defaultValue: 'Visualization Prompt' })}
            </label>
            <textarea
              name="visualization"
              value={formData.visualization}
              onChange={handleChange}
              rows={3}
              placeholder={t('visionboard.form.visualizationPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition"
            />
          </div>
        </div>

        {/* ── Goal details accordion ── */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGoalFields(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <span className="flex items-center gap-2">
              <FiTarget className="w-4 h-4 text-indigo-500" />
              {t('visionboard.form.addGoalDetails', { defaultValue: 'Goal Details' })}
            </span>
            {showGoalFields ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showGoalFields && (
            <div className="px-4 py-4 space-y-4 border-t border-gray-200 dark:border-gray-700">

              {/* Due date + Priority side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    {t('visionboard.form.dueDate', { defaultValue: 'Due Date' })}
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    {t('visionboard.form.priority', { defaultValue: 'Priority' })}
                  </label>
                  <div className="flex gap-1.5">
                    {priorityOpts.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('priority', opt.value)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                          formData.priority === opt.value
                            ? opt.value === 3
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-500'
                              : opt.value === 2
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-500'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-600'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('visionboard.form.progress')}
                  </label>
                  <span className={`text-sm font-bold ${formData.completed ? 'text-emerald-500' : 'text-indigo-500'}`}>
                    {formData.progress}%
                  </span>
                </div>
                <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${formData.completed ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-indigo-400 to-purple-500'}`}
                    style={{ width: `${formData.progress}%` }}
                  />
                </div>
                <input
                  type="range"
                  name="progress"
                  min="0" max="100" step="5"
                  value={formData.progress}
                  onChange={handleChange}
                  className="w-full h-2 -mt-2 opacity-0 cursor-pointer relative z-10"
                  style={{ marginTop: '-8px' }}
                />
              </div>

              {/* Action steps */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {t('visionboard.form.actionSteps', { defaultValue: 'Action Steps' })}
                </label>
                <div className="space-y-2 mb-2">
                  {formData.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={step.completed}
                        onChange={() => toggleStepComplete(i)}
                        className="h-4 w-4 rounded text-indigo-500 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={step.text}
                        onChange={e => {
                          const updated = [...formData.steps];
                          updated[i] = { ...updated[i], text: e.target.value };
                          set('steps', updated);
                        }}
                        className={`flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 transition ${step.completed ? 'line-through text-gray-400' : ''}`}
                      />
                      <button type="button" onClick={() => handleRemoveStep(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStep}
                    onChange={e => setNewStep(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddStep())}
                    placeholder={t('visionboard.form.addStep')}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition"
                  />
                  <button
                    type="button"
                    onClick={handleAddStep}
                    disabled={!newStep.trim()}
                    className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-lg transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer buttons ── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50 mt-5 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {t('visionboard.form.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-60 flex items-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
          {isSubmitting ? t('common.loading') : itemToEdit ? t('visionboard.form.update') : t('visionboard.form.submit')}
        </button>
      </div>
    </form>
  );
};

export default EnhancedVisionBoardItemForm;
