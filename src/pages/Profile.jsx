import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiLock, FiSettings, FiBell, FiGlobe, FiCheck, FiAlertCircle } from 'react-icons/fi';
import useStore from '../store';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, darkMode, toggleDarkMode, setLanguage } = useStore();
  
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [preferences, setPreferences] = useState({
    theme: darkMode ? 'dark' : 'light',
    language: i18n.language || 'en',
    notifications: user?.preferences?.notifications !== false
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Ensure profile data is updated when user data changes
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || ''
      }));
      
      setPreferences(prev => ({
        ...prev,
        theme: darkMode ? 'dark' : 'light',
        language: i18n.language || 'en',
        notifications: user.preferences?.notifications !== false
      }));
    }
  }, [user, darkMode, i18n.language]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };
  
  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setPreferences({ ...preferences, [name]: newValue });
    
    // Apply theme changes immediately
    if (name === 'theme') {
      if ((value === 'dark' && !darkMode) || (value === 'light' && darkMode)) {
        toggleDarkMode();
      }
    }
    
    // Apply language changes immediately
    if (name === 'language' && value !== i18n.language) {
      setLanguage(value);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    // Validate password if changing
    if (profileData.newPassword) {
      if (!profileData.currentPassword) {
        setErrorMessage('Current password is required');
        setIsUpdating(false);
        return;
      }
      
      if (profileData.newPassword !== profileData.confirmPassword) {
        setErrorMessage('New passwords do not match');
        setIsUpdating(false);
        return;
      }
      
      if (profileData.newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters');
        setIsUpdating(false);
        return;
      }
    }
    
    try {
      const updates = {
        displayName: profileData.displayName,
        preferences: {
          theme: preferences.theme,
          language: preferences.language,
          notifications: preferences.notifications
        }
      };
      
      // Password update would be handled separately in a real app
      
      const result = await updateProfile(updates);
      
      if (result.success) {
        setSuccessMessage('Profile updated successfully');
        // Clear password fields after successful update
        setProfileData({
          ...profileData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setErrorMessage(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Not signed in</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Please sign in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-md">
          <div className="flex items-center">
            <FiCheck className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
            <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Information */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-light rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <FiUser className="mr-2" /> Personal Information
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="displayName"
                      name="displayName"
                      type="text"
                      value={profileData.displayName}
                      onChange={handleProfileChange}
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="input pl-10 w-full bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email cannot be changed
                  </p>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-8 mb-4 flex items-center">
                  <FiLock className="mr-2" /> Change Password
                </h3>
                
                <div className="mb-4">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={profileData.currentPassword}
                      onChange={handleProfileChange}
                      className="input pl-10 w-full"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={profileData.newPassword}
                      onChange={handleProfileChange}
                      className="input pl-10 w-full"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={handleProfileChange}
                      className="input pl-10 w-full"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn btn-primary"
                  >
                    {isUpdating ? (
                      <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    ) : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Preferences */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-light rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <FiSettings className="mr-2" /> Preferences
              </h2>
              
              <form>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Theme
                  </label>
                  <div className="space-y-2">
                    {['light', 'dark'].map((theme) => (
                      <label key={theme} className="flex items-center">
                        <input
                          type="radio"
                          name="theme"
                          value={theme}
                          checked={preferences.theme === theme}
                          onChange={handlePreferenceChange}
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          {theme === 'light' ? 'Light' : 'Dark'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center mb-2">
                      <FiGlobe className="mr-2" /> Language
                    </div>
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={preferences.language}
                    onChange={handlePreferenceChange}
                    className="input w-full"
                  >
                    <option value="en">English</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="notifications" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      <FiBell className="mr-2" /> Notifications
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        name="notifications"
                        id="notifications"
                        checked={preferences.notifications}
                        onChange={handlePreferenceChange}
                        className="sr-only"
                      />
                      <label
                        htmlFor="notifications"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                          preferences.notifications ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span 
                          className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                            preferences.notifications ? 'translate-x-4' : 'translate-x-0'
                          }`} 
                        />
                      </label>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Receive notifications about your goals and progress
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isUpdating}
                  className="btn btn-primary w-full"
                >
                  {isUpdating ? (
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  ) : null}
                  Save Preferences
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
