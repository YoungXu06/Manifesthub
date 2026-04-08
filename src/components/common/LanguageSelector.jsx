import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe } from 'react-icons/fi';
import useStore from '../../store';

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const languages = [
    { code: 'en', name: t('language.en') },
    { code: 'zh', name: t('language.zh') }
  ];
  
  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLanguage(code);
    setIsOpen(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
      >
        <FiGlobe className="h-5 w-5" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-light rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
          {languages.map((language) => (
            <button
              key={language.code}
              className={`block w-full text-left px-4 py-2 text-sm ${
                i18n.language === language.code
                  ? 'bg-primary text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => changeLanguage(language.code)}
            >
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
