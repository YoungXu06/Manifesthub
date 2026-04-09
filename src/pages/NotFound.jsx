import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mt-4 mb-6">
          {t('notFound.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {t('notFound.subtitle')}
        </p>
        <Link
          to="/"
          className="btn btn-primary inline-flex items-center"
        >
          <FiArrowLeft className="mr-2" /> {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
