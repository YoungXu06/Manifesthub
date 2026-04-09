import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiTarget, FiPlus, FiX, FiImage, FiUpload, FiTrash2 } from 'react-icons/fi';
import useStore from '../../store';
import QuillEditorV2 from '../common/QuillEditorV2';

const EnhancedVisionBoardItemForm = ({ itemToEdit = null, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const { addVisionBoardItem, updateVisionBoardItem, uploadImage, deleteImage } = useStore();
  
  // Convert ISO date format to yyyy-MM-dd format expected by HTML date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch (e) {
      console.warn('Date format conversion failed:', e);
      return '';
    }
  };
  
  // console.log('EnhancedVisionBoardItemForm - Editing item:', itemToEdit);
  
  const [formData, setFormData] = useState({
    // Basic vision information
    title: itemToEdit?.title || '',
    content: itemToEdit?.content || '',
    description: itemToEdit?.description || '',
    category: itemToEdit?.category || 'general',
    
    // Image fields - updated for base64 storage
    imageData: itemToEdit?.imageData || '',
    imageId: itemToEdit?.imageId || '',
    
    // Emotional connection
    feelings: itemToEdit?.feelings || '',
    visualization: itemToEdit?.visualization || '',
    
    // Progress tracking
    progress: itemToEdit?.progress || 0,
    completed: itemToEdit?.completed || false,
    
    // Goal-like properties
    dueDate: formatDateForInput(itemToEdit?.dueDate) || '',
    priority: itemToEdit?.priority || 1,
    steps: itemToEdit?.steps || []
  });
  
  const [newStep, setNewStep] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showGoalFields, setShowGoalFields] = useState(!!itemToEdit?.dueDate);
  
  // Image upload related states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(itemToEdit?.imageData || itemToEdit?.imageUrl || '');
  
  // Reset form data when itemToEdit changes
  useEffect(() => {
    setFormData({
      // Basic vision information
      title: itemToEdit?.title || '',
      content: itemToEdit?.content || '',
      description: itemToEdit?.description || '',
      category: itemToEdit?.category || 'general',
      
      // Image fields - updated for base64 storage
      imageData: itemToEdit?.imageData || '',
      imageId: itemToEdit?.imageId || '',
      
      // Emotional connection
      feelings: itemToEdit?.feelings || '',
      visualization: itemToEdit?.visualization || '',
      
      // Progress tracking
      progress: itemToEdit?.progress || 0,
      completed: itemToEdit?.completed || false,
      
      // Goal-like properties
      dueDate: formatDateForInput(itemToEdit?.dueDate) || '',
      priority: itemToEdit?.priority || 1,
      steps: itemToEdit?.steps || []
    });
    setShowGoalFields(!!itemToEdit?.dueDate);
    // Support both new base64 format and legacy URL format
    setImagePreview(itemToEdit?.imageData || itemToEdit?.imageUrl || '');
  }, [itemToEdit]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-mark completed when progress reaches 100%
    if (name === 'progress' && parseInt(value) === 100) {
      setFormData({ 
        ...formData, 
        [name]: parseInt(value),
        completed: true 
      });
    } else if (name === 'priority') {
      // Ensure priority is a number
      setFormData({ ...formData, [name]: parseInt(value) });
    } else if (name === 'progress') {
      // Ensure progress is a number
      setFormData({ ...formData, [name]: parseInt(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleRichTextChange = (value) => {
    // Update content only, leave other fields unchanged
    setFormData(prevData => ({
      ...prevData,
      content: value
    }));
  };
  
  const handleAddStep = () => {
    if (newStep.trim()) {
      setFormData({
        ...formData,
        steps: [...formData.steps, { text: newStep.trim(), completed: false }]
      });
      setNewStep('');
    }
  };

  const handleRemoveStep = (index) => {
    const newSteps = [...formData.steps];
    newSteps.splice(index, 1);
    setFormData({ ...formData, steps: newSteps });
  };

  const toggleStepComplete = (index) => {
    const newSteps = [...formData.steps];
    newSteps[index].completed = !newSteps[index].completed;
    
    // Check if all steps are completed
    const allStepsCompleted = newSteps.every(step => step.completed);
    if (allStepsCompleted) {
      setFormData({ 
        ...formData, 
        steps: newSteps,
        progress: 100,
        completed: true 
      });
    } else {
      setFormData({ ...formData, steps: newSteps });
    }
  };
  
  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsUploadingImage(true);
    setError('');
    
    try {
      const result = await uploadImage(file, 'vision-images');
      
      if (result.success) {
        setFormData({
          ...formData,
          imageData: result.base64Data,
          imageId: result.imageId
        });
        setImagePreview(result.base64Data);
      } else {
        setError(`Image upload failed: ${result.error}`);
      }
    } catch (err) {
      setError(`Image upload error: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  // Handle image removal
  const handleImageRemove = async () => {
    try {
      setFormData({
        ...formData,
        imageData: '',
        imageId: ''
      });
      setImagePreview('');
    } catch (err) {
      console.warn('Failed to remove image:', err);
      // Still remove from form data even if there's an error
      setFormData({
        ...formData,
        imageData: '',
        imageId: ''
      });
      setImagePreview('');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    if (!formData.title.trim()) {
      setError('Title is required');
      setIsSubmitting(false);
      return;
    }
    
    if (!formData.content.trim() || formData.content === '<p><br></p>') {
      setError('Content is required');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Prepare data to save
      const dataToSave = { ...formData };
      
      // Ensure new item has a UUID
      if (!itemToEdit) {
        dataToSave.uuid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
        dataToSave.createdAt = new Date().toISOString();
      }
      
      // console.log('Data to submit:', dataToSave);
      
      // Ensure steps data has correct format
      if (dataToSave.steps && Array.isArray(dataToSave.steps)) {
        dataToSave.steps = dataToSave.steps.map(step => ({
          text: String(step.text || ''),
          completed: Boolean(step.completed)
        }));
      }
      
      // Validate and convert date format - convert yyyy-MM-dd to ISO format
      if (dataToSave.dueDate) {
        try {
          // Validate date format is yyyy-MM-dd
          if (/^\d{4}-\d{2}-\d{2}$/.test(dataToSave.dueDate)) {
            // Create date object and convert to ISO string
            const dateObj = new Date(dataToSave.dueDate);
            if (!isNaN(dateObj.getTime())) {
              dataToSave.dueDate = dateObj.toISOString();
            } else {
              dataToSave.dueDate = null;
            }
          } else if (!dataToSave.dueDate.includes('T')) {
            // Not ISO format, also not yyyy-MM-dd format
            dataToSave.dueDate = null;
          }
          // If already ISO format, keep as is
        } catch (e) {
          console.warn('Invalid date format:', e);
          dataToSave.dueDate = null;
        }
      }
      
      // If external onSubmit function is provided, use it
      if (onSubmit) {
        await onSubmit(dataToSave);
      } else {
        // Otherwise use default logic
        if (itemToEdit && itemToEdit.id) {
          // console.log('Updating item with Firebase document ID:', itemToEdit.id);
          
          // Use the correct Firebase document ID for update
          const result = await updateVisionBoardItem(itemToEdit.id, dataToSave);
          if (!result.success) {
            throw new Error(result.error || t('visionboard.failedUpdate'));
          }
        } else {
          // console.log('Adding new item');
          await addVisionBoardItem(dataToSave);
        }
      }
      onClose();
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
      console.error('Error saving form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Predefined categories
  const categories = [
    'general',
    'career',
    'health',
    'relationships',
    'finances',
    'personal',
    'travel',
    'home',
    'education',
    'spirituality'
  ];
  
  // Get color style for category
  const getCategoryColorClass = (category) => {
    const categoryColors = {
      'career': 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
      'health': 'border-green-500 bg-green-50 dark:bg-green-900/10',
      'relationships': 'border-purple-500 bg-purple-50 dark:bg-purple-900/10',
      'finances': 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
      'personal': 'border-orange-500 bg-orange-50 dark:bg-orange-900/10',
      'travel': 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/10',
      'home': 'border-lime-500 bg-lime-50 dark:bg-lime-900/10',
      'education': 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10',
      'spirituality': 'border-violet-500 bg-violet-50 dark:bg-violet-900/10',
      'general': 'border-gray-500 bg-gray-50 dark:bg-gray-900/10',
    };
    
    return categoryColors[category] || 'border-gray-300 bg-white dark:bg-dark-light';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[70vh]">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
      
      {/* Basic Vision Information */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">{t('visionboard.form.title')}</h3>
        
        {/* {t('visionboard.form.title')} */}
        <div className="mb-3">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('visionboard.form.title')} *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input w-full"
            required
            placeholder={t('visionboard.form.titlePlaceholder')}
          />
        </div>
        
        {/* Category */}
        <div className="mb-3">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('visionboard.form.category')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`p-2 border rounded capitalize text-sm transition-all duration-200 ${
                  formData.category === category 
                    ? `${getCategoryColorClass(category)} border-2`
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                }`}
                onClick={() => setFormData({ ...formData, category })}
              >
                {t(`visionboard.categories.${category}`, { defaultValue: category })}
              </button>
            ))}
          </div>
        </div>
        
        {/* Description - Rich Text Editor */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vision Description *
          </label>
          {/* Use optimised QuillEditor component */}
          <QuillEditorV2
            value={formData.content}
            onChange={handleRichTextChange}
            placeholder={t('visionboard.form.visualizationPlaceholder')}
            className="h-48 mb-10"
          />
        </div>
        
        {/* Image Upload */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('visionboard.form.imageUpload')}
          </label>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative">
              <img
                src={imagePreview}
                alt="Vision preview"
                className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={handleImageRemove}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                disabled={isUploadingImage}
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Upload Button */}
          <div className="flex items-center justify-center w-full">
            <label 
              htmlFor="imageUpload" 
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 ${
                isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                ) : (
                  <>
                    <FiUpload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, GIF, WebP (Max 10MB)
                    </p>
                  </>
                )}
              </div>
              <input 
                id="imageUpload" 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
              />
            </label>
          </div>
        </div>
      </div>
      
      {/* Emotional Connection */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">{t('visionboard.form.feelings')}</h3>
        
        <div className="mb-3">
          <label htmlFor="feelings" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Feelings
          </label>
          <textarea
            id="feelings"
            name="feelings"
            value={formData.feelings}
            onChange={handleChange}
            rows="2"
            className="input w-full"
            placeholder={t('visionboard.form.feelingsPlaceholder')}
          />
        </div>
        
        <div>
          <label htmlFor="visualization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Visualization Prompt
          </label>
          <textarea
            id="visualization"
            name="visualization"
            value={formData.visualization}
            onChange={handleChange}
            rows="2"
            className="input w-full"
            placeholder={t('visionboard.form.visualizationPlaceholder')}
          />
        </div>
      </div>
      
      {/* Goal Details Toggle */}
      <div>
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="showGoalFields"
            checked={showGoalFields}
            onChange={() => setShowGoalFields(!showGoalFields)}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-2"
          />
          <label htmlFor="showGoalFields" className="text-md font-medium text-gray-700 dark:text-gray-300">
            Add Goal Details
          </label>
        </div>
        
        {showGoalFields && (
          <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <div className="flex items-center">
                <FiCalendar className="mr-2 text-gray-500" />
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="input w-full"
                />
              </div>
            </div>
            
            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <div className="flex items-center">
                <FiTarget className="mr-2 text-gray-500" />
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value={1}>{t('visionboard.form.low')}</option>
                  <option value={2}>{t('visionboard.form.medium')}</option>
                  <option value={3}>{t('visionboard.form.high')}</option>
                </select>
              </div>
            </div>
            
            {/* Progress */}
            <div>
              <label htmlFor="progress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                t('visionboard.form.progress') + ': {formData.progress}%
              </label>
              <input
                type="range"
                id="progress"
                name="progress"
                min="0"
                max="100"
                step="5"
                value={formData.progress}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
            
            {/* Steps */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action Steps
              </label>
              <div className="space-y-2 mb-2">
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={step.completed}
                      onChange={() => toggleStepComplete(index)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={step.text}
                      onChange={(e) => {
                        const newSteps = [...formData.steps];
                        newSteps[index].text = e.target.value;
                        setFormData({ ...formData, steps: newSteps });
                      }}
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="p-1 text-gray-500 hover:text-red-500"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="text"
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  placeholder={t('visionboard.form.addStep')}
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="ml-2 p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-md"
                  disabled={!newStep.trim()}
                >
                  <FiPlus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Submit buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          {t('visionboard.form.cancel')}
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('common.loading')}
            </span>
          ) : itemToEdit ? t('visionboard.form.update') : t('visionboard.form.submit')}
        </button>
      </div>
    </form>
  );
};

export default EnhancedVisionBoardItemForm; 