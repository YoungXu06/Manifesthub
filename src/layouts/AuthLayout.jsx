import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../components/common/ThemeToggle';
import LanguageSelector from '../components/common/LanguageSelector';

const AuthLayout = () => {
  const { t } = useTranslation();

  /* Left-panel quote rotation (localized) */
  const QUOTES = React.useMemo(() => [
    { text: t('auth.quote1', { defaultValue: "Whatever the mind can conceive and believe, it can achieve." }), author: 'Napoleon Hill' },
    { text: t('auth.quote2', { defaultValue: "Imagination is everything. It is the preview of life's coming attractions." }), author: 'Albert Einstein' },
    { text: t('auth.quote3', { defaultValue: 'You become what you think about most of the time.' }), author: 'Brian Tracy' },
  ], [t]);

  const [quoteIdx] = React.useState(() => Math.floor(Math.random() * QUOTES.length));
  const quote = QUOTES[quoteIdx];

  /* Lazy-init the star field once so re-renders don't shuffle it */
  const [stars] = React.useState(() =>
    Array.from({ length: 60 }, () => ({
      width: `${Math.random() * 2 + 1}px`,
      height: `${Math.random() * 2 + 1}px`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.6 + 0.1,
      animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 4}s`,
    }))
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">

      {/* ── Left decorative panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-violet-900 flex-col justify-between p-12">
        {/* Background stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {stars.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={s}
            />
          ))}
        </div>
        <style>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.9; }
          }
        `}</style>

        {/* Glow blob */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <img
            src="/manifest-hub-logo.jpg"
            alt="ManifestHub"
            className="w-9 h-9 rounded-xl object-cover"
          />
          <span className="text-xl font-bold text-white">{t('app.name')}</span>
        </div>

        {/* Quote */}
        <div className="relative z-10">
          <div className="w-10 h-1 bg-white/40 rounded mb-6" />
          <p className="text-2xl font-light text-white leading-relaxed italic mb-4">
            "{quote.text}"
          </p>
          <p className="text-white/60 text-sm font-medium">— {quote.author}</p>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-white/40 text-xs leading-relaxed">
            {t('auth.tagline', { defaultValue: 'Manifest your dreams into reality with the power of focused intention and daily practice.' })}
          </p>
        </div>
      </div>

      {/* ── Right auth form panel ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800/60">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <img
              src="/manifest-hub-logo.jpg"
              alt="ManifestHub"
              className="w-7 h-7 rounded-lg object-cover"
            />
            <span className="text-base font-bold text-gray-900 dark:text-white">{t('app.name')}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelector variant="icon" />
            <ThemeToggle />
          </div>
        </header>

        {/* Form */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} {t('app.name')} · All rights reserved
        </footer>
      </div>
    </div>
  );
};

export default AuthLayout;
