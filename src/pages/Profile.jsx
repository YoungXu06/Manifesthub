import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiLock, FiSettings, FiBell, FiGlobe, FiAlertCircle, FiZap, FiExternalLink, FiSun, FiMoon } from 'react-icons/fi';
import useStore from '../store';
import useSubscription from '../hooks/useSubscription';
import useToast from '../hooks/useToast';
import InterruptToggle from '../components/interrupts/InterruptToggle';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { formatHuman } from '../utils/dateUtils';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, darkMode, toggleDarkMode, setLanguage } = useStore();
  const { isPaid, willCancel, status, expiresAt, openCheckout, openPortal } = useSubscription();
  const { showSuccess, showError } = useToast();

  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || ''
  });

  const [preferences, setPreferences] = useState({
    theme: darkMode ? 'dark' : 'light',
    language: i18n.language || 'en',
    notifications: user?.preferences?.notifications !== false
  });

  const [isUpdating, setIsUpdating] = useState(false);

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

  // Preferences apply immediately — theme / language toggle instantly,
  // notifications are persisted to the store on change.
  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    const next = { ...preferences, [name]: newValue };

    setPreferences(next);

    if (name === 'theme') {
      if ((newValue === 'dark' && !darkMode) || (newValue === 'light' && darkMode)) {
        toggleDarkMode();
      }
    }

    if (name === 'language' && newValue !== i18n.language) {
      i18n.changeLanguage(newValue);
      setLanguage(newValue);
    }

    if (name === 'notifications') {
      updateProfile({
        preferences: {
          theme: next.theme,
          language: next.language,
          notifications: next.notifications
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const result = await updateProfile({ displayName: profileData.displayName });
      if (result.success) {
        showSuccess(t('profile.updated', { defaultValue: 'Profile updated successfully' }));
      }
      // On failure the store already surfaces a global toast — do not double-toast.
    } catch (error) {
      console.error(error);
      showError(t('profile.updateFailed', { defaultValue: 'Failed to update profile' }));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            {t('profile.notSignedIn', { defaultValue: 'Not signed in' })}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('profile.signInPrompt', { defaultValue: 'Please sign in to view your profile' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('profile.title', { defaultValue: 'Profile' })}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('profile.subtitle', { defaultValue: 'Manage your account settings and preferences' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subscription panel */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiZap className="text-indigo-500" />
              {t('subscription.heading', { defaultValue: 'Subscription' })}
            </h2>

            {isPaid ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t('subscription.activePlan', { defaultValue: 'ManifestHub Annual — Active' })}
                    </p>
                    {willCancel && (
                      <span className="badge badge-yellow">
                        {t('subscription.cancellingBadge', { defaultValue: 'Ends' })} {expiresAt ? formatHuman(expiresAt, i18n.language) : '—'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {willCancel
                      ? t('subscription.cancellingAt', { date: expiresAt ? formatHuman(expiresAt, i18n.language) : '—', defaultValue: `Access until ${expiresAt ? formatHuman(expiresAt) : '—'}` })
                      : t('subscription.renewsAt', { date: expiresAt ? formatHuman(expiresAt, i18n.language) : '—', defaultValue: `Renews on ${expiresAt ? formatHuman(expiresAt) : '—'}` })}
                  </p>
                </div>
                <button onClick={openPortal} className="btn btn-secondary inline-flex items-center gap-2">
                  <FiExternalLink className="w-4 h-4" />
                  {t('subscription.manage', { defaultValue: 'Manage subscription' })}
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('subscription.freePlan', { defaultValue: 'Free plan' })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('subscription.upgradeBlurb', { defaultValue: 'Unlock full Reset Protocol, unlimited history, and AI mirror — $99.99/year.' })}
                  </p>
                  {status === 'expired' && (
                    <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <FiAlertCircle className="w-3.5 h-3.5" />
                      {t('subscription.expired', { defaultValue: 'Subscription expired — renew to keep paid features.' })}
                    </p>
                  )}
                </div>
                <button onClick={openCheckout} className="btn btn-primary inline-flex items-center gap-2">
                  <FiZap className="w-4 h-4" />
                  {t('subscription.upgrade', { defaultValue: 'Upgrade to Annual' })}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pattern interrupts toggle */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FiBell className="text-indigo-500" />
              {t('interrupts.section', { defaultValue: 'Pattern Interrupts' })}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {t('interrupts.sectionDesc', { defaultValue: 'Schedule 6 micro-prompts through the day to break autopilot.' })}
            </p>
            <InterruptToggle />
          </div>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <FiUser className="mr-2" /> {t('profile.personalInfo', { defaultValue: 'Personal Information' })}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.name', { defaultValue: 'Name' })}
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
                    {t('profile.email', { defaultValue: 'Email' })}
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
                    {t('profile.emailReadonly', { defaultValue: 'Email cannot be changed' })}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <FiLock className="mr-2 text-gray-400" /> {t('profile.passwordSection', { defaultValue: 'Password' })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t('profile.passwordViaEmail', { defaultValue: 'Password changes are sent to your email' })}
                  </p>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : null}
                    {t('profile.saveChanges', { defaultValue: 'Save Changes' })}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <FiSettings className="mr-2" /> {t('profile.preferences', { defaultValue: 'Preferences' })}
              </h2>

              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('profile.theme', { defaultValue: 'Theme' })}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'light', icon: FiSun, label: t('profile.themeLight', { defaultValue: 'Light' }) },
                      { value: 'dark', icon: FiMoon, label: t('profile.themeDark', { defaultValue: 'Dark' }) },
                    ].map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={preferences.theme === value}
                        onClick={() => handlePreferenceChange({ target: { name: 'theme', value, type: 'radio' } })}
                        className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
                          preferences.theme === value
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center mb-2">
                      <FiGlobe className="mr-2" /> {t('profile.language', { defaultValue: 'Language' })}
                    </div>
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={preferences.language}
                    onChange={handlePreferenceChange}
                    className="input w-full"
                  >
                    {SUPPORTED_LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.nativeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between min-h-[44px]">
                    <label htmlFor="notifications" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      <FiBell className="mr-2" /> {t('profile.notifications', { defaultValue: 'Notifications' })}
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
                    {t('profile.notificationsDesc', { defaultValue: 'Receive notifications about your goals and progress' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
