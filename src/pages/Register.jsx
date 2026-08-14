import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiX, FiArrowRight, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import useStore from '../store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const { t } = useTranslation();
  const { register, loginWithGoogle, authError, clearAuthError, authLoading } = useStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: '', email: '', password: '', confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => { return () => clearAuthError(); }, [clearAuthError]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    if (localError) setLocalError('');
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'displayName':
        return value.trim() ? '' : t('auth.nameRequired', { defaultValue: 'Please enter your name' });
      case 'email':
        return value && !EMAIL_RE.test(value) ? t('auth.emailInvalid', { defaultValue: 'Please enter a valid email address' }) : '';
      case 'password':
        return value && value.length < 8 ? t('auth.passwordTooShort', { defaultValue: 'Password must be at least 8 characters' }) : '';
      case 'confirmPassword':
        return value && value !== formData.password ? t('auth.passwordMismatch') : '';
      default:
        return '';
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const { displayName, email, password, confirmPassword } = formData;
    if (!displayName || !email || !password || !confirmPassword) {
      setLocalError(t('auth.fillAllFields')); return;
    }
    if (!EMAIL_RE.test(email)) {
      const err = t('auth.emailInvalid', { defaultValue: 'Please enter a valid email address' });
      setFieldErrors(prev => ({ ...prev, email: err }));
      setLocalError(err);
      return;
    }
    if (password !== confirmPassword) {
      setLocalError(t('auth.passwordMismatch')); return;
    }
    if (password.length < 8) {
      setLocalError(t('auth.passwordTooShort', { defaultValue: 'Password must be at least 8 characters' })); return;
    }
    const result = await register(email, password, displayName);
    if (result.success) navigate('/foundation/onboard');
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    const result = await loginWithGoogle();
    if (result.success) navigate('/foundation/onboard');
  };

  const currentError = localError || authError;
  const passwordStrength = formData.password.length === 0 ? 0
    : formData.password.length < 8 ? 1
    : formData.password.length < 12 ? 2 : 3;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1.5">
          {t('auth.beginJourney')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('auth.signUpSubtitle')}
        </p>
      </div>

      {/* Error */}
      {currentError && (
        <div role="alert" className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start justify-between gap-2">
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
          { id: 'displayName', label: t('auth.yourName'), icon: <FiUser />, type: 'text', placeholder: t('auth.namePlaceholder'), autoComplete: 'name', enterKeyHint: 'next' },
          { id: 'email', label: t('auth.email'), icon: <FiMail />, type: 'email', placeholder: t('auth.emailPlaceholder'), autoComplete: 'email', enterKeyHint: 'next' },
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
                enterKeyHint={field.enterKeyHint}
                required
                onBlur={handleBlur}
                aria-invalid={!!fieldErrors[field.id]}
                className={`input pl-9 w-full text-sm sm:text-base ${fieldErrors[field.id] ? 'border-red-400' : ''}`}
                placeholder={field.placeholder}
                value={formData[field.id]}
                onChange={handleChange}
              />
            </div>
            {fieldErrors[field.id] && <p className="text-xs text-red-500 mt-1">{fieldErrors[field.id]}</p>}
          </div>
        ))}

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            {t('auth.password')}
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              enterKeyHint="next"
              required
              onBlur={handleBlur}
              aria-invalid={!!fieldErrors.password}
              className={`input pl-9 pr-10 w-full text-sm sm:text-base ${fieldErrors.password ? 'border-red-400' : ''}`}
              placeholder={t('auth.passwordMinHint', { defaultValue: 'Min 8 characters' })}
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-pressed={showPassword}
              aria-label={showPassword
                ? t('auth.togglePasswordHide', { defaultValue: 'Hide password' })
                : t('auth.togglePassword', { defaultValue: 'Show password' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
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
                {passwordStrength === 1 ? t('auth.weak') : passwordStrength === 2 ? t('auth.good') : t('auth.strong')}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            {t('auth.confirmPassword')}
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              enterKeyHint="go"
              required
              onBlur={handleBlur}
              aria-invalid={!!fieldErrors.confirmPassword}
              className={`input pl-9 pr-12 w-full text-sm sm:text-base ${fieldErrors.confirmPassword ? 'border-red-400' : ''}`}
              placeholder={t('auth.repeatPassword')}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {formData.confirmPassword && formData.confirmPassword === formData.password && (
              <div className="absolute right-9 top-1/2 -translate-y-1/2">
                <FiCheck className="w-4 h-4 text-emerald-500" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(v => !v)}
              aria-pressed={showConfirmPassword}
              aria-label={showConfirmPassword
                ? t('auth.togglePasswordHide', { defaultValue: 'Hide password' })
                : t('auth.togglePassword', { defaultValue: 'Show password' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>}
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
          {t('auth.createFreeAccount')}
          {!authLoading && <FiArrowRight className="w-4 h-4" />}
        </button>
      </form>

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
        {t('auth.signUpWithGoogle')}
      </button>

      {/* Terms */}
      <p className="mt-4 text-center text-xs text-gray-400 leading-relaxed">
        <Trans
          i18nKey="auth.termsAgree"
          defaults="By signing up you agree to our <0>Terms of Service</0> and <1>Privacy Policy</1>"
          components={[
            <Link key="terms" to="/terms" className="text-indigo-400 hover:text-indigo-600 underline underline-offset-2" />,
            <Link key="privacy" to="/privacy" className="text-indigo-400 hover:text-indigo-600 underline underline-offset-2" />,
          ]}
        />
      </p>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          {t('auth.signIn', { defaultValue: 'Sign in' })} →
        </Link>
      </p>
    </div>
  );
};

export default Register;
