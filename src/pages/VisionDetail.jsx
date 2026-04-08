import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiCalendar, FiTarget, FiClock, FiCheck, FiEdit2, FiTrash2,
  FiStar, FiDollarSign, FiHome, FiUsers, FiBook, FiAward, FiGlobe, 
  FiActivity, FiSun, FiSmile 
} from 'react-icons/fi';
import useStore from '../store';
import { motion } from 'framer-motion';
import EnhancedVisionBoardItemForm from '../components/visionboard/EnhancedVisionBoardItemForm';

const VisionDetail = ({ editMode = false }) => {
  const { id, userId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add section below if in edit mode
  useEffect(() => {
    if (editMode) {
      document.title = "Edit Vision | ManifestHub";
    } else {
      document.title = "Vision Details | ManifestHub";
    }
  }, [editMode]);
  
  const { 
    visionBoard, 
    goals, 
    fetchVisionBoard, 
    fetchGoals, 
    updateVisionBoardItem, 
    deleteVisionBoardItem,
    deleteGoal,
    updateGoal,
    user
  } = useStore();
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchVisionBoard(), fetchGoals()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchVisionBoard, fetchGoals]);
  
  // useMemo to optimise item lookup
  const currentItem = useMemo(() => {
    if (isLoading || !visionBoard || !goals) return null;
    
    const targetUserId = userId || user?.uid;
    if (!targetUserId) return null;
    
    const isGoalId = id.startsWith('goal-');
    let foundItem;
    
    if (isGoalId) {
      const goalId = id.replace('goal-', '');
      foundItem = goals.find(g => g.id === goalId && (!g.userId || g.userId === targetUserId));
      if (foundItem) {
        foundItem = {
          id: `goal-${foundItem.id}`,
          title: foundItem.title,
          content: foundItem.description || foundItem.title,
          category: foundItem.category,
          dueDate: foundItem.dueDate,
          priority: foundItem.priority,
          progress: foundItem.progress,
          completed: foundItem.completed,
          steps: foundItem.steps || [],
          createdAt: foundItem.createdAt || new Date().toISOString(),
          updatedAt: foundItem.updatedAt
        };
      }
    } else {
      foundItem = visionBoard.find(v => v.id === id && (!v.userId || v.userId === targetUserId));
    }
    
    return foundItem || null;
  }, [id, userId, user, isLoading, visionBoard, goals]);
  
  // Update state when found item changes
  useEffect(() => {
    if (currentItem) {
      setItem(currentItem);
      // Only log in development mode and when item changes
      if (process.env.NODE_ENV === 'development') {
        console.log('Vision item loaded:', {
          id: currentItem.id,
          title: currentItem.title,
          hasImage: !!(currentItem.imageData || currentItem.imageUrl)
        });
      }
    } else if (!isLoading) {
      setItem(null);
      if (process.env.NODE_ENV === 'development') {
        console.log('Vision item not found for ID:', id);
      }
    }
  }, [currentItem, isLoading, id]);
  
  // Handle data update
  const handleProgressUpdate = (newProgress) => {
    if (!item) return;
    
    const isGoalType = item.id.toString().startsWith('goal-');
    // Determine completion based on progress
    const isCompleted = newProgress === 100;
    const newItem = { 
      ...item, 
      progress: newProgress,
      completed: isCompleted // completion is determined solely by progress
    };
    
    // Update local state
    setItem(newItem);
    
    // Update database
    if (isGoalType) {
      const goalId = item.id.replace('goal-', '');
      updateGoal(goalId, { progress: newProgress, completed: isCompleted })
        .then(result => {
          if (!result.success) {
            console.error('Failed to update goal progress:', result.error);
            // Roll back to original state if update fails
            setItem(item);
          }
        })
        .catch(error => {
          console.error('Error updating goal progress:', error);
          // Roll back to original state if update fails
          setItem(item);
        });
    } else {
      // Ensure update uses Firebase document ID
      const idToUpdate = item.id;
      // console.log(`Updating progress of vision card with document ID: ${idToUpdate}`);
      updateVisionBoardItem(idToUpdate, { progress: newProgress, completed: isCompleted })
        .then(result => {
          if (!result.success) {
            console.error('Failed to update vision progress:', result.error);
            // Roll back to original state if update fails
            setItem(item);
          }
        })
        .catch(error => {
          console.error('Error updating vision progress:', error);
          // Roll back to original state if update fails
          setItem(item);
        });
    }
  };
  
  const toggleStepComplete = (index) => {
    if (!item || !item.steps) return;
    
    const isGoalType = item.id.toString().startsWith('goal-');
    const newSteps = [...item.steps];
    newSteps[index].completed = !newSteps[index].completed;
    
    // Calculate new completed-steps percentage
    const completedSteps = newSteps.filter(step => step.completed).length;
    const totalSteps = newSteps.length;
    const newProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : item.progress;
    
    // Determine completion based on progress
    const isCompleted = newProgress === 100;
    
    // Update local state
    const newItem = { 
      ...item, 
      steps: newSteps,
      progress: newProgress,
      completed: isCompleted // completion is determined solely by progress
    };
    
    // Update UI immediately
    setItem(newItem);
    
    // Update database
    if (isGoalType) {
      const goalId = item.id.replace('goal-', '');
      const updates = { 
        steps: newSteps,
        progress: newProgress,
        completed: isCompleted
      };
      
      updateGoal(goalId, updates)
        .then(result => {
          if (!result.success) {
            console.error('Failed to update goal steps:', result.error);
            // Roll back to original state if update fails
            setItem(item);
          }
        })
        .catch(error => {
          console.error('Error updating goal steps:', error);
          // Roll back to original state if update fails
          setItem(item);
        });
    } else {
      // Ensure update uses Firebase document ID
      const idToUpdate = item.id;
      const updates = { 
        steps: newSteps,
        progress: newProgress,
        completed: isCompleted
      };
      
      // console.log(`Updating steps of vision card with document ID: ${idToUpdate}`);
      updateVisionBoardItem(idToUpdate, updates)
        .then(result => {
          if (!result.success) {
            console.error('Failed to update vision steps:', result.error);
            // Roll back to original state if update fails
            setItem(item);
          }
        })
        .catch(error => {
          console.error('Error updating vision steps:', error);
          // Roll back to original state if update fails
          setItem(item);
        });
    }
  };
  
  const handleDelete = async () => {
    if (!item) return;
    
    if (window.confirm('Are you sure you want to delete this vision card?')) {
      try {
        const isGoalType = item.id.toString().startsWith('goal-');
        
        // Navigate away first so user does not stay on deleted page
        navigate('/visionboard');
        
        if (isGoalType) {
          const goalId = item.id.replace('goal-', '');
          await deleteGoal(goalId);
        } else {
          // Prefer item.id (Firebase doc ID) for deletion
          const idToDelete = item.id; // use Firebase document ID, not uuid
          // console.log(`Deleting vision card with document ID: ${idToDelete}`);
          await deleteVisionBoardItem(idToDelete);
        }
        
        // Refresh data in background
        Promise.all([fetchVisionBoard(true), fetchGoals(true)]);
      } catch (error) {
        console.error('Error deleting card:', error);
        alert('Delete failed, please try again later');
      }
    }
  };
  
  const handleEdit = () => {
    if (!item) return;
    // Use document ID only
    const itemId = item.id;
    const currentUserId = userId || user?.uid || '';
    navigate(`/visionboard/edit/${currentUserId}/${itemId}`);
  };
  
  // Simple HTML sanitizer
  const sanitizeHTML = (html) => {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '');
  };
  
  const createMarkup = (content) => {
    return { __html: sanitizeHTML(content) };
  };
  
  // Auto-select icon based on category
  const getCustomIcon = () => {
    if (!item) return <FiStar />;
    
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
  
  // Select icon color by category
  const getIconColor = () => {
    if (!item) return 'text-primary dark:text-primary-light';
    
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
  
  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      // console.log('Original form data:', formData);
      // console.log('Current item ID:', item.id);
      
      // Set completion state based on progress
      const progress = parseInt(formData.progress || 0);
      formData.completed = progress === 100;
      
      // Handle differently based on whether it's a goal or vision card
      if (item.id.toString().startsWith('goal-')) {
        const goalId = item.id.replace('goal-', '');
        
        // Transform data format - map content to description for goals
        const goalData = {
          ...formData,
          description: formData.content, // Map content to description
        };
        delete goalData.id; // Remove id property to avoid Firebase update issues
        
        // Ensure steps format is correct
        if (goalData.steps && Array.isArray(goalData.steps)) {
          goalData.steps = goalData.steps.map(step => ({
            text: String(step.text || ''),
            completed: Boolean(step.completed)
          }));
        }
        
        // Ensure date format is correct
        if (goalData.dueDate) {
          try {
            const dateObj = new Date(goalData.dueDate);
            if (isNaN(dateObj.getTime())) {
              goalData.dueDate = null;
            }
          } catch (e) {
            console.warn('Invalid date format:', e);
            goalData.dueDate = null;
          }
        }
        
        // console.log('Updating goal with ID:', goalId);
        // console.log('Updated goal data:', goalData);
        const result = await updateGoal(goalId, goalData);
        
        if (result.success) {
          // Update local state first without waiting for re-fetch
          setItem({
            ...item,
            ...formData,
            updatedAt: new Date().toISOString()
          });
          
          // Async refresh data in background
          Promise.all([fetchVisionBoard(true), fetchGoals(true)]);
          
          // Return to detail page after successful update - use new format
          const currentUserId = userId || user?.uid || '';
          navigate(`/visionboard/${currentUserId}/${item.id}`, { replace: true });
        } else {
          throw new Error(result.error || 'Failed to update goal');
        }
      } else {
        // This is a vision item — use Firebase document ID
        const docId = item.id; // use Firebase document ID
        // console.log('Updating vision card with Firebase document ID:', docId);
        
        // Prepare update data, remove id and uuid to avoid conflicts
        const visionData = { ...formData };
        delete visionData.id;
        delete visionData.uuid; // remove uuid field
        
        // Ensure steps format is correct
        if (visionData.steps && Array.isArray(visionData.steps)) {
          visionData.steps = visionData.steps.map(step => ({
            text: String(step.text || ''),
            completed: Boolean(step.completed)
          }));
        }
        
        // Ensure date format is correct
        if (visionData.dueDate) {
          try {
            const dateObj = new Date(visionData.dueDate);
            if (isNaN(dateObj.getTime())) {
              visionData.dueDate = null;
            }
          } catch (e) {
            console.warn('Invalid date format:', e);
            visionData.dueDate = null;
          }
        }
        
        // console.log('Updated vision card data:', visionData);
        
        const result = await updateVisionBoardItem(docId, visionData);
        
        if (result.success) {
          // console.log('Vision card successfully updated!');
          
          // Update local state immediately for instant feedback
          setItem({
            ...item,
            ...visionData,
            updatedAt: new Date().toISOString()
          });
          
          // Async refresh data in background
          Promise.all([fetchVisionBoard(true), fetchGoals(true)]);
          
          // Return to detail page after successful update - use new format
          const currentUserId = userId || user?.uid || '';
          navigate(`/visionboard/${currentUserId}/${docId}`, { replace: true });
        } else {
          throw new Error(result.error || 'Failed to update vision');
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Update failed: ' + error.message);
    }
  };
  
  // When no matching vision or goal is found
  if (!isLoading && !item) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h1 className="text-2xl font-semibold mb-4">Vision Card Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">This vision card may have been deleted or moved</p>
        <Link to="/visionboard" className="btn btn-primary">
          Return to Vision Board
        </Link>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="animate-fade-in"
    >
      {/* Back button and header */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(editMode ? `/visionboard/${userId || user?.uid}/${id}` : '/visionboard')}
            className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editMode ? "Edit Vision" : "Vision Details"}
          </h1>
        </div>
        
        {!editMode && (
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="btn btn-outline btn-sm flex items-center"
            >
              <FiEdit2 className="mr-1" /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger btn-sm flex items-center"
            >
              <FiTrash2 className="mr-1" /> Delete
            </button>
          </div>
        )}
      </div>
      
      {/* Edit mode */}
      {editMode ? (
        <div className="bg-white dark:bg-dark-light rounded-lg shadow-md p-6">
          <EnhancedVisionBoardItemForm 
            itemToEdit={item} 
            onClose={() => navigate(`/visionboard/${userId || user?.uid}/${id}`)}
            onSubmit={handleSubmit}
          />
        </div>
      ) : (
        /* Detail view */
        <div className="bg-white dark:bg-dark-light rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            {/* Title and icon */}
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-4 rounded-full bg-gray-100 dark:bg-gray-800 ${getIconColor()}`}>
                {getCustomIcon()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{item.title}</h2>
                {item.category && (
                  <div className="mt-1">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      {item.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Main content area — split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: descriptive content */}
              <div className="space-y-6">
                {/* Content description */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    Vision Description
                  </h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300 prose-a:font-medium prose-a:transition-colors prose-a:duration-200">
                    <div dangerouslySetInnerHTML={createMarkup(item.content)}></div>
                  </div>
                </div>
                
                {/* Visualization Prompt */}
                {item.visualization && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-5 border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center mb-3">
                      <FiSmile className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                      <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-300">Visualization Prompt</h3>
                    </div>
                    <p className="text-indigo-700 dark:text-indigo-300 italic leading-relaxed text-sm">
                      {item.visualization}
                    </p>
                    <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-md">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">
                        💡 Take a moment to close your eyes and immerse yourself in this visualization
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Feelings */}
                {item.feelings && (
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg p-5 border border-pink-100 dark:border-pink-800">
                    <h3 className="text-lg font-medium text-pink-800 dark:text-pink-300 mb-3 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-pink-500 mr-2"></div>
                      Feelings & Emotions
                    </h3>
                    <p className="text-pink-700 dark:text-pink-300 italic leading-relaxed text-sm">{item.feelings}</p>
                  </div>
                )}
                
                {/* Metadata */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                    Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                      <p className="font-medium text-gray-700 dark:text-gray-300 capitalize text-sm">{item.category || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Created Date</p>
                      <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                        {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    {item.updatedAt && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right: image and goal content */}
              <div className="space-y-6">
                {/* Vision Image */}
                {(item.imageData || item.imageUrl) && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      Vision Image
                    </h3>
                    <div className="relative overflow-hidden rounded-lg group">
                      <img
                        src={item.imageData || item.imageUrl}
                        alt={item.title}
                        className="w-full max-h-80 min-h-32 object-contain bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 group-hover:shadow-xl transition-all duration-300"
                        onError={(e) => {
                          console.error('Failed to load image:', e);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.log('Image loaded successfully');
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 rounded-lg pointer-events-none"></div>
                    </div>
                  </div>
                )}
                
                {/* Goal details section */}
                {item.dueDate && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          Goal Status
                        </h3>
                        {item.completed && (
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                            <FiCheck className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Progress</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{item.progress || 0}%</span>
                        </div>
                        <div className="relative">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div 
                              className={`h-3 rounded-full transition-all duration-300 ${
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
                            className="absolute top-0 left-0 w-full h-3 opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 mb-4">
                        <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <FiCalendar className="h-4 w-4 mr-3 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
                            <p className="font-medium text-sm">{new Date(item.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <FiTarget className="h-4 w-4 mr-3 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Priority</p>
                            <p className={`font-medium text-sm ${
                              Number(item.priority) === 3 ? 'text-red-500' : 
                              Number(item.priority) === 2 ? 'text-yellow-500' : 'text-green-500'
                            }`}>
                              {Number(item.priority) === 3 ? 'High' : Number(item.priority) === 2 ? 'Medium' : 'Low'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className={`p-2 rounded-full ${
                            item.completed 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-500' 
                              : item.dueDate && new Date(item.dueDate) < new Date() 
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-500' 
                                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-500'
                          } mr-3`}>
                            {item.completed ? (
                              <FiCheck className="h-4 w-4" />
                            ) : (
                              <FiClock className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                            <p className={`font-medium text-sm ${
                              item.completed 
                                ? 'text-green-500' 
                                : item.dueDate && new Date(item.dueDate) < new Date() 
                                  ? 'text-red-500' 
                                  : 'text-yellow-500'
                            }`}>
                              {item.completed 
                                ? 'Completed' 
                                : item.dueDate && new Date(item.dueDate) < new Date() 
                                  ? 'Overdue'
                                  : 'In Progress'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Steps */}
                    {item.steps && item.steps.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5">
                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          Action Steps
                        </h3>
                        <ul className="space-y-2">
                          {item.steps.map((step, index) => (
                            <li key={index} className="flex items-start p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <input 
                                type="checkbox" 
                                checked={step.completed} 
                                onChange={() => toggleStepComplete(index)}
                                className="mt-0.5 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <span className={`ml-3 text-sm ${step.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {step.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VisionDetail; 