import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX } from 'react-icons/fi';
import useStore from '../../store';
import ThemeToggle from '../common/ThemeToggle';
import UserMenu from './UserMenu';

const Navbar = ({ toggleSidebar, sidebarOpen, isMobile }) => {
  const { t } = useTranslation();
  const { user } = useStore();

  // On desktop, when sidebar is open it already shows the logo — hide it here
  const showLogo = isMobile || !sidebarOpen;

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/70 shadow-sm">
      <div className="flex items-center justify-between w-full px-4 sm:px-6">

        {/* Left: toggle + logo (logo hidden on desktop when sidebar is open) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen && !isMobile ? (
              <FiX className="h-5 w-5" />
            ) : (
              <FiMenu className="h-5 w-5" />
            )}
          </button>

          {showLogo && (
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <img
                src="/manifest-hub-logo.jpg"
                alt="ManifestHub"
                className="w-7 h-7 rounded-lg object-cover shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50 group-hover:shadow-indigo-300 dark:group-hover:shadow-indigo-800/60 transition-shadow"
              />
              <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">
                {t('app.name')}
              </span>
            </Link>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden md:flex items-center gap-1.5">
            <ThemeToggle />
          </div>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
