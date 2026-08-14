import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadingScreen = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 flex items-center justify-center bg-white dark:bg-dark z-50 animate-fade-in"
    >
      <div className="text-center">
        <img
          src="/manifest-hub-logo.jpg"
          alt="ManifestHub"
          className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 mx-auto"
        />
        <div className="mt-4 inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
          {message || t('common.loading')}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
