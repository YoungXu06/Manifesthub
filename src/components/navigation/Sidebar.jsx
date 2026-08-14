import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiX, FiHome, FiUser, FiLogOut, FiImage, FiZap, FiCompass, FiCalendar
} from 'react-icons/fi';
import useStore from '../../store';
import useSubscription from '../../hooks/useSubscription';

const Sidebar = ({ open, setOpen, isMobile }) => {
  const { t } = useTranslation();
  const { user, logout, streakCount } = useStore();
  const { isPaid, openCheckout } = useSubscription();

  const handleLogout = async () => { await logout(); };

  const navItems = [
    { name: t('nav.dashboard'), to: '/dashboard', icon: <FiHome className="h-5 w-5" /> },
    { name: t('nav.foundation', { defaultValue: 'Foundation' }), to: '/foundation', icon: <FiCompass className="h-5 w-5" /> },
    { name: t('nav.visionboard'), to: '/visionboard', icon: <FiImage className="h-5 w-5" /> },
    { name: t('nav.reset', { defaultValue: 'Reset' }), to: '/reset', icon: <FiZap className="h-5 w-5" /> },
    { name: t('nav.reflect', { defaultValue: 'Reflect' }), to: '/reflect/weekly', icon: <FiCalendar className="h-5 w-5" /> },
    { name: t('nav.profile'), to: '/profile', icon: <FiUser className="h-5 w-5" /> },
  ];

  const initial = user?.displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800/70 shadow-xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 dark:border-gray-800/70">
          <div className="flex items-center gap-2.5">
            <img
              src="/manifest-hub-logo.jpg"
              alt="ManifestHub"
              className="w-7 h-7 rounded-lg object-cover shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50"
            />
            <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              {t('app.name')}
            </span>
          </div>
          {isMobile && (
            <button
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              onClick={() => setOpen(false)}
            >
              <FiX className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800/70">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {user?.displayName || 'Manifestor'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          {/* Streak */}
          {streakCount > 0 && (
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40">
              <span className="text-base">🔥</span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {streakCount} {t('sidebar.dayStreak')}
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            {t('nav.navigate')}
          </p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/25 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white'
                }`
              }
              onClick={() => isMobile && setOpen(false)}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer — same height as app Footer to keep border aligned */}
        <div className="px-3 border-t border-gray-100 dark:border-gray-800/70 flex flex-col gap-1.5 py-2.5">
          {isPaid ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/40">
              <span className="text-base">⚡</span>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {t('sidebar.annualMember', { defaultValue: 'Annual Member' })}
              </span>
            </div>
          ) : (
            <button
              onClick={openCheckout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-200/60 dark:border-indigo-800/40 transition-colors group"
            >
              <span className="text-base">⚡</span>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex-1 text-left">
                {t('sidebar.upgrade', { defaultValue: 'Upgrade to Annual' })}
              </span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/15 hover:text-red-500 dark:hover:text-red-400 transition-all"
          >
            <FiLogOut className="h-5 w-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
