import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-white dark:bg-dark-light border-t border-gray-100 dark:border-gray-800/70 px-6 flex items-center"
      style={{ height: '48px', flexShrink: 0 }}
    >
      <div className="w-full flex flex-row justify-between items-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          &copy; {year} {t('app.name')}
        </p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
            Terms of Service
          </Link>
          <Link to="/contact" className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
