import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '../../store';

const VisionBoardItemForm = ({ itemToEdit = null, onClose }) => {
  const { t } = useTranslation();
  const { addVisionBoardItem, updateVisionBoardItem } = useStore();
  
  const [formData, setFormData] = useState({
    type: itemToEdit?.type || 'image',
    title: itemToEdit?.title || '',
    content: itemToEdit?.content || '',
    author: itemToEdit?.author || '',
    bgColor: itemToEdit?.bgColor || '#ffffff',
    category: itemToEdit?.category || 'general',
    tags: itemToEdit?.tags || []
  });
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    if (!formData.content.trim()) {
      setError('Content is required');
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (itemToEdit) {
        await updateVisionBoardItem(itemToEdit.id, formData);
      } else {
        await addVisionBoardItem(formData);
      }
      onClose();
    } catch (err) {
      setError('Failed to save item');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-defined categories
  const categories = [
    'general',
    'career',
    'health',
    'relationships',
    'finances',
    'personal',
    'travel',
    'home',
    'education'
  ];

  // Show appropriate preset background by type
  const backgroundColors = {
    'career': ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6'],
    'health': ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784'],
    'relationships': ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8'],
    'finances': ['#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176'],
    'personal': ['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D'],
    'travel': ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1'],
    'home': ['#F1F8E9', '#DCEDC8', '#C5E1A5', '#AED581'],
    'education': ['#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB']
  };

  const getColorPalette = () => {
    const defaultColors = ['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#6c757d'];
    const categoryColors = backgroundColors[formData.category] || [];
    return [...categoryColors, ...defaultColors];
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Type
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="input w-full"
        >
          <option value="image">{t('visionBoard.cardTypes.image')}</option>
          <option value="text">{t('visionBoard.cardTypes.text')}</option>
          <option value="quote">{t('visionBoard.cardTypes.quote')}</option>
          <option value="affirmation">{t('visionBoard.cardTypes.affirmation')}</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="input w-full"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title (Optional)
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="input w-full"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {formData.type === 'image' ? 'Image URL' : 'Content'} *
        </label>
        {formData.type === 'text' || formData.type === 'quote' || formData.type === 'affirmation' ? (
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="4"
            className="input w-full"
            required
          />
        ) : (
          <input
            type="text"
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="input w-full"
            placeholder="https://example.com/image.jpg"
            required
          />
        )}
      </div>
      
      {formData.type === 'quote' && (
        <div className="mb-4">
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Author
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
      )}
      
      {(formData.type === 'text' || formData.type === 'quote') && (
        <div className="mb-4">
          <label htmlFor="bgColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Background Color
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {getColorPalette().map(color => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border ${formData.bgColor === color ? 'ring-2 ring-primary ring-offset-2' : 'border-gray-300'}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, bgColor: color })}
              />
            ))}
          </div>
          <div className="flex items-center">
            <input
              type="color"
              id="bgColor"
              name="bgColor"
              value={formData.bgColor}
              onChange={handleChange}
              className="w-10 h-10 rounded-md border border-gray-300 dark:border-gray-700"
            />
            <input
              type="text"
              value={formData.bgColor}
              onChange={handleChange}
              name="bgColor"
              className="input ml-2 flex-1"
            />
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags (for better organization)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 focus:outline-none"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className="input flex-1"
            placeholder="Add tag and press Enter"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="ml-2 px-3 py-2 bg-primary text-white rounded-md"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      
      {formData.type === 'image' && formData.content && (
        <div className="mb-4">
          <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Preview
          </p>
          <div className="h-40 w-full bg-cover bg-center bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
            <img 
              src={formData.content} 
              alt="Preview" 
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
              }}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="btn bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? (
            <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
          ) : null}
          Save
        </button>
      </div>
    </form>
  );
};

export default VisionBoardItemForm;
