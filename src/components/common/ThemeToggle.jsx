import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiSun, FiMoon } from 'react-icons/fi';
import useStore from '../../store';

const ThemeToggle = () => {
  const { t } = useTranslation();
  const { darkMode, toggleDarkMode } = useStore();

  return (
    <button
      type="button"
      className="focus-ring p-2 rounded-md min-h-[40px] min-w-[40px] inline-flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
      onClick={toggleDarkMode}
      aria-label={darkMode ? t('common.lightMode') : t('common.darkMode')}
    >
      {darkMode ? (
        <FiSun className="h-5 w-5" />
      ) : (
        <FiMoon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
