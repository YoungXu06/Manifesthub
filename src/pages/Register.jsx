import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiX, FiArrowRight, FiCheck } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import useStore from '../store';

const Register = () => {
  const { t } = useTranslation();
  const { register, loginWithGoogle, authError, clearAuthError, authLoading } = useStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: '', email: '', password: '', confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');

  useEffect(() => { return () => clearAuthError(); }, [clearAuthError]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const { displayName, email, password, confirmPassword } = formData;
    if (!displayName || !email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields'); return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match'); return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters'); return;
    }
    const result = await register(email, password, displayName);
    if (result.success) navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    const result = await loginWithGoogle();
    if (result.success) navigate('/dashboard');
  };

  const currentError = localError || authError;
  const passwordStrength = formData.password.length === 0 ? 0
    : formData.password.length < 6 ? 1
    : formData.password.length < 10 ? 2 : 3;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5">
          Begin your journey 🌟
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create your free account and start manifesting today
        </p>
      </div>

      {/* Error */}
      {currentError && (
        <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{currentError}</p>
          </div>
          <button onClick={() => { setLocalError(''); clearAuthError(); }} className="text-red-400 hover:text-red-600 flex-shrink-0">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { id: 'displayName', label: 'Your name', icon: <FiUser />, type: 'text', placeholder: 'Alex Johnson', autoComplete: 'name' },
          { id: 'email', label: 'Email address', icon: <FiMail />, type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
        ].map(field => (
          <div key={field.id}>
            <label htmlFor={field.id} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              {field.label}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none">
                {field.icon}
              </span>
              <input
                id={field.id}
                name={field.id}
                type={field.type}
                autoComplete={field.autoComplete}
                required
                className="input pl-9 w-full text-sm"
                placeholder={field.placeholder}
                value={formData[field.id]}
                onChange={handleChange}
              />
            </div>
          </div>
        ))}

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="input pl-9 w-full text-sm"
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          {/* Password strength */}
          {formData.password && (
            <div className="mt-2 flex gap-1">
              {[1, 2, 3].map(level => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    passwordStrength >= level
                      ? level === 1 ? 'bg-red-400' : level === 2 ? 'bg-amber-400' : 'bg-emerald-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
              <span className="text-xs ml-1 text-gray-400">
                {passwordStrength === 1 ? 'Weak' : passwordStrength === 2 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="input pl-9 w-full text-sm"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {formData.confirmPassword && formData.confirmPassword === formData.password && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <FiCheck className="w-4 h-4 text-emerald-500" />
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={authLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all mt-2 ${
            authLoading
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {authLoading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : null}
          Create Free Account
          {!authLoading && <FiArrowRight className="w-4 h-4" />}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 font-medium">or continue with</span>
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
        Sign up with Google
      </button>

      {/* Terms */}
      <p className="mt-4 text-center text-xs text-gray-400 leading-relaxed">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          Sign in →
        </Link>
      </p>
    </div>
  );
};

export default Register;
