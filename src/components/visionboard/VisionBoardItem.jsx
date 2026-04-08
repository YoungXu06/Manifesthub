import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiHeart, FiShare2, FiBookmark, FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store';

const VisionBoardItem = ({ item, isEditMode, onEdit, viewMode }) => {
  const { deleteVisionBoardItem } = useStore();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this item?')) {
      await deleteVisionBoardItem(item.id);
    }
  };
  
  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };
  
  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };
  
  const handleShare = (e) => {
    e.stopPropagation();
    // TODO: Implement share functionality
  };
  
  const toggleDetails = (e) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };
  
  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const getContentTypeIcon = () => {
    switch (item.type) {
      case 'image':
        return '🖼️';
      case 'quote':
        return '💭';
      case 'affirmation':
        return '✨';
      default:
        return '📝';
    }
  };
  
  const getVisualizationPrompt = () => {
    switch (item.type) {
      case 'image':
        return "Take a deep breath and visualize yourself in this scene. How does it feel?";
      case 'quote':
        return "Close your eyes and let these words resonate within you. What emotions arise?";
      case 'affirmation':
        return "Repeat this affirmation three times, feeling its truth in your heart.";
      default:
        return "Take a moment to reflect on this message. How does it align with your vision?";
    }
  };
  
  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <img
              src={item.content}
              alt={item.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        );
      case 'text':
        return (
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              {item.content}
            </p>
          </div>
        );
      case 'quote':
        return (
          <div className="text-center p-6">
            <p className="text-2xl text-gray-800 dark:text-gray-200 italic">"{item.content}"</p>
            {item.author && (
              <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">— {item.author}</p>
            )}
          </div>
        );
      case 'affirmation':
        return (
          <div className="p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white">
            <p className="text-2xl text-center font-medium">{item.content}</p>
            {item.visualization && (
              <div className="mt-6 p-4 bg-white/10 rounded-lg">
                <p className="text-sm italic">{item.visualization}</p>
              </div>
            )}
          </div>
        );
      default:
        return <div className="p-4">Invalid item type</div>;
    }
  };
  
  const getItemClasses = () => {
    const baseClasses = "group relative bg-white dark:bg-dark-light rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg";
    const heightClasses = viewMode === 'grid' ? 'h-48' : 'h-64';
    const hoverClasses = "hover:scale-[1.02]";
    return `${baseClasses} ${heightClasses} ${hoverClasses}`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`relative group ${
        viewMode === 'grid' ? 'h-full' : ''
      }`}
    >
      <div
        className={`bg-white dark:bg-dark-light rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
          isExpanded ? 'fixed top-0 left-0 w-full h-full z-50' : 'h-full'
        }`}
        onClick={toggleExpand}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{getContentTypeIcon()}</span>
              <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                {item.title}
              </h3>
            </div>
            {isEditMode && (
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
            )}
          </div>
          
          {item.category && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {item.category}
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          {renderContent()}
          
          {/* Visualization Prompt */}
          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
            <p className="text-sm text-primary dark:text-primary-light italic">
              {getVisualizationPrompt()}
            </p>
          </div>
        </div>
        
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-dark-light to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={handleLike}
                className={`p-2 rounded-full transition-colors ${
                  isLiked
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500'
                }`}
              >
                <FiHeart className="h-5 w-5" />
              </button>
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-full transition-colors ${
                  isBookmarked
                    ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-500'
                }`}
              >
                <FiBookmark className="h-5 w-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-full"
              >
                <FiShare2 className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={toggleDetails}
              className="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-full"
            >
              {showDetails ? <FiMinimize2 className="h-5 w-5" /> : <FiMaximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Details Panel */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Details</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Created: {new Date(item.createdAt).toLocaleDateString()}</p>
                  {item.updatedAt && (
                    <p>Updated: {new Date(item.updatedAt).toLocaleDateString()}</p>
                  )}
                  {item.description && (
                    <p className="mt-2">{item.description}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Expanded View Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={toggleExpand} />
      )}
    </motion.div>
  );
};

export default VisionBoardItem;
