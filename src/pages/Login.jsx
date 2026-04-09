import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMail, FiLock, FiAlertCircle, FiX, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import useStore from '../store';

const Login = () => {
  const { t } = useTranslation();
  const { login, loginWithGoogle, resetPassword, authError, clearAuthError, authLoading } = useStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => { return () => clearAuthError(); }, [clearAuthError]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isResetMode) { handlePasswordReset(); return; }
    setLocalError('');
    const { email, password } = formData;
    if (!email || !password) { setLocalError(t('auth.fillAllFields') || 'Please fill all fields'); return; }
    const result = await login(email, password);
    if (result.success) navigate('/dashboard');
  };

  const handlePasswordReset = async () => {
    if (!formData.email) { setLocalError(t('auth.fillAllFields')); return; }
    const result = await resetPassword(formData.email);
    if (result.success) setResetSent(true);
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    const result = await loginWithGoogle();
    if (result.success) navigate('/dashboard');
  };

  const toggleResetMode = () => { setIsResetMode(!isResetMode); setLocalError(''); setResetSent(false); };
  const currentError = localError || authError;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <img
            src="/manifest-hub-logo.jpg"
            alt="ManifestHub"
            className="w-8 h-8 rounded-xl object-cover shadow-sm"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5">
          {isResetMode ? t('auth.forgotPassword') : t('auth.welcomeBack')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isResetMode
            ? t('auth.resetPasswordSubtitle')
            : t('auth.signInSubtitle')}
        </p>
      </div>

      {/* Error */}
      {currentError && (
        <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{currentError}</p>
          </div>
          <button onClick={() => { setLocalError(''); clearAuthError(); }} className="text-red-400 hover:text-red-600 flex-shrink-0">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reset success */}
      {resetSent && (
        <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {t('auth.resetLinkSent')}
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            {t('auth.email')}
          </label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input pl-9 w-full text-sm"
              placeholder={t('auth.emailPlaceholder')}
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        {!isResetMode && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                {t('auth.password')}
              </label>
              <button
                type="button"
                onClick={toggleResetMode}
                className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input pl-9 w-full text-sm"
                placeholder={t('auth.passwordPlaceholder')}
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={authLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
            authLoading
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {authLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : null}
          {isResetMode ? t('auth.sendResetLink') : t('auth.signIn')}
          {!authLoading && !isResetMode && <FiArrowRight className="w-4 h-4" />}
        </button>
      </form>

      {isResetMode ? (
        <button
          onClick={toggleResetMode}
          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {t('auth.backToSignIn')}
        </button>
      ) : (
        <>
          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 font-medium">{t('auth.orContinueWith')}</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm"
          >
            <FcGoogle className="h-5 w-5 flex-shrink-0" />
            {t('auth.signInWithGoogle')}
          </button>

          {/* Register link */}
          <p className="mt-7 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
              {t('auth.signUp')} →
            </Link>
          </p>
        </>
      )}
    </div>
  );
};

export default Login;
