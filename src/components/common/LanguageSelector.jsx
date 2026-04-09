import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe, FiCheck } from 'react-icons/fi';
import useStore from '../../store';
import { SUPPORTED_LANGUAGES } from '../../i18n';

const LanguageSelector = ({ variant = 'icon' }) => {
  // variant: 'icon' (compact icon button) | 'full' (show current language name)
  const { i18n } = useTranslation();
  const { setLanguage } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)
    || SUPPORTED_LANGUAGES[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLanguage(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 p-2 rounded-xl text-gray-500 dark:text-gray-400
                   hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800
                   transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
      >
        <FiGlobe className="h-4 w-4" />
        {variant === 'full' && (
          <span className="text-sm font-medium hidden sm:inline">{currentLang.nativeName}</span>
        )}
        {variant === 'icon' && (
          <span className="text-xs font-semibold uppercase hidden sm:inline">{currentLang.code}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl
                     border border-gray-100 dark:border-gray-800 py-1.5 z-50 overflow-hidden"
          style={{ maxHeight: '360px', overflowY: 'auto' }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/25 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-base leading-none select-none" aria-hidden="true">
                  {lang.flag}
                </span>
                <span className="flex-1 text-left font-medium">{lang.nativeName}</span>
                {isActive && (
                  <FiCheck className="h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
