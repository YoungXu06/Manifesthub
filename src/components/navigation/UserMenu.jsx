import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiLogOut } from 'react-icons/fi';
import useStore from '../../store';

const UserMenu = ({ user }) => {
  const { t } = useTranslation();
  const { logout } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  
  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="focus-ring flex items-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('nav.userMenu', { defaultValue: 'User menu' })}
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center">
          {user?.displayName?.charAt(0) || 'U'}
        </div>
      </button>
      
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-light rounded-xl shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5"
        >
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
          
          <Link
            to="/profile"
            role="menuitem"
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsOpen(false)}
          >
            <FiUser className="mr-3 h-5 w-5" />
            {t('nav.profile')}
          </Link>
          
          <button
            onClick={handleLogout}
            role="menuitem"
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiLogOut className="mr-3 h-5 w-5" />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
