import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark px-4">
      <div className="text-center">
        <img
          src="/manifest-hub-logo.jpg"
          alt="ManifestHub"
          className="w-16 h-16 rounded-2xl object-cover shadow-sm mx-auto mb-6"
        />
        <h1 className="text-9xl font-bold font-serif text-primary">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mt-4 mb-6">
          {t('notFound.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {t('notFound.subtitle')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="btn btn-primary inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> {t('notFound.backHome')}
          </Link>
          <Link
            to="/login"
            className="btn btn-outline inline-flex items-center"
          >
            {t('auth.signIn', { defaultValue: 'Sign in' })}
          </Link>
          <Link
            to="/contact"
            className="btn btn-outline inline-flex items-center"
          >
            {t('contact.title', { defaultValue: 'Contact Us' })}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
