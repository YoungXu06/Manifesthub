import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiCalendar, FiCheck, FiPlus, FiStar, FiHeart,
  FiChevronLeft, FiChevronRight, FiBookmark, FiTrendingUp, FiLoader,
  FiZap, FiSun, FiMoon, FiCloud, FiSmile, FiEdit3, FiTarget,
  FiUser, FiArrowRight, FiCompass,
} from 'react-icons/fi';
import useStore from '../store';
import IndexNotification from '../components/IndexNotification';
import useToast from '../hooks/useToast';
import useSubscription from '../hooks/useSubscription';
import Skeleton from '../components/common/Skeleton';
import { LENS_LEVELS } from '../utils/manifestProtocol';

/* ─── Affirmation emojis (text/visualization come from i18n or foundation) ─── */
const AFF_EMOJIS = ['✨','🎯','⚡','🌟','🦋'];
const AFF_COUNT_FALLBACK = 5;

/** Build a 5-card affirmation deck from the user's foundation. Returns null
 *  when not enough foundation data exists; caller should fallback to static. */
function buildFoundationAffirmations(foundation, t) {
  if (!foundation) return null;
  const cards = [];
  if (foundation.identityStatement) {
    cards.push({
      emoji: '🪞',
      text: foundation.identityStatement,
      caption: t('dashboard.aff.identityCaption'),
    });
  }
  if (foundation.antiVision) {
    cards.push({
      emoji: '🛡️',
      text: t('dashboard.aff.antiVisionPrefix') + foundation.antiVision,
      caption: t('dashboard.aff.antiVisionCaption'),
    });
  }
  if (foundation.vision) {
    cards.push({
      emoji: '🌅',
      text: foundation.vision,
      caption: t('dashboard.aff.visionCaption'),
    });
  }
  if (foundation.oneMonthProject) {
    cards.push({
      emoji: '⚔️',
      text: foundation.oneMonthProject,
      caption: t('dashboard.aff.monthCaption'),
    });
  }
  if (foundation.oneYearLens) {
    cards.push({
      emoji: '🎯',
      text: foundation.oneYearLens,
      caption: t('dashboard.aff.yearCaption'),
    });
  }
  return cards.length >= 2 ? cards : null;
}

