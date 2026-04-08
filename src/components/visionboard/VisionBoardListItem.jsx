import React from 'react';
import { FiEdit2, FiTrash2, FiCalendar, FiTarget, FiStar, FiDollarSign,
         FiHome, FiUsers, FiBook, FiAward, FiGlobe, FiActivity, FiSun,
         FiImage, FiSmile } from 'react-icons/fi';
import { motion } from 'framer-motion';
import useStore from '../../store';
import { useNavigate } from 'react-router-dom';

const VisionBoardListItem = ({ item, onEdit, showSuccess, showError, showWarning }) => {
  const { deleteVisionBoardItem, updateVisionBoardItem } = useStore();
  const navigate = useNavigate();
  
  // Helper function to ensure priority is a number for comparison
  const getPriorityValue = () => {
    const priority = item.priority;
    if (priority === null || priority === undefined) return null;
    return typeof priority === 'string' ? parseInt(priority) : priority;
  };
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this vision item?')) {
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
        console.error('Error deleting item:', error);
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
    const isGoal = item.id.toString().startsWith('goal-');
    
    try {
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
        const idToUpdate = item.id;
        const result = await updateVisionBoardItem(idToUpdate, { 
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
      console.error('Failed to update progress:', error);
      showError?.('Failed to update progress. Please try again.');
    }
  };

  // Get category icon
  const getCategoryIcon = () => {
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
  
  // Get category color
  const getCategoryColor = () => {
    const categoryColors = {
      'career': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      'health': 'text-green-500 bg-green-50 dark:bg-green-900/20',
      'relationships': 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      'finances': 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      'personal': 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
      'travel': 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
      'home': 'text-lime-500 bg-lime-50 dark:bg-lime-900/20',
      'education': 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
      'spirituality': 'text-violet-500 bg-violet-50 dark:bg-violet-900/20',
      'general': 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
    };
    
    return categoryColors[item.category] || 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
  };

  // Clean HTML content for preview
  const getContentPreview = (content) => {
    if (!content) return '';
    // Remove HTML tags and return first 100 characters
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <div
        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Desktop table layout — columns match header: [1fr_80px_90px_72px_80px] */}
        <div className="hidden md:grid grid-cols-[1fr_80px_90px_72px_80px] gap-2 items-center">

          {/* Vision column */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`flex-shrink-0 p-1.5 rounded-md ${getCategoryColor()}`}>
                {getCategoryIcon()}
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                {item.title}
              </h3>
              {item.category && (
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                  {item.category}
                </span>
              )}
            </div>
            {item.content && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate pl-8">
                {getContentPreview(item.content)}
              </p>
            )}
          </div>

          {/* Progress column — 80px */}
          <div className="flex flex-col items-center justify-center gap-1">
            {item.progress !== undefined ? (
              <>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {item.progress || 0}%
                </span>
                <div className="relative w-14">
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.completed
                          ? 'bg-emerald-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0" max="100" step="5"
                    value={item.progress || 0}
                    onChange={(e) => { e.stopPropagation(); handleProgressUpdate(parseInt(e.target.value)); }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
            )}
          </div>

          {/* Due Date column — 90px */}
          <div className="flex items-center justify-center">
            {item.dueDate ? (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <FiCalendar className="h-3 w-3 flex-shrink-0" />
                <span>
                  {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
            )}
          </div>

          {/* Priority column — 72px */}
          <div className="flex items-center justify-center">
            {item.priority ? (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                getPriorityValue() === 3
                  ? 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'
                  : getPriorityValue() === 2
                  ? 'bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
              }`}>
                {getPriorityValue() === 3 ? 'High' : getPriorityValue() === 2 ? 'Med' : 'Low'}
              </span>
            ) : (
              <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
            )}
          </div>

          {/* Actions column — 80px */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                <FiEdit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile card layout */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            {/* Left section - Title and content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                {/* Category icon */}
                <div className={`p-1.5 rounded-md ${getCategoryColor()}`}>
                  {getCategoryIcon()}
                </div>
                
                {/* Title */}
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {item.title}
                </h3>
                
                {/* Category badge */}
                {item.category && (
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                    {item.category}
                  </span>
                )}

                {/* Image indicator - mobile */}
                {(item.imageData || item.imageUrl) && (
                  <div className="p-1 rounded text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20">
                    <FiImage className="h-3 w-3" />
                  </div>
                )}

                {/* Visualization prompt indicator - mobile */}
                {item.visualization && (
                  <div className="p-1 rounded text-purple-500 bg-purple-50 dark:bg-purple-900/20">
                    <FiSmile className="h-3 w-3" />
                  </div>
                )}
              </div>
              
              {/* Image preview - mobile */}
              {(item.imageData || item.imageUrl) && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-16 h-10 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={item.imageData || item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Content preview */}
              {item.content && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {getContentPreview(item.content)}
                </p>
              )}

              {/* Visualization prompt preview - mobile */}
              {item.visualization && (
                <p className="text-xs text-purple-600 dark:text-purple-400 italic truncate mt-1">
                  💭 {item.visualization}
                </p>
              )}

              {/* Mobile compact info */}
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                {(item.progress !== undefined || item.dueDate) && (
                  <span>{item.progress || 0}%</span>
                )}
                {item.dueDate && (
                  <>
                    <span>•</span>
                    <span>
                      {new Date(item.dueDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </>
                )}
                {item.priority && (
                  <>
                    <span>•</span>
                    <span className={`
                      ${getPriorityValue() === 3 ? 'text-red-500' : ''}
                      ${getPriorityValue() === 2 ? 'text-yellow-500' : ''}
                      ${getPriorityValue() === 1 ? 'text-green-500' : ''}
                    `}>
                      {getPriorityValue() === 3 ? 'High' : getPriorityValue() === 2 ? 'Med' : 'Low'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right section - Actions */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-1.5 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiEdit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VisionBoardListItem; 