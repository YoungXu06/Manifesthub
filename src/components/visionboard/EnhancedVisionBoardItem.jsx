import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiX, FiMaximize2, FiMinimize2, 
         FiCheck, FiCalendar, FiTarget, FiClock, FiImage, FiStar, FiDollarSign, FiHome, FiUsers,
         FiBook, FiAward, FiGlobe, FiActivity, FiSun, FiSmile, FiSend } from 'react-icons/fi';
import { motion } from 'framer-motion';
import useStore from '../../store';
import { useNavigate } from 'react-router-dom';

const EnhancedVisionBoardItem = ({ item, onEdit, itemId, showSuccess, showError, showWarning }) => {
  const { deleteVisionBoardItem, updateVisionBoardItem } = useStore();
  const navigate = useNavigate();
  
  // Helper function to ensure priority is a number for comparison
  const getPriorityValue = () => {
    const priority = item.priority;
    if (priority === null || priority === undefined) return null;
    return typeof priority === 'string' ? parseInt(priority) : priority;
  };
  
  // Simple HTML sanitizer
  const sanitizeHTML = (html) => {
    // In production, use a dedicated library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '');
  };
  
  const createMarkup = (content) => {
    if (!content) return { __html: '' };
    return { __html: sanitizeHTML(content) };
  };
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this vision?')) {
      try {
        const isGoal = item.id.toString().startsWith('goal-');
        
        if (isGoal) {
          const goalId = item.id.replace('goal-', '');
          const result = await useStore.getState().deleteGoal(goalId);

          if (result.success) {
            showSuccess?.('Vision item deleted successfully!', 3000);
          } else {
            showError?.(result.error || 'Failed to delete vision item');
          }
        } else {
          const idToDelete = item.id;

          const result = await deleteVisionBoardItem(idToDelete);

          if (result.success) {
            showSuccess?.('Vision item deleted successfully!', 3000);
          } else {
            showError?.(result.error || 'Failed to delete vision item');
          }
        }
      } catch (error) {
        console.error('Error deleting vision item:', error);
        showError?.('Delete failed. Please try again.');
      }
    }
  };

  const handleCardClick = () => {
    const { user } = useStore.getState();
    if (!user) return;
    const routeId = item.id;
    navigate(`/visionboard/${user.uid}/${routeId}`);
  };

  const handleProgressUpdate = async (newProgress) => {
    const completed = newProgress === 100;

    try {
      const isGoal = item.id.toString().startsWith('goal-');

      if (isGoal) {
        const goalId = item.id.replace('goal-', '');
        const result = await useStore.getState().updateGoal(goalId, {
          progress: newProgress,
          completed: completed
        });

        if (result.success) {
          if (completed) {
            showSuccess?.('🎉 Congratulations! Goal completed!', 4000);
          } else {
            showSuccess?.(`Progress updated to ${newProgress}%`, 2000);
          }
        } else {
          showError?.(result.error || 'Failed to update progress');
        }
      } else {
        const result = await updateVisionBoardItem(item.id, {
          progress: newProgress,
          completed: completed
        });

        if (result.success) {
          if (completed) {
            showSuccess?.('🎉 Congratulations! Vision achieved!', 4000);
          } else {
            showSuccess?.(`Progress updated to ${newProgress}%`, 2000);
          }
        } else {
          showError?.(result.error || 'Failed to update progress');
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      showError?.('Failed to update progress. Please try again.');
    }
  };

  // Auto-select icon based on category
  const getCustomIcon = () => {
    const iconMap = {
      'general': <FiStar />,
      'finances': <FiDollarSign />,
      'home': <FiHome />,
      'relationships': <FiUsers />,
      'education': <FiBook />,
      'personal': <FiAward />,
      'travel': <FiGlobe />,
      'health': <FiActivity />,
      'spirituality': <FiSun />,
      'career': <FiTarget />
    };
    
    return iconMap[item.category] || <FiStar />;
  };
  
  // Select background color by category
  const getCardBackground = () => {
    const categoryColors = {
      'career': 'bg-blue-50 dark:bg-blue-900/10',
      'health': 'bg-green-50 dark:bg-green-900/10',
      'relationships': 'bg-purple-50 dark:bg-purple-900/10',
      'finances': 'bg-yellow-50 dark:bg-yellow-900/10',
      'personal': 'bg-orange-50 dark:bg-orange-900/10',
      'travel': 'bg-cyan-50 dark:bg-cyan-900/10',
      'home': 'bg-lime-50 dark:bg-lime-900/10',
      'education': 'bg-indigo-50 dark:bg-indigo-900/10',
      'spirituality': 'bg-violet-50 dark:bg-violet-900/10',
      'general': 'bg-gray-50 dark:bg-gray-900/10',
    };
    
    return categoryColors[item.category] || 'bg-white dark:bg-dark-light';
  };
  
  // Select icon color by category
  const getIconColor = () => {
    const categoryColors = {
      'career': 'text-blue-500 dark:text-blue-400',
      'health': 'text-green-500 dark:text-green-400',
      'relationships': 'text-purple-500 dark:text-purple-400',
      'finances': 'text-yellow-500 dark:text-yellow-400',
      'personal': 'text-orange-500 dark:text-orange-400',
      'travel': 'text-cyan-500 dark:text-cyan-400',
      'home': 'text-lime-500 dark:text-lime-400',
      'education': 'text-indigo-500 dark:text-indigo-400',
      'spirituality': 'text-violet-500 dark:text-violet-400',
      'general': 'text-gray-500 dark:text-gray-400',
    };
    
    return categoryColors[item.category] || 'text-primary dark:text-primary-light';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`relative group h-full`}
    >
      <div
        className={`${getCardBackground()} rounded-lg shadow-md overflow-hidden transition-all duration-300 h-[320px]`}
        onClick={handleCardClick}
      >
        {/* Title with custom icon */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full bg-white dark:bg-gray-800 ${getIconColor()}`}>
                {getCustomIcon()}
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                {item.title}
              </h3>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
              >
                <FiEdit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {item.category && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {item.category}
              </span>
            </div>
          )}
        </div>
        
        {/* Content - with fixed height container */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ height: 'calc(320px - 72px - 40px)' }}>
          <div className="p-3 flex flex-col h-full">
            {/* Vision Image */}
            {(item.imageData || item.imageUrl) && (
              <div className="flex-shrink-0 mb-3">
                <div className="relative h-32 overflow-hidden rounded-lg">
                  <img
                    src={item.imageData || item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Main vision description - with rich text support */}
            <div className="flex-1 overflow-y-auto mb-4 prose prose-sm max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={createMarkup(item.content)}></div>
            </div>
            
            {/* Visualization Prompt - if available */}
            {item.visualization && (
              <div className="flex-shrink-0 mb-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center mb-1">
                  <FiSmile className="h-3 w-3 text-indigo-600 dark:text-indigo-400 mr-1" />
                  <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Visualization</span>
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 italic line-clamp-2">
                  {item.visualization}
                </p>
              </div>
            )}
            
            {/* Goal info - always visible */}
            <div className="flex-shrink-0 space-y-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
              {/* Goal progress */}
              {item.dueDate && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="text-sm font-medium">{item.progress || 0}%</span>
                  </div>
                  <div className="relative">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          item.completed ? 'bg-green-500' : 'bg-primary'
                        }`}
                        style={{ width: `${item.progress || 0}%` }}
                      ></div>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={item.progress || 0}
                      onChange={(e) => handleProgressUpdate(parseInt(e.target.value))}
                      className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}
              
              {/* Due date */}
              {item.dueDate && item.priority && (
                <div className="flex justify-between text-xs">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <FiCalendar className="h-3 w-3 mr-1" />
                    <span>
                      {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FiTarget className="h-3 w-3 mr-1" />
                    <span className={`
                      ${getPriorityValue() === 3 ? 'text-red-500' : ''}
                      ${getPriorityValue() === 2 ? 'text-yellow-500' : ''}
                      ${getPriorityValue() === 1 ? 'text-green-500' : ''}
                    `}>
                      {getPriorityValue() === 3 ? 'High' : getPriorityValue() === 2 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedVisionBoardItem; 