/* ─── Moods (static colors/icons, labels resolved in component) ─── */
const MOOD_DEFS = [
  { icon: '😊', key: 'great', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  { icon: '😌', key: 'good',  color: 'text-blue-500 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  { icon: '😐', key: 'okay',  color: 'text-amber-500 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  { icon: '😔', key: 'low',   color: 'text-purple-500 dark:text-purple-400',bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
];

/* ─── Helpers ─── */
function toDateStr(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function isSameDay(a, b) { return toDateStr(a) === toDateStr(b); }
function getGreetingHour() {
  return new Date().getHours();
}

/* ─── Stat Card ─── */
const StatCard = ({ icon, label, value, colorClass, bgClass }) => (
  <div className="stat-card group transition-all hover:shadow-md hover:-translate-y-0.5">
    <div className={`p-2.5 rounded-xl ${bgClass}`}>
      <span className={`text-lg ${colorClass}`}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none mt-0.5 tnum">{value}</p>
    </div>
  </div>
);

/* ─── Gratitude entry ─── */
const GratitudeEntry = ({ entry }) => (
  <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:shadow-sm transition-shadow">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs text-gray-400 flex items-center gap-1">
        <FiCalendar className="h-3 w-3" />{entry.formattedDate}
      </span>
      <FiHeart className="h-3 w-3 text-pink-400" />
    </div>
    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap line-clamp-3">
      {entry.gratitude || entry.content}
    </p>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   Dashboard
══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { t } = useTranslation();
  const {
    user, visionBoard, fetchVisionBoard,
    streakCount, lastCheckIn,
    fetchMonthCalendarData, fetchRecentGratitude,
    addCheckIn,                       // legacy — kept for compat
    saveDailyLog, fetchDailyLog, fetchMonthDailyLogs,
  } = useStore();

  const { showSuccess, showError } = useToast();
  const { isPaid, openCheckout } = useSubscription();
  const greetingHour = getGreetingHour();
  const greeting = greetingHour < 12
    ? { text: t('dashboard.goodMorning'), icon: <FiSun className="text-amber-400" /> }
    : greetingHour < 17
    ? { text: t('dashboard.goodAfternoon'), icon: <FiCloud className="text-blue-400" /> }
    : { text: t('dashboard.goodEvening'), icon: <FiMoon className="text-indigo-400" /> };

  /* ── identity-driven affirmation deck ── */
  const affirmDeck = useMemo(() => {
    const fromFoundation = buildFoundationAffirmations(user?.foundation, t);
    if (fromFoundation) return fromFoundation;
    // Fallback to legacy static i18n affirmations
    return Array.from({ length: AFF_COUNT_FALLBACK }, (_, i) => ({
      emoji: AFF_EMOJIS[i],
      text: t(`dashboard.affirmations.${i}.text`),
      caption: t(`dashboard.affirmations.${i}.visualization`),
    }));
  }, [user?.foundation, t]);
  const affCount = affirmDeck.length;

  /* ── calendar state ── */
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  /* ── month logs map:  { "YYYY-MM-DD": { mood, intention, gratitude, checkIn } } ── */
  const [monthLogs, setMonthLogs] = useState({});

  /* ── current selected-day log ── */
  const [dayLog, setDayLog] = useState({ mood: null, intention: null, gratitude: '', checkIn: false });

  /* ── loading flags ── */
  const [isLoading, setIsLoading]             = useState(true);
  const [checkInLoading, setCheckInLoading]   = useState(false);
  const [savingGratitude, setSavingGratitude] = useState(false);
  const [savingIntention, setSavingIntention] = useState(false);
  const [showIntentionInput, setShowIntentionInput] = useState(false);
  const [intentionDraft, setIntentionDraft]   = useState('');
  const [savingMood, setSavingMood]           = useState(false);
  const [monthLoading, setMonthLoading]       = useState(false);

  /* ── recent entries for "Recent Gratitude" list ── */
  const [recentEntries, setRecentEntries] = useState([]);

  /* ── affirmation carousel ── */
  const [affirmIdx, setAffirmIdx] = useState(0);
  const affirmTimer = useRef(null);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const pausedRef = useRef(false);
  const [carouselPaused, setCarouselPaused] = useState(false);
  /* ── request race guards ── */
  const fetchTokenRef = useRef(0);
  const monthTokenRef = useRef(0);

  /* ── derived ── */
  const todayStr    = toDateStr(new Date());
  const selectedStr = toDateStr(selectedDate);
  const isToday     = selectedStr === todayStr;
  const isCurrentMonth = todayStr.slice(0, 7) === toDateStr(currentDate).slice(0, 7);
  const savedGratitude = (monthLogs[selectedStr]?.gratitude || '').trim();
  const gratitudeDirty = (dayLog.gratitude || '').trim() !== savedGratitude;
  const goToToday = () => { const now = new Date(); setCurrentDate(now); setSelectedDate(now); };

  /* ════════════════════════════ init load ════════════════════════════ */
  useEffect(() => {
    const load = async () => {
      await fetchVisionBoard();
      await loadMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
      await loadRecentEntries();
      setIsLoading(false);
    };
    load();
  }, [affCount]);

  /* ═══════════ affirmation carousel timer — paused on hover / focus / hidden tab ═══════════ */
  const syncCarouselPaused = () => {
    const p = hoverRef.current || focusRef.current || document.hidden;
    pausedRef.current = p;
    setCarouselPaused(p);
  };

  useEffect(() => {
    if (carouselPaused) return;
    affirmTimer.current = setInterval(() => setAffirmIdx(p => (p + 1) % affCount), 5500);
    return () => { clearInterval(affirmTimer.current); affirmTimer.current = null; };
  }, [affCount, carouselPaused]);

  useEffect(() => {
    const onVisibility = () => syncCarouselPaused();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* ════════════════════════════ month change ════════════════════════════ */
  useEffect(() => {
    setMonthLogs({});
    loadMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate]);

  /* ════════════════════════════ selected date change ════════════════════════════ */
  useEffect(() => {
    const token = ++fetchTokenRef.current; // invalidates any in-flight fetch for a previous date
    // First apply whatever we already have in monthLogs (instant render)
    const cached = monthLogs[selectedStr];
    if (cached) {
      setDayLog({ mood: null, intention: null, gratitude: '', checkIn: false, ...cached });
      setIntentionDraft(cached.intention || '');
    } else {
      setDayLog({ mood: null, intention: null, gratitude: '', checkIn: false });
      setIntentionDraft('');
    }
    setShowIntentionInput(false);

    // Then fetch the full dailyLog for this date from Firestore (gets mood + intention)
    fetchDailyLog(selectedDate).then(({ log }) => {
      if (token !== fetchTokenRef.current) return; // stale — a newer date was selected meanwhile
      if (log) {
        setDayLog(prev => ({ ...prev, ...log }));
        setIntentionDraft(log.intention || '');
        // Keep monthLogs in sync
        setMonthLogs(prev => ({
          ...prev,
          [selectedStr]: { ...(prev[selectedStr] || {}), ...log },
        }));
      }
    });
  }, [selectedStr]);

  /* ─── loaders ─── */
  async function loadMonth(year, month) {
    const token = ++monthTokenRef.current; // invalidates any in-flight load for a previous month
    setMonthLoading(true);
    try {
      const { logs } = await fetchMonthDailyLogs(year, month);
      // Also merge legacy data (checkIns + gratitudeEntries) for backward compat
      const { data: legacyData } = await fetchMonthCalendarData(year, month);
      if (token !== monthTokenRef.current) return; // stale — a newer month was requested meanwhile
      const merged = { ...logs };
      Object.entries(legacyData || {}).forEach(([dateStr, v]) => {
        if (!merged[dateStr]) merged[dateStr] = {};
        if (v.checkIn)   merged[dateStr].checkIn   = merged[dateStr].checkIn   || true;
        if (v.gratitude) merged[dateStr].gratitude = merged[dateStr].gratitude || v.gratitude;
      });
      setMonthLogs(merged);
    } finally {
      if (token === monthTokenRef.current) setMonthLoading(false);
    }
  }

  async function loadRecentEntries() {
    const { entries } = await fetchRecentGratitude(7);
    setRecentEntries(entries || []);
  }

  /* ════════════════════════════ actions ════════════════════════════ */
  const handleCheckIn = async () => {
    if (checkInLoading || dayLog.checkIn) return;
    setCheckInLoading(true);
    // Optimistic
    const updated = { ...dayLog, checkIn: true };
    setDayLog(updated);
    setMonthLogs(prev => ({ ...prev, [selectedStr]: updated }));
    try {
      const result = await saveDailyLog(selectedDate, { checkIn: true });
      if (result.success) {
        showSuccess(t('dashboard.checkInSuccess'), 2000);
      } else {
        setDayLog(prev => ({ ...prev, checkIn: false }));
        showError(result.error || t('dashboard.checkInFailed'));
      }
    } catch {
      setDayLog(prev => ({ ...prev, checkIn: false }));
      showError(t('dashboard.checkInError'));
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleSaveMood = async (moodLabel) => {
    if (savingMood) return;
    const prevMood = dayLog.mood;
    const updated = { ...dayLog, mood: moodLabel };
    setDayLog(updated);
    setMonthLogs(prev => ({ ...prev, [selectedStr]: updated }));
    setSavingMood(true);
    try {
      const result = await saveDailyLog(selectedDate, { mood: moodLabel });
      if (!result.success) throw new Error(result.error || 'save failed');
      // success: no toast — the selected ring on the mood button is feedback enough
    } catch {
      // rollback the optimistic mood on failure
      setDayLog(prev => ({ ...prev, mood: prevMood }));
      setMonthLogs(prev => ({ ...prev, [selectedStr]: { ...(prev[selectedStr] || {}), mood: prevMood } }));
      showError(t('dashboard.moodSaveFailed', { defaultValue: 'Could not save your mood. Try again.' }));
    } finally {
      setSavingMood(false);
    }
  };

  const handleSaveIntention = async () => {
    if (!intentionDraft.trim()) return;
    setSavingIntention(true);
    const updated = { ...dayLog, intention: intentionDraft.trim() };
    setDayLog(updated);
    setMonthLogs(prev => ({ ...prev, [selectedStr]: updated }));
    setShowIntentionInput(false);
    const result = await saveDailyLog(selectedDate, { intention: intentionDraft.trim() });
    setSavingIntention(false);
    if (result.success) showSuccess(t('dashboard.intentionSaved'), 1800);
    else showError(t('dashboard.failedSaveIntention'));
  };

  const handleSaveGratitude = async () => {
    if (!dayLog.gratitude?.trim() || savingGratitude) return;
    setSavingGratitude(true);
    const result = await saveDailyLog(selectedDate, { gratitude: dayLog.gratitude.trim() });
    setSavingGratitude(false);
    if (result.success) {
      setMonthLogs(prev => ({ ...prev, [selectedStr]: { ...dayLog } }));
      showSuccess(t('dashboard.gratitudeSaved'), 2000);
      await loadRecentEntries();
    } else {
      showError(result.error || t('dashboard.gratitudeSaveFailed'));
    }
  };

  /* ── calendar helpers ── */
  const getMonthName = d => d.toLocaleString('default', { month: 'long', year: 'numeric' });
  const getCalendarDays = () => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++)
      days.unshift({ date: new Date(year, month, 0 - i), isCurrentMonth: false });
    for (let i = 1; i <= lastDay.getDate(); i++)
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    const rem = 42 - days.length;
    for (let i = 1; i <= rem; i++)
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    return days;
  };

  const stats = [
    { icon: <FiBookmark />,  label: t('dashboard.visionItems'), value: visionBoard.length, colorClass: 'text-indigo-500', bgClass: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { icon: <FiTrendingUp />,label: t('dashboard.inProgress'),  value: visionBoard.filter(v => !v.completed).length, colorClass: 'text-blue-500', bgClass: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: <FiCheck />,     label: t('dashboard.completed'),   value: visionBoard.filter(v => v.completed).length,  colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: <FiZap />,       label: t('dashboard.currentStreak'),value: streakCount, colorClass: 'text-amber-500', bgClass: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  // Per-level lens stats — mirrors the Vision Board's four-level hierarchy.
  const lensStats = LENS_LEVELS.map((l) => {
    const items = visionBoard.filter((v) => (v.level || 'month') === l.id);
    const progress = items.length
      ? Math.round(items.reduce((a, i) => a + (i.progress || 0), 0) / items.length)
      : 0;
    return { ...l, count: items.length, progress };
  });
  const selectedMoodDef = MOOD_DEFS.find((m) => t(`dashboard.moods.${m.key}`) === dayLog.mood);

  if (isLoading) return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <IndexNotification />
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('dashboard.loading', { defaultValue: 'Loading your manifestation hub…' })}</p>
      <div className="space-y-5">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="lg:col-span-7 space-y-5">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      
      <IndexNotification />

      {/* ── Welcome ── */}
      <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">{greeting.icon}<span className="text-sm font-medium text-gray-500 dark:text-gray-400">{greeting.text}</span></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.displayName || 'Manifestor'} ✨</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.manifestationJourney')}</p>
        </div>
      </div>

      {/* ── Identity hero (or onboarding nudge) ── */}
      {user?.foundation?.identityStatement ? (
        <Link
          to="/foundation"
          className="block mb-7 group"
        >
          <div className="relative rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/40 dark:via-gray-900 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/40 border-l-4 border-l-indigo-400 dark:border-l-indigo-500 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <FiUser className="w-3 h-3" />
                {t('dashboard.identity.tag')}
              </span>
              <FiEdit3 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-2 text-lg sm:text-xl font-serif italic text-gray-900 dark:text-white leading-snug">
              "{user.foundation.identityStatement}"
            </p>
            {user.foundation.oneMonthProject && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-1">
                <FiZap className="inline w-3 h-3 mr-1 text-amber-500" />
                {t('dashboard.identity.thisMonth')}: {user.foundation.oneMonthProject}
              </p>
            )}
          </div>
        </Link>
      ) : (
        <Link
          to="/foundation/onboard"
          className="block mb-7 group"
        >
          <div className="rounded-2xl p-5 border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                <FiZap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('dashboard.identity.setupTitle')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.identity.setupDesc')}</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </div>
        </Link>
      )}

      {/* ── Quick action ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link to="/reset" className="group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 hover:border-amber-300 dark:hover:border-amber-700/60 transition-colors">
          <span className="text-lg">☀️</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{t('dashboard.quick.reset')}</span>
        </Link>
        <Link to="/visionboard" className="group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-colors">
          <span className="text-lg">🎯</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{t('dashboard.quick.lens')}</span>
        </Link>
        <Link to="/reflect/weekly" className="group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-colors">
          <span className="text-lg">📅</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{t('dashboard.quick.reflect')}</span>
        </Link>
        <Link to="/foundation" className="group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 hover:border-purple-300 dark:hover:border-purple-700/60 transition-colors">
          <span className="text-lg">🪞</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{t('dashboard.quick.foundation')}</span>
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* ── Main grid: vision reflection (left) · today's practice + history (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ────── LEFT — Identity Lens + Vision Lenses snapshot (5/12) ────── */}
        <div className="lg:col-span-5 flex flex-col gap-5">

          {/* Identity Lens — affirmation carousel */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-5 shadow-lg shadow-purple-500/20 min-h-[170px] flex flex-col"
            onMouseEnter={() => { hoverRef.current = true; syncCarouselPaused(); }}
            onMouseLeave={() => { hoverRef.current = false; syncCarouselPaused(); }}
            onFocus={() => { focusRef.current = true; syncCarouselPaused(); }}
            onBlur={() => { focusRef.current = false; syncCarouselPaused(); }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <h2 className="text-xs font-semibold text-white/70 uppercase tracking-widest inline-flex items-center gap-1.5">
                {t('dashboard.aff.identityLens')}
                <span className="text-sm leading-none" aria-hidden="true">{affirmDeck[affirmIdx]?.emoji || ''}</span>
              </h2>
              {!user?.foundation && (
                <Link
                  to="/foundation"
                  className="text-[10px] uppercase tracking-wider font-semibold text-white/70 hover:text-white inline-flex items-center gap-1"
                >
                  {t('dashboard.aff.setup')}
                  <FiArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="flex-1 relative z-10">
              {affirmDeck.map((card, i) => (
                <div key={i} className="absolute inset-0 flex flex-col justify-center transition-opacity duration-700"
                  style={{ opacity: i === affirmIdx ? 1 : 0, pointerEvents: i === affirmIdx ? 'auto' : 'none' }}>
                  <p className="text-white font-semibold text-base leading-snug mb-3 italic flex items-start gap-2">
                    <span className="text-lg leading-none mt-0.5" aria-hidden="true">{card.emoji}</span>
                    <span>"{card.text}"</span>
                  </p>
                  <p className="text-white/85 text-xs leading-relaxed">{card.caption}</p>
                </div>
              ))}
            </div>
            <div role="tablist" aria-label={t('dashboard.aff.tablistLabel', { defaultValue: 'Affirmation carousel' })}
              className="relative z-10 flex gap-0.5 mt-auto pt-6">
              {affirmDeck.map((_, i) => (
                <button key={i} role="tab" aria-selected={i === affirmIdx}
                  aria-label={t('dashboard.aff.goTo', { defaultValue: 'Go to affirmation {{n}}', n: i + 1 })}
                  onClick={() => setAffirmIdx(i)}
                  className="focus-ring p-2 rounded-full outline-none group"
                >
                  <span className={`block h-1.5 rounded-full transition-all duration-300 ${i === affirmIdx ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Lens Snapshot — mirrors the Vision Board's four-level hierarchy */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2">
                <FiTarget className="text-indigo-500" />{t('dashboard.lensSnapshot', { defaultValue: 'Vision Lenses' })}
              </h2>
              <Link to="/visionboard" className="text-xs font-medium text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 inline-flex items-center gap-1">
                {t('dashboard.viewAll')}<FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {visionBoard.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.visionBoardEmpty')}</p>
                <Link to="/visionboard" className="mt-3 inline-flex items-center gap-2 btn btn-primary btn-sm">
                  <FiPlus className="w-4 h-4" />{t('dashboard.createVisionCard')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {lensStats.map((l) => (
                  <Link key={l.id} to={`/visionboard?level=${l.id}`}
                    className="group block p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 hover:border-indigo-200 dark:hover:border-indigo-700/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                        <span className="text-base leading-none" aria-hidden="true">{l.emoji}</span>
                        {t(`lens.${l.id}.label`)}
                        {l.count > 0 && <span className="text-xs font-normal text-gray-400 tnum">({l.count})</span>}
                      </span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tnum">{l.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${l.progress >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-400 to-purple-500'}`}
                        style={{ width: `${l.progress}%` }} />
                    </div>
                  </Link>
                ))}
                <Link to="/visionboard" className="block text-center text-xs font-medium text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 pt-1">
                  {t('dashboard.manageVisions', { defaultValue: 'Manage visions on the board →' })}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ────── RIGHT — Today's Practice + compact calendar (7/12) ────── */}
        <div className="lg:col-span-7 flex flex-col gap-5">

          {/* Today's Practice — the daily loop in one place */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 dark:from-indigo-950/30 dark:to-purple-950/30">
              <h2 className="section-title flex items-center gap-2">
                <FiZap className="text-amber-400" />
                {isToday ? t('dashboard.todaysPractice', { defaultValue: "Today's Practice" }) : t('dashboard.practiceFor', { defaultValue: 'Practice for' }) + ' ' + selectedDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
              </h2>
              {streakCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 font-medium whitespace-nowrap">
                  🔥 <span className="tnum">{streakCount}</span> {t('dashboard.dayStreak')}
                </span>
              )}
            </div>
            <div className="p-5 space-y-6">

              {/* Check-in */}
              {isToday ? (
                dayLog.checkIn ? (
                  <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-900/15 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm"><FiCheck className="w-4 h-4 text-white"/></div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('dashboard.checkedInToday')}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">{t('dashboard.keepUpGoodWork')}</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleCheckIn} disabled={checkInLoading}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                      checkInLoading ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:-translate-y-0.5'
                    }`}>
                    {checkInLoading ? <><FiLoader className="animate-spin"/> {t('dashboard.checkingIn', { defaultValue: 'Checking in…' })}</> : <><FiZap className="w-4 h-4"/>{t('dashboard.checkInNow')}</>}
                  </button>
                )
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  {dayLog.checkIn
                    ? <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium"><FiCheck className="w-4 h-4"/> {t('dashboard.checkedInOnDate')}</span>
                    : <span>{t('dashboard.noCheckInOnDate')}</span>}
                  <span className="text-xs text-gray-400 ml-auto">{t('dashboard.pickDateInCalendar', { defaultValue: 'pick a date on the calendar below' })}</span>
                </div>
              )}

              {/* Mood */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FiSmile className="text-purple-500" />{t('dashboard.howAreYouFeeling')}
                  {!isToday && dayLog.mood && <span className="text-xs font-normal text-gray-400">· {dayLog.mood}</span>}
                </h3>
                <div className={`grid grid-cols-4 gap-2 ${savingMood ? 'pointer-events-none opacity-70' : ''}`}>
                  {MOOD_DEFS.map(mood => {
                    const moodLabel = t(`dashboard.moods.${mood.key}`);
                    const selected = dayLog.mood === moodLabel;
                    return (
                      <button key={mood.key} onClick={() => isToday && handleSaveMood(moodLabel)}
                        disabled={!isToday || savingMood}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                          selected
                            ? `${mood.bg} ring-2 ring-offset-1 ring-indigo-400 scale-105`
                            : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        } ${!isToday ? 'opacity-60 cursor-default' : ''}`}>
                        <span className="text-2xl leading-none" aria-hidden="true">{mood.icon}</span>
                        <span className="sr-only">{moodLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intention */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiTarget className="text-indigo-500" />
                    {isToday ? t('dashboard.todayIntention') : t('dashboard.intentionFor', {date: selectedDate.toLocaleDateString()})}
                  </h3>
                  {isToday && !showIntentionInput && (
                    <button onClick={() => { setIntentionDraft(dayLog.intention || ''); setShowIntentionInput(true); }}
                      aria-label={t('dashboard.editIntention', { defaultValue: 'Edit intention' })}
                      className="focus-ring p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-500 transition-colors">
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {showIntentionInput ? (
                  <div className="space-y-2">
                    <input autoFocus value={intentionDraft} onChange={e => setIntentionDraft(e.target.value)}
                      onKeyDown={e => { if (e.key==='Enter') handleSaveIntention(); if (e.key==='Escape') setShowIntentionInput(false); }}
                      placeholder={
                        user?.foundation?.identityStatement
                          ? t('dashboard.intentionFromIdentity', { defaultValue: 'What would the ideal version of me do today?' })
                          : t('dashboard.intentionPlaceholder')
                      }
                      className="input w-full text-sm" maxLength={140} />
                    <div className="flex gap-2">
                      <button onClick={handleSaveIntention} disabled={savingIntention}
                        className="btn btn-primary btn-sm flex-1 text-xs">
                        {savingIntention ? <FiLoader className="animate-spin" /> : t('dashboard.setIntention')}
                      </button>
                      <button onClick={() => setShowIntentionInput(false)} className="btn btn-secondary btn-sm text-xs">{t('common.cancel')}</button>
                    </div>
                  </div>
                ) : dayLog.intention ? (
                  <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                    <span className="text-lg" aria-hidden="true">🎯</span>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 italic">"{dayLog.intention}"</p>
                  </div>
                ) : (
                  <button onClick={() => isToday && setShowIntentionInput(true)} disabled={!isToday}
                    className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 transition-all ${isToday ? 'hover:border-indigo-300 hover:text-indigo-400' : 'opacity-50 cursor-default'}`}>
                    <FiPlus className="w-4 h-4" />
                    {isToday ? t('dashboard.setIntentionPrompt') : t('dashboard.noIntentionRecorded')}
                  </button>
                )}
              </div>

              {/* Gratitude */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <FiHeart className="text-pink-500" />{t('dashboard.gratitudeJournal')}
                  {!isToday && <span className="text-xs font-normal text-gray-400 ml-1">· {selectedDate.toLocaleDateString()}</span>}
                </h3>
                <p className="text-xs text-gray-400 mb-3">{t('dashboard.gratitudeRaisesVibration')}</p>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-300 mb-2 uppercase tracking-wider">
                  {isToday ? t('dashboard.todayIAmGratefulFor') : t('dashboard.gratefulFor', { date: selectedDate.toLocaleDateString() })}
                </label>
                <textarea
                  value={dayLog.gratitude || ''}
                  onChange={e => setDayLog(prev => ({ ...prev, gratitude: e.target.value }))}
                  rows={3}
                  className="input w-full resize-none text-sm leading-relaxed"
                  placeholder={isToday ? t('dashboard.enterGratitude') : t('dashboard.enterGratitudeForDate')}
                />
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-xs">
                    {gratitudeDirty
                      ? <span className="text-amber-500 dark:text-amber-400 font-medium">{t('dashboard.unsavedChanges', { defaultValue: 'Unsaved changes' })}</span>
                      : savedGratitude
                        ? <span className="text-emerald-500 dark:text-emerald-400">{t('dashboard.saved')}</span>
                        : <span className="text-gray-400">{t('dashboard.nothingSavedYet')}</span>}
                  </span>
                  <button onClick={handleSaveGratitude}
                    disabled={!dayLog.gratitude?.trim() || savingGratitude}
                    className={`btn btn-sm text-xs font-semibold transition-all ${
                      !dayLog.gratitude?.trim() || savingGratitude
                        ? 'btn-disabled bg-gray-100 dark:bg-gray-800 text-gray-400'
                        : 'btn-primary shadow-sm hover:shadow-md hover:shadow-indigo-500/20'
                    }`}>
                    {savingGratitude
                      ? <><FiLoader className="animate-spin mr-1.5 w-3 h-3"/>{t('dashboard.saving', { defaultValue: 'Saving…' })}</>
                      : <><FiHeart className="mr-1.5 w-3 h-3"/>
                          {monthLogs[selectedStr]?.gratitude ? t('dashboard.updateGratitude') : t('dashboard.saveGratitude')}
                        </>}
                  </button>
                </div>
                {recentEntries.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FiStar className="text-amber-400 w-3.5 h-3.5"/>{t('dashboard.recentGratitude')}
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                      {recentEntries.map((entry, i) => <GratitudeEntry key={i} entry={entry}/>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calendar — compact history track */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2"><FiCalendar className="text-indigo-500" />{t('dashboard.calendarAndProgress')}</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1))}
                  aria-label={t('dashboard.prevMonth', { defaultValue: 'Previous month' })}
                  className="focus-ring p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                  <FiChevronLeft className="h-4 w-4"/>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-2 min-w-[140px] text-center">{getMonthName(currentDate)}</span>
                  {!isCurrentMonth && (
                    <button onClick={goToToday}
                      className="focus-ring text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium whitespace-nowrap">
                      {t('dashboard.goToday', { defaultValue: 'Today' })}
                    </button>
                  )}
                </div>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1))}
                  aria-label={t('dashboard.nextMonth', { defaultValue: 'Next month' })}
                  className="focus-ring p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                  <FiChevronRight className="h-4 w-4"/>
                </button>
              </div>
            </div>

            {monthLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-3 w-20" />
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 21 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-xl" />)}
                </div>
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>(
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-1">{d}</div>
                  ))}
                </div>

                {/* Cells — compact h-9 */}
                <div className="grid grid-cols-7 gap-0.5 mb-3">
                  {getCalendarDays().map((day, i) => {
                    const ds  = toDateStr(day.date);
                    const log = monthLogs[ds] || {};
                    const isT = ds === todayStr;
                    const isSel = ds === selectedStr;
                    return (
                      <button key={i} onClick={() => { setSelectedDate(day.date); if (!day.isCurrentMonth) setCurrentDate(day.date); }}
                        aria-label={day.date.toLocaleDateString()}
                        className={`focus-ring relative flex items-center justify-center h-9 rounded-lg text-xs font-medium transition-all ${
                          !day.isCurrentMonth ? 'text-gray-300 dark:text-gray-600'
                          : isSel ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300 dark:shadow-indigo-900'
                          : isT   ? 'ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-gray-900 text-indigo-600 dark:text-indigo-400 font-bold'
                          :         'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                        }`}>
                        <span className="tnum">{day.date.getDate()}</span>
                        <div className="absolute bottom-1 flex gap-0.5">
                          {log.checkIn   && <span className={`w-1 h-1 rounded-full ${isSel?'bg-white/80':'bg-emerald-400'}`}/>}
                          {log.gratitude && <span className={`w-1 h-1 rounded-full ${isSel?'bg-white/60':'bg-purple-400'}`}/>}
                          {log.mood      && <span className={`w-1 h-1 rounded-full ${isSel?'bg-white/50':'bg-amber-400'}`}/>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-5 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700/50 pt-3 mb-3">
                  {[['bg-emerald-400', t('dashboard.dailyCheckIn')],['bg-purple-400', t('dashboard.gratitudeJournal')],['bg-amber-400', t('dashboard.howAreYouFeeling')]].map(([c,l])=>(
                    <div key={l} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${c}`}/>{l}</div>
                  ))}
                </div>

                {/* Selected-day summary */}
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-700/50 pt-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {isToday ? t('dashboard.today') : selectedDate.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {dayLog.checkIn && <span className="inline-flex items-center gap-1"><FiCheck className="w-3.5 h-3.5 text-emerald-500"/> {t('dashboard.checkedInShort', { defaultValue: 'checked in' })}</span>}
                    {selectedMoodDef && <span aria-hidden="true" className="text-base leading-none">{selectedMoodDef.icon}</span>}
                    {dayLog.gratitude && <span className="inline-flex items-center gap-1"><FiHeart className="w-3.5 h-3.5 text-pink-400"/> {t('dashboard.gratitudeShort', { defaultValue: 'gratitude' })}</span>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